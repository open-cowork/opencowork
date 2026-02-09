import logging
import re
import shutil
import time
from pathlib import Path
from typing import Any

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.services.storage_service import S3StorageService
from app.services.workspace_manager import WorkspaceManager

logger = logging.getLogger(__name__)


class PluginStager:
    def __init__(
        self,
        storage_service: S3StorageService | None = None,
        workspace_manager: WorkspaceManager | None = None,
    ) -> None:
        self.storage_service = storage_service or S3StorageService()
        self.workspace_manager = workspace_manager or WorkspaceManager()

    @staticmethod
    def _validate_plugin_name(name: str) -> None:
        if name in {".", ".."} or not re.fullmatch(r"[A-Za-z0-9._-]+", name):
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message=f"Invalid plugin name: {name}",
            )

    @staticmethod
    def _clean_plugins_dir(plugins_root: Path, keep_names: set[str]) -> int:
        removed = 0
        plugins_root_resolved = plugins_root.resolve()
        for entry in plugins_root.iterdir():
            if not entry.is_dir() or entry.is_symlink():
                continue
            if entry.name in keep_names:
                continue
            try:
                entry.resolve().relative_to(plugins_root_resolved)
            except Exception:
                continue
            try:
                shutil.rmtree(entry)
                removed += 1
            except Exception:
                continue
        return removed

    def stage_plugins(
        self, user_id: str, session_id: str, plugins: dict[str, Any]
    ) -> dict[str, dict[str, Any]]:
        started_total = time.perf_counter()

        session_dir = self.workspace_manager.get_workspace_path(
            user_id=user_id, session_id=session_id, create=True
        )
        workspace_dir = session_dir / "workspace"
        plugins_root = workspace_dir / ".claude_data" / "plugins"
        plugins_root.mkdir(parents=True, exist_ok=True)

        enabled_names: set[str] = set()
        for name, spec in (plugins or {}).items():
            if not isinstance(spec, dict):
                continue
            self._validate_plugin_name(name)
            if spec.get("enabled") is False:
                continue
            enabled_names.add(name)

        removed = self._clean_plugins_dir(plugins_root, enabled_names)

        staged: dict[str, dict[str, Any]] = {}
        plugins_root_resolved = plugins_root.resolve()
        for name, spec in (plugins or {}).items():
            if not isinstance(spec, dict):
                continue
            self._validate_plugin_name(name)
            if spec.get("enabled") is False:
                staged[name] = {"enabled": False}
                continue
            entry = spec.get("entry") if isinstance(spec.get("entry"), dict) else spec
            s3_key = entry.get("s3_key") or entry.get("key")
            if not s3_key:
                continue
            target_dir = (plugins_root / name).resolve()
            if plugins_root_resolved not in target_dir.parents:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message=f"Invalid plugin path: {name}",
                )
            target_dir.mkdir(parents=True, exist_ok=True)

            try:
                step_started = time.perf_counter()
                if entry.get("is_prefix") or str(s3_key).endswith("/"):
                    self.storage_service.download_prefix(
                        prefix=str(s3_key), destination_dir=target_dir
                    )
                else:
                    filename = Path(str(s3_key)).name
                    destination = target_dir / filename
                    self.storage_service.download_file(
                        key=str(s3_key), destination=destination
                    )
                logger.info(
                    "timing",
                    extra={
                        "step": "plugin_stage_download",
                        "duration_ms": int((time.perf_counter() - step_started) * 1000),
                        "user_id": user_id,
                        "session_id": session_id,
                        "plugin_name": name,
                        "s3_key": str(s3_key),
                        "is_prefix": bool(entry.get("is_prefix"))
                        or str(s3_key).endswith("/"),
                    },
                )
            except Exception as exc:
                raise AppException(
                    error_code=ErrorCode.PLUGIN_DOWNLOAD_FAILED,
                    message=f"Failed to stage plugin {name}: {exc}",
                ) from exc

            staged[name] = {
                **spec,
                "enabled": True,
                "local_path": str(target_dir),
                "entry": entry,
            }

        logger.info(
            "timing",
            extra={
                "step": "plugin_stage_total",
                "duration_ms": int((time.perf_counter() - started_total) * 1000),
                "user_id": user_id,
                "session_id": session_id,
                "plugins_requested": len(plugins or {}),
                "plugins_staged": len(staged),
                "plugins_removed": removed,
            },
        )
        return staged
