import logging
import os
import shutil
from pathlib import Path

from app.schemas.request import TaskConfig
from app.utils.git.operations import (
    GitCommandError,
    clone,
    init_repository,
    is_repository,
    checkout,
    fetch,
)

logger = logging.getLogger(__name__)

DEFAULT_GIT_EXCLUDES = [
    ".claude_data/",
    ".claude/",
    "inputs/",
]


class WorkspaceManager:
    def __init__(self, mount_path: str = "/workspace"):
        self.root_path = Path(mount_path)
        self.work_path = self.root_path
        self.claude_config_path = self.root_path / ".claude"
        self.inputs_root = self.root_path / "inputs"

        self.persistent_claude_data = self.root_path / ".claude_data"
        self.system_claude_home = Path.home() / ".claude"

    async def prepare(self, config: TaskConfig):
        if not self.root_path.exists():
            self.root_path.mkdir(parents=True, exist_ok=True)

        await self._setup_session_persistence()
        self.work_path = self._prepare_repository(config)
        self._ensure_inputs_dir(self.work_path)
        self._ensure_git_excludes(self.work_path)

    async def _setup_session_persistence(self):
        self.persistent_claude_data.mkdir(exist_ok=True)

        if self.system_claude_home.exists() or self.system_claude_home.is_symlink():
            if self.system_claude_home.is_symlink():
                self.system_claude_home.unlink()
            else:
                shutil.rmtree(self.system_claude_home)

        self.system_claude_home.symlink_to(self.persistent_claude_data)

    async def cleanup(self):
        # Restore system ~/.claude if it was symlinked
        if self.system_claude_home.is_symlink():
            self.system_claude_home.unlink()

    def _prepare_repository(self, config: TaskConfig) -> Path:
        repo_url = (config.repo_url or "").strip()
        if repo_url:
            return self._ensure_cloned_repo(repo_url, config.git_branch)

        self._ensure_git_repo(self.root_path)
        return self.root_path

    def _ensure_cloned_repo(self, repo_url: str, branch: str | None) -> Path:
        repo_path = self._derive_repo_path(repo_url)

        if repo_path.exists() and is_repository(repo_path):
            self._checkout_branch(repo_path, branch)
            return repo_path

        if not repo_path.exists():
            try:
                return clone(repo_url, path=repo_path, branch=branch)
            except Exception as exc:
                if branch:
                    try:
                        return clone(repo_url, path=repo_path)
                    except Exception as fallback_exc:
                        logger.warning(
                            f"Failed to clone repo {repo_url} with default branch: {fallback_exc}"
                        )
                else:
                    logger.warning(f"Failed to clone repo {repo_url}: {exc}")

        if repo_path.exists() and not is_repository(repo_path):
            self._ensure_git_repo(repo_path)
            return repo_path

        self._ensure_git_repo(self.root_path)
        return self.root_path

    def _derive_repo_path(self, repo_url: str) -> Path:
        clean = repo_url.split("?", 1)[0].split("#", 1)[0].rstrip("/")
        name = clean.split("/")[-1] if clean else "repo"
        if name.endswith(".git"):
            name = name[: -len(".git")]
        if not name or name in (".", ".."):
            name = "repo"
        return self.root_path / name

    @staticmethod
    def _ensure_git_repo(path: Path) -> None:
        if is_repository(path):
            return
        try:
            init_repository(path)
        except Exception as exc:
            logger.warning(f"Failed to init git repository at {path}: {exc}")

    @staticmethod
    def _checkout_branch(path: Path, branch: str | None) -> None:
        if not branch:
            return
        try:
            fetch(remote="origin", branch=branch, cwd=path)
        except Exception:
            pass
        try:
            checkout(branch, cwd=path)
        except GitCommandError:
            pass

    def _ensure_git_excludes(self, repo_path: Path) -> None:
        if not is_repository(repo_path):
            return

        extra = os.environ.get("WORKSPACE_GIT_IGNORE", "")
        patterns = list(DEFAULT_GIT_EXCLUDES)
        if extra:
            for raw in extra.replace(",", "\n").splitlines():
                value = raw.strip()
                if value:
                    patterns.append(value)

        if not patterns:
            return

        exclude_path = repo_path / ".git" / "info" / "exclude"
        exclude_path.parent.mkdir(parents=True, exist_ok=True)
        existing: set[str] = set()
        if exclude_path.exists():
            try:
                existing = {
                    line.strip()
                    for line in exclude_path.read_text(encoding="utf-8").splitlines()
                    if line.strip()
                }
            except Exception as exc:
                logger.warning(f"Failed to read git exclude file {exclude_path}: {exc}")
                existing = set()

        to_add = [p for p in patterns if p not in existing]
        if not to_add:
            return

        try:
            content = ""
            if exclude_path.exists():
                content = exclude_path.read_text(encoding="utf-8")
                if content and not content.endswith("\n"):
                    content += "\n"
            content += "\n".join(to_add) + "\n"
            exclude_path.write_text(content, encoding="utf-8")
        except Exception as exc:
            logger.warning(f"Failed to update git exclude file {exclude_path}: {exc}")

    def _ensure_inputs_dir(self, repo_path: Path) -> None:
        try:
            self.inputs_root.mkdir(parents=True, exist_ok=True)
        except Exception as exc:
            logger.warning(
                f"Failed to create inputs directory {self.inputs_root}: {exc}"
            )
            return

        if repo_path == self.root_path:
            return

        link_path = repo_path / "inputs"
        if link_path.exists():
            return
        try:
            link_path.symlink_to(self.inputs_root)
        except Exception as exc:
            logger.warning(f"Failed to link inputs directory {link_path}: {exc}")
