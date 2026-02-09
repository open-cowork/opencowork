import io
import json
import mimetypes
import os
import re
import tempfile
import urllib.parse
import urllib.request
import uuid
import zipfile
from collections.abc import Callable
from pathlib import Path, PurePosixPath
from typing import Any, IO, Iterable

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.core.settings import get_settings
from app.models.plugin import Plugin
from app.models.user_plugin_install import UserPluginInstall
from app.repositories.plugin_repository import PluginRepository
from app.repositories.user_plugin_install_repository import UserPluginInstallRepository
from app.schemas.plugin_import import (
    PluginImportCandidate,
    PluginImportCommitRequest,
    PluginImportCommitResponse,
    PluginImportDiscoverResponse,
    PluginImportResultItem,
)
from app.services.storage_service import S3StorageService


_PLUGIN_NAME_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")
_FILENAME_CLEAN = re.compile(r"[^a-zA-Z0-9._-]+")
_MAX_FILES_PER_PLUGIN = 10_000
_MAX_UNCOMPRESSED_BYTES_PER_PLUGIN = 800 * 1024 * 1024


def _sanitize_filename(filename: str) -> str:
    clean = os.path.basename(filename or "").strip()
    clean = _FILENAME_CLEAN.sub("_", clean)
    return clean or "upload.zip"


def _validate_plugin_name(name: str) -> str:
    value = (name or "").strip()
    if not value or value in {".", ".."} or not _PLUGIN_NAME_PATTERN.fullmatch(value):
        raise AppException(
            error_code=ErrorCode.BAD_REQUEST,
            message=f"Invalid plugin name: {name}",
        )
    return value


def _safe_relative_path(value: str) -> PurePosixPath:
    raw = (value or "").strip()
    if not raw:
        raw = "."
    path = PurePosixPath(raw)
    if path.is_absolute() or ".." in path.parts:
        raise AppException(
            error_code=ErrorCode.BAD_REQUEST,
            message=f"Invalid relative path: {value}",
        )
    return path


def _is_ignored_path(path: PurePosixPath) -> bool:
    if "__MACOSX" in path.parts:
        return True
    if path.name == ".DS_Store":
        return True
    return False


def _extract_common_root(names: Iterable[str]) -> str | None:
    first_parts: set[str] = set()
    for name in names:
        p = PurePosixPath(name)
        if not p.parts:
            continue
        first_parts.add(p.parts[0])
        if len(first_parts) > 1:
            return None
    return next(iter(first_parts)) if first_parts else None


def _strip_common_root(path: PurePosixPath, common_root: str | None) -> PurePosixPath:
    if common_root and path.parts and path.parts[0] == common_root:
        try:
            return path.relative_to(common_root)
        except Exception:
            return path
    return path


def _extract_manifest_fields(
    manifest: dict[str, Any],
) -> tuple[str | None, str | None, str | None]:
    name = manifest.get("name")
    version = manifest.get("version")
    description = manifest.get("description")
    name_val = name.strip() if isinstance(name, str) else None
    version_val = version.strip() if isinstance(version, str) else None
    desc_val = description.strip() if isinstance(description, str) else None
    return (
        name_val or None,
        version_val or None,
        desc_val or None,
    )


class PluginImportService:
    def __init__(self, storage_service: S3StorageService | None = None) -> None:
        self.storage_service = storage_service or S3StorageService()

    def discover(
        self,
        db: Session,
        *,
        user_id: str,
        file: UploadFile | None,
        github_url: str | None,
    ) -> PluginImportDiscoverResponse:
        if bool(file) == bool(github_url):
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Exactly one of file or github_url must be provided",
            )

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_root = Path(tmp_dir)
            source_path: Path | None = None
            source_bytes: IO[bytes] | None = None
            source_name: str = "upload.zip"

            if file is not None:
                filename = _sanitize_filename(file.filename or "upload.zip")
                if not filename.lower().endswith(".zip"):
                    raise AppException(
                        error_code=ErrorCode.BAD_REQUEST,
                        message="Only .zip archives are supported",
                    )
                max_size_bytes = get_settings().max_upload_size_mb * 1024 * 1024
                size = self._get_upload_size(file)
                if size is not None and size > max_size_bytes:
                    raise AppException(
                        error_code=ErrorCode.BAD_REQUEST,
                        message=f"File too large. Max {get_settings().max_upload_size_mb}MB.",
                        details={"max_bytes": max_size_bytes, "actual_bytes": size},
                    )
                file.file.seek(0)
                source_bytes = file.file
                source_name = filename
            else:
                github_url = (github_url or "").strip()
                if not github_url:
                    raise AppException(
                        error_code=ErrorCode.BAD_REQUEST,
                        message="github_url cannot be empty",
                    )
                source_path = tmp_root / "github.zip"
                self._download_github_zip(
                    github_url=github_url, destination=source_path
                )
                source_name = "github.zip"

            candidates = self._scan_candidates(
                zip_source_path=source_path, zip_source_bytes=source_bytes
            )
            if not candidates:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="No plugin.json found in the archive",
                )

            response_candidates: list[PluginImportCandidate] = []
            for c in candidates:
                plugin_name = c.get("plugin_name")
                will_overwrite = (
                    bool(plugin_name)
                    and PluginRepository.get_by_name(db, str(plugin_name), user_id)
                    is not None
                )
                response_candidates.append(
                    PluginImportCandidate(
                        relative_path=str(c.get("relative_path") or "."),
                        plugin_name=str(plugin_name) if plugin_name else None,
                        version=str(c.get("version")) if c.get("version") else None,
                        description=str(c.get("description"))
                        if c.get("description")
                        else None,
                        requires_name=bool(c.get("requires_name")),
                        will_overwrite=will_overwrite,
                    )
                )

            archive_key = self._upload_archive(
                user_id=user_id,
                filename=source_name,
                source_path=source_path,
                source_bytes=source_bytes,
            )

            return PluginImportDiscoverResponse(
                archive_key=archive_key,
                candidates=response_candidates,
            )

    def commit(
        self,
        db: Session,
        *,
        user_id: str,
        request: PluginImportCommitRequest,
        on_progress: Callable[[int, int], None] | None = None,
    ) -> PluginImportCommitResponse:
        archive_key = (request.archive_key or "").strip()
        if not archive_key:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="archive_key cannot be empty",
            )
        self._require_archive_owner(user_id=user_id, archive_key=archive_key)

        if not request.selections:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="selections cannot be empty",
            )

        unique_selections: list[tuple[str, str | None]] = []
        seen_paths: set[str] = set()
        for selection in request.selections:
            rel_raw = (selection.relative_path or "").strip() or "."
            if rel_raw in seen_paths:
                continue
            seen_paths.add(rel_raw)
            unique_selections.append((rel_raw, selection.name_override))

        total = len(unique_selections)
        processed = 0

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_root = Path(tmp_dir)
            zip_path = tmp_root / "archive.zip"
            self.storage_service.download_file(key=archive_key, destination=zip_path)

            try:
                zipf = zipfile.ZipFile(zip_path)
            except zipfile.BadZipFile as exc:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="Invalid zip archive",
                ) from exc

            with zipf:
                candidates = self._scan_candidates(
                    zip_source_path=zip_path, zip_source_bytes=None
                )
                candidate_by_path = {c["relative_path"]: c for c in candidates}
                candidate_dirs = [
                    _safe_relative_path(c["relative_path"]) for c in candidates
                ]

                items: list[PluginImportResultItem] = []
                for rel_raw, name_override in unique_selections:
                    try:
                        item = self._import_one(
                            db=db,
                            user_id=user_id,
                            zipf=zipf,
                            candidate_by_path=candidate_by_path,
                            candidate_dirs=candidate_dirs,
                            relative_path=rel_raw,
                            name_override=name_override,
                            archive_key=archive_key,
                        )
                        items.append(item)
                    except AppException as exc:
                        db.rollback()
                        items.append(
                            PluginImportResultItem(
                                relative_path=rel_raw,
                                status="failed",
                                error=str(exc.message),
                            )
                        )
                    except Exception as exc:
                        db.rollback()
                        items.append(
                            PluginImportResultItem(
                                relative_path=rel_raw,
                                status="failed",
                                error=str(exc),
                            )
                        )

                    processed += 1
                    if on_progress is not None:
                        try:
                            on_progress(processed, total)
                        except Exception:
                            pass

                return PluginImportCommitResponse(items=items)

    @staticmethod
    def _get_upload_size(file: UploadFile) -> int | None:
        try:
            file.file.seek(0, os.SEEK_END)
            size = file.file.tell()
            file.file.seek(0)
            return size
        except Exception:
            return None

    def _upload_archive(
        self,
        *,
        user_id: str,
        filename: str,
        source_path: Path | None,
        source_bytes: IO[bytes] | None,
    ) -> str:
        archive_id = str(uuid.uuid4())
        safe_name = _sanitize_filename(filename)
        key = f"plugin-imports/{user_id}/{archive_id}/{safe_name}"

        if source_path is not None:
            with source_path.open("rb") as f:
                self.storage_service.upload_fileobj(
                    fileobj=f, key=key, content_type="application/zip"
                )
            return key
        if source_bytes is not None:
            try:
                source_bytes.seek(0)
            except Exception:
                pass
            self.storage_service.upload_fileobj(
                fileobj=source_bytes, key=key, content_type="application/zip"
            )
            return key

        raise AppException(
            error_code=ErrorCode.BAD_REQUEST,
            message="No archive source provided",
        )

    @staticmethod
    def _require_archive_owner(*, user_id: str, archive_key: str) -> None:
        expected_prefix = f"plugin-imports/{user_id}/"
        if not archive_key.startswith(expected_prefix):
            raise AppException(
                error_code=ErrorCode.FORBIDDEN,
                message="Archive does not belong to the user",
            )

    @staticmethod
    def _scan_candidates(
        *,
        zip_source_path: Path | None,
        zip_source_bytes: IO[bytes] | None,
    ) -> list[dict[str, Any]]:
        if zip_source_path is None and zip_source_bytes is None:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="No zip source provided",
            )

        try:
            zipf = (
                zipfile.ZipFile(zip_source_path)
                if zip_source_path is not None
                else zipfile.ZipFile(zip_source_bytes)  # type: ignore[arg-type]
            )
        except zipfile.BadZipFile as exc:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Invalid zip archive",
            ) from exc

        with zipf:
            names: list[str] = []
            for info in zipf.infolist():
                if info.is_dir() or not info.filename:
                    continue
                p = PurePosixPath(info.filename)
                if _is_ignored_path(p):
                    continue
                if p.is_absolute() or ".." in p.parts:
                    continue
                names.append(info.filename)
            common_root = _extract_common_root(names)

            found_dirs: set[str] = set()
            results: list[dict[str, Any]] = []
            for info in zipf.infolist():
                if info.is_dir() or not info.filename:
                    continue
                raw_path = PurePosixPath(info.filename)
                if _is_ignored_path(raw_path):
                    continue
                if raw_path.is_absolute() or ".." in raw_path.parts:
                    continue
                if raw_path.name.lower() != "plugin.json":
                    continue
                if raw_path.parent.name != ".claude-plugin":
                    continue

                rel_path = _strip_common_root(raw_path, common_root)
                plugin_root = rel_path.parent.parent
                relative_dir = (
                    plugin_root.as_posix() if plugin_root != PurePosixPath(".") else "."
                )

                if relative_dir in found_dirs:
                    continue

                manifest_obj: dict[str, Any] | None = None
                try:
                    with zipf.open(info, "r") as f:
                        raw = f.read()
                    parsed = json.loads(raw.decode("utf-8"))
                    if isinstance(parsed, dict):
                        manifest_obj = parsed
                except Exception:
                    manifest_obj = None

                plugin_name: str | None = None
                version: str | None = None
                description: str | None = None
                requires_name = False
                if manifest_obj is not None:
                    plugin_name, version, description = _extract_manifest_fields(
                        manifest_obj
                    )
                    if plugin_name:
                        try:
                            plugin_name = _validate_plugin_name(plugin_name)
                        except Exception:
                            requires_name = True
                            plugin_name = None
                    else:
                        requires_name = True
                else:
                    requires_name = True

                found_dirs.add(relative_dir)
                results.append(
                    {
                        "relative_path": relative_dir,
                        "plugin_name": plugin_name,
                        "version": version,
                        "description": description,
                        "requires_name": requires_name,
                    }
                )

            return results

    @staticmethod
    def _download_github_zip(*, github_url: str, destination: Path) -> None:
        parsed = urllib.parse.urlparse(github_url)
        if parsed.scheme not in {"http", "https"}:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Invalid GitHub URL",
            )
        if parsed.netloc.lower() != "github.com":
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Only github.com is supported",
            )

        path = parsed.path.strip("/")
        segments = [s for s in path.split("/") if s]
        if len(segments) < 2:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Invalid GitHub repository URL",
            )
        owner = segments[0]
        repo = segments[1].removesuffix(".git")

        if parsed.path.endswith(".zip") and "/archive/" in parsed.path:
            download_url = github_url
            PluginImportService._download_with_limit(download_url, destination)
            return

        branch: str | None = None
        if len(segments) >= 4 and segments[2] in {"tree", "blob"}:
            branch = segments[3]

        candidates = [branch] if branch else ["main", "master"]
        last_error: Exception | None = None
        for b in candidates:
            if not b:
                continue
            download_url = (
                f"https://github.com/{owner}/{repo}/archive/refs/heads/{b}.zip"
            )
            try:
                PluginImportService._download_with_limit(download_url, destination)
                return
            except Exception as exc:
                last_error = exc
                continue

        raise AppException(
            error_code=ErrorCode.BAD_REQUEST,
            message=f"Failed to download GitHub archive: {last_error}",
        )

    @staticmethod
    def _download_with_limit(url: str, destination: Path) -> None:
        max_size_bytes = get_settings().max_upload_size_mb * 1024 * 1024
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "poco-agent-plugin-import/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                length = resp.headers.get("Content-Length")
                if length:
                    try:
                        if int(length) > max_size_bytes:
                            raise AppException(
                                error_code=ErrorCode.BAD_REQUEST,
                                message=f"GitHub archive too large. Max {get_settings().max_upload_size_mb}MB.",
                                details={
                                    "max_bytes": max_size_bytes,
                                    "content_length": int(length),
                                },
                            )
                    except ValueError:
                        pass

                destination.parent.mkdir(parents=True, exist_ok=True)
                written = 0
                with destination.open("wb") as f:
                    while True:
                        chunk = resp.read(1024 * 1024)
                        if not chunk:
                            break
                        written += len(chunk)
                        if written > max_size_bytes:
                            raise AppException(
                                error_code=ErrorCode.BAD_REQUEST,
                                message=f"GitHub archive too large. Max {get_settings().max_upload_size_mb}MB.",
                                details={
                                    "max_bytes": max_size_bytes,
                                    "downloaded_bytes": written,
                                },
                            )
                        f.write(chunk)
        except AppException:
            raise
        except Exception as exc:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message=f"Failed to download GitHub archive: {exc}",
            ) from exc

    def _import_one(
        self,
        *,
        db: Session,
        user_id: str,
        zipf: zipfile.ZipFile,
        candidate_by_path: dict[str, dict[str, Any]],
        candidate_dirs: list[PurePosixPath],
        relative_path: str,
        name_override: str | None,
        archive_key: str,
    ) -> PluginImportResultItem:
        candidate = candidate_by_path.get(relative_path)
        if candidate is None:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message=f"Unknown candidate path: {relative_path}",
            )

        requires_name = bool(candidate.get("requires_name"))
        parsed_name = candidate.get("plugin_name")
        if requires_name:
            if not name_override or not name_override.strip():
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message=f"name_override is required for {relative_path}",
                )
            plugin_name = _validate_plugin_name(name_override)
        else:
            plugin_name = _validate_plugin_name(str(parsed_name or ""))
            if (
                name_override
                and name_override.strip()
                and name_override.strip() != plugin_name
            ):
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message=f"name_override is not allowed for {relative_path}",
                )

        selection_path = _safe_relative_path(relative_path)

        nested_candidate_dirs: list[PurePosixPath] = []
        for cdir in candidate_dirs:
            if cdir == selection_path:
                continue
            if selection_path == PurePosixPath("."):
                nested_candidate_dirs.append(cdir)
                continue
            if (
                len(cdir.parts) >= len(selection_path.parts)
                and cdir.parts[: len(selection_path.parts)] == selection_path.parts
            ):
                nested_candidate_dirs.append(cdir)

        version_id = str(uuid.uuid4())
        prefix = f"plugins/{user_id}/{plugin_name}/{version_id}/"

        manifest_json = self._upload_plugin_from_zip(
            zipf=zipf,
            selection_dir=selection_path,
            exclude_dirs=nested_candidate_dirs,
            destination_prefix=prefix,
            name_override=plugin_name if requires_name else None,
        )
        if manifest_json is None:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message=f"Missing plugin manifest under {relative_path}",
            )

        source: dict[str, Any] = {
            "archive_key": archive_key,
            "relative_path": relative_path,
        }
        entry = {
            "s3_key": prefix,
            "is_prefix": True,
            "source": source,
        }

        existing = PluginRepository.get_by_name(db, plugin_name, user_id)
        overwritten = existing is not None
        if existing is None:
            plugin = Plugin(
                name=plugin_name,
                scope="user",
                owner_user_id=user_id,
                entry=entry,
                manifest=manifest_json,
                version=str(manifest_json.get("version")).strip()
                if isinstance(manifest_json.get("version"), str)
                else None,
                description=str(manifest_json.get("description")).strip()
                if isinstance(manifest_json.get("description"), str)
                else None,
            )
            PluginRepository.create(db, plugin)
            db.flush()
        else:
            plugin = existing
            plugin.entry = entry
            plugin.manifest = manifest_json
            plugin.version = (
                str(manifest_json.get("version")).strip()
                if isinstance(manifest_json.get("version"), str)
                else None
            )
            plugin.description = (
                str(manifest_json.get("description")).strip()
                if isinstance(manifest_json.get("description"), str)
                else None
            )

        install = UserPluginInstallRepository.get_by_user_and_plugin(
            db, user_id, plugin.id
        )
        if install is None:
            install = UserPluginInstall(
                user_id=user_id, plugin_id=plugin.id, enabled=True
            )
            UserPluginInstallRepository.create(db, install)
        else:
            if getattr(install, "is_deleted", False):
                install.is_deleted = False
            install.enabled = True

        db.commit()
        db.refresh(plugin)
        db.refresh(install)

        return PluginImportResultItem(
            relative_path=relative_path,
            plugin_name=plugin_name,
            plugin_id=plugin.id,
            overwritten=overwritten,
            status="success",
        )

    def _upload_plugin_from_zip(
        self,
        *,
        zipf: zipfile.ZipFile,
        selection_dir: PurePosixPath,
        exclude_dirs: list[PurePosixPath],
        destination_prefix: str,
        name_override: str | None,
    ) -> dict[str, Any] | None:
        infos = [
            info for info in zipf.infolist() if info.filename and not info.is_dir()
        ]
        common_root_names: list[str] = []
        for info in infos:
            p = PurePosixPath(info.filename)
            if _is_ignored_path(p):
                continue
            if p.is_absolute() or ".." in p.parts:
                continue
            common_root_names.append(info.filename)
        common_root = _extract_common_root(common_root_names)

        uploaded = 0
        total_uncompressed = 0
        manifest_obj: dict[str, Any] | None = None

        for info in infos:
            raw_path = PurePosixPath(info.filename)
            if raw_path.is_absolute() or ".." in raw_path.parts:
                continue
            if _is_ignored_path(raw_path):
                continue
            rel_path = _strip_common_root(raw_path, common_root)
            if rel_path == PurePosixPath("."):
                continue

            if selection_dir != PurePosixPath("."):
                if len(rel_path.parts) < len(selection_dir.parts):
                    continue
                if rel_path.parts[: len(selection_dir.parts)] != selection_dir.parts:
                    continue

            excluded = False
            for ex in exclude_dirs:
                if ex == PurePosixPath("."):
                    excluded = True
                    break
                if (
                    len(rel_path.parts) >= len(ex.parts)
                    and rel_path.parts[: len(ex.parts)] == ex.parts
                ):
                    excluded = True
                    break
            if excluded:
                continue

            if selection_dir == PurePosixPath("."):
                relative_in_plugin = rel_path
            else:
                try:
                    relative_in_plugin = rel_path.relative_to(selection_dir)
                except Exception:
                    continue
            if relative_in_plugin.is_absolute() or ".." in relative_in_plugin.parts:
                continue

            key = f"{destination_prefix}{relative_in_plugin.as_posix()}"
            content_type, _ = mimetypes.guess_type(relative_in_plugin.name)

            total_uncompressed += int(getattr(info, "file_size", 0) or 0)
            if total_uncompressed > _MAX_UNCOMPRESSED_BYTES_PER_PLUGIN:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="Plugin archive is too large after extraction",
                    details={
                        "max_uncompressed_bytes": _MAX_UNCOMPRESSED_BYTES_PER_PLUGIN,
                        "total_uncompressed_bytes": total_uncompressed,
                    },
                )
            if uploaded >= _MAX_FILES_PER_PLUGIN:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="Plugin archive contains too many files",
                    details={"max_files": _MAX_FILES_PER_PLUGIN},
                )

            is_manifest = (
                relative_in_plugin.name.lower() == "plugin.json"
                and len(relative_in_plugin.parts) >= 2
                and relative_in_plugin.parts[-2] == ".claude-plugin"
            )
            if is_manifest:
                with zipf.open(info, "r") as f:
                    raw = f.read()
                try:
                    parsed = json.loads(raw.decode("utf-8"))
                    if not isinstance(parsed, dict):
                        raise ValueError("plugin.json must be an object")
                    if name_override:
                        parsed["name"] = name_override
                    manifest_obj = parsed
                except Exception as exc:
                    raise AppException(
                        error_code=ErrorCode.BAD_REQUEST,
                        message=f"Invalid plugin.json: {exc}",
                    ) from exc

                patched = json.dumps(
                    manifest_obj, ensure_ascii=False, indent=2, sort_keys=True
                ).encode("utf-8")
                self.storage_service.upload_fileobj(
                    fileobj=io.BytesIO(patched),
                    key=key,
                    content_type=content_type or "application/json",
                )
                uploaded += 1
                continue

            with zipf.open(info, "r") as f:
                self.storage_service.upload_fileobj(
                    fileobj=f, key=key, content_type=content_type
                )
            uploaded += 1

        return manifest_obj
