import logging
import re
import time
from pathlib import Path

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.services.workspace_manager import WorkspaceManager

logger = logging.getLogger(__name__)


class SubAgentStager:
    def __init__(self, workspace_manager: WorkspaceManager | None = None) -> None:
        self.workspace_manager = workspace_manager or WorkspaceManager()

    @staticmethod
    def _validate_subagent_name(name: str) -> None:
        if name in {".", ".."} or not re.fullmatch(r"[A-Za-z0-9._-]+", name):
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message=f"Invalid subagent name: {name}",
            )

    @staticmethod
    def _clean_agents_dir(agents_root: Path) -> int:
        """Remove previously staged agent markdown files for this session."""
        removed = 0
        for entry in agents_root.iterdir():
            if entry.is_file() and entry.suffix == ".md":
                try:
                    entry.unlink()
                    removed += 1
                except Exception:
                    continue
        return removed

    def stage_raw_agents(
        self,
        *,
        user_id: str,
        session_id: str,
        raw_agents: dict[str, str],
    ) -> dict[str, str]:
        """Stage raw markdown subagents into workspace-level ~/.claude (symlinked by executor).

        The executor symlinks container `~/.claude` to `/workspace/.claude_data`, and
        the SDK loads it via `setting_sources=["user", "project"]`.

        Returns a map of subagent name -> local file path (string).
        """
        started_total = time.perf_counter()

        session_dir = self.workspace_manager.get_workspace_path(
            user_id=user_id, session_id=session_id, create=True
        )
        workspace_dir = session_dir / "workspace"
        agents_root = workspace_dir / ".claude_data" / "agents"
        agents_root.mkdir(parents=True, exist_ok=True)

        # Keep staging idempotent: agents that are disabled/deleted in backend should disappear.
        removed = self._clean_agents_dir(agents_root)

        staged: dict[str, str] = {}
        agents_root_resolved = agents_root.resolve()
        for name, markdown in (raw_agents or {}).items():
            if not isinstance(markdown, str):
                continue
            self._validate_subagent_name(name)
            target_file = (agents_root / f"{name}.md").resolve()
            if agents_root_resolved not in target_file.parents:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message=f"Invalid subagent path: {name}",
                )
            try:
                text = markdown
                if text and not text.endswith("\n"):
                    text += "\n"
                target_file.write_text(text, encoding="utf-8")
                staged[name] = str(target_file)
            except Exception as exc:
                raise AppException(
                    error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
                    message=f"Failed to stage subagent {name}: {exc}",
                ) from exc

        logger.info(
            "timing",
            extra={
                "step": "subagent_stage_total",
                "duration_ms": int((time.perf_counter() - started_total) * 1000),
                "user_id": user_id,
                "session_id": session_id,
                "raw_agents_requested": len(raw_agents or {}),
                "raw_agents_staged": len(staged),
                "raw_agents_removed": removed,
            },
        )
        return staged
