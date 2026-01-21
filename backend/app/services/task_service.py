from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.repositories.message_repository import MessageRepository
from app.repositories.mcp_server_repository import McpServerRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.run_repository import RunRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.skill_preset_repository import SkillPresetRepository
from app.repositories.user_mcp_install_repository import UserMcpInstallRepository
from app.repositories.user_skill_install_repository import UserSkillInstallRepository
from app.schemas.session import TaskConfig
from app.schemas.task import TaskEnqueueRequest, TaskEnqueueResponse


class TaskService:
    """Service layer for task enqueue operations."""

    def _normalize_scheduled_at(self, scheduled_at: datetime) -> datetime:
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        return scheduled_at.astimezone(timezone.utc)

    def _resolve_schedule(
        self, request: TaskEnqueueRequest
    ) -> tuple[str, datetime | None]:
        """Resolve run schedule metadata.

        Note: Actual scheduling rules (e.g., when "nightly" runs) are owned by Executor Manager.
        Backend only stores schedule metadata for queue filtering.
        """
        schedule_mode = request.schedule_mode.strip() if request.schedule_mode else ""
        if not schedule_mode:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="schedule_mode cannot be empty",
            )
        scheduled_at = (
            self._normalize_scheduled_at(request.scheduled_at)
            if request.scheduled_at is not None
            else None
        )

        if schedule_mode == "scheduled":
            if scheduled_at is None:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="scheduled_at is required when schedule_mode=scheduled",
                )
            return schedule_mode, scheduled_at

        if schedule_mode == "immediate":
            # Backward-compat: if caller only provides scheduled_at, treat it as "scheduled".
            if scheduled_at is not None:
                return "scheduled", scheduled_at
            return schedule_mode, None

        if schedule_mode == "nightly":
            if scheduled_at is not None:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="scheduled_at cannot be provided when schedule_mode=nightly",
                )
            return schedule_mode, None

        return schedule_mode, scheduled_at

    def enqueue_task(
        self, db: Session, user_id: str, request: TaskEnqueueRequest
    ) -> TaskEnqueueResponse:
        """Enqueue a new run for a session (create session if needed)."""
        base_config: dict | None = None
        project_id = request.project_id
        if request.session_id:
            db_session = SessionRepository.get_by_id(db, request.session_id)
            if not db_session:
                raise AppException(
                    error_code=ErrorCode.NOT_FOUND,
                    message=f"Session not found: {request.session_id}",
                )
            if db_session.user_id != user_id:
                raise AppException(
                    error_code=ErrorCode.FORBIDDEN,
                    message="Session does not belong to the user",
                )
            if project_id is not None and db_session.project_id != project_id:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="project_id does not match the session",
                )
            base_config = db_session.config_snapshot or {}
            merged_config = self._build_config_snapshot(
                db, user_id, request.config, base_config=base_config
            )
        else:
            base_config = {}
            merged_config = self._build_config_snapshot(
                db, user_id, request.config, base_config=base_config
            )
            config_dict = merged_config
            if project_id is not None:
                project = ProjectRepository.get_by_id(db, project_id)
                if not project or project.user_id != user_id:
                    raise AppException(
                        error_code=ErrorCode.PROJECT_NOT_FOUND,
                        message=f"Project not found: {project_id}",
                    )
            db_session = SessionRepository.create(
                session_db=db,
                user_id=user_id,
                config=config_dict,
                project_id=project_id,
            )
            db.flush()
        if merged_config is not None:
            db_session.config_snapshot = merged_config

        prompt = request.prompt.strip()
        if not prompt:
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Prompt cannot be empty",
            )

        user_message_content = {
            "_type": "UserMessage",
            "content": [{"_type": "TextBlock", "text": prompt}],
        }

        db_message = MessageRepository.create(
            session_db=db,
            session_id=db_session.id,
            role="user",
            content=user_message_content,
            text_preview=prompt[:500],
        )
        db.flush()

        schedule_mode, scheduled_at = self._resolve_schedule(request)

        db_run = RunRepository.create(
            session_db=db,
            session_id=db_session.id,
            user_message_id=db_message.id,
            schedule_mode=schedule_mode,
            scheduled_at=scheduled_at,
            config_snapshot=merged_config,
        )

        db_session.status = "pending"

        db.commit()
        db.refresh(db_session)
        db.refresh(db_run)

        return TaskEnqueueResponse(
            session_id=db_session.id,
            run_id=db_run.id,
            status=db_run.status,
        )

    def _build_config_snapshot(
        self,
        db: Session,
        user_id: str,
        task_config: TaskConfig | None,
        *,
        base_config: dict | None = None,
    ) -> dict | None:
        merged_base: dict = dict(base_config or {})
        if task_config is not None:
            request_config = task_config.model_dump()
            # Extract mcp_config toggles before merging (don't merge as dict)
            mcp_toggles = request_config.pop("mcp_config", {})
            merged_base = self._merge_config_map(merged_base, request_config)
            # Build MCP config based on toggles (already returns mcpServers format)
            merged_mcp = self._build_user_mcp_with_toggles(db, user_id, mcp_toggles)
            merged_base["mcp_config"] = merged_mcp
        else:
            merged_base["mcp_config"] = self._build_user_mcp_defaults(db, user_id)

        merged_base["skill_files"] = self._merge_config_map(
            self._build_user_skill_defaults(db, user_id),
            merged_base.get("skill_files") or {},
        )
        return merged_base or None

    @staticmethod
    def _merge_config_map(defaults: dict, overrides: dict) -> dict:
        if not overrides:
            return dict(defaults)
        merged: dict = dict(defaults)
        for key, value in overrides.items():
            if value is None:
                merged.pop(key, None)
                continue
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = {**merged[key], **value}
            else:
                merged[key] = value
        return merged

    def _build_user_mcp_defaults(self, db: Session, user_id: str) -> dict:
        """Build default MCP config from user's enabled installations.

        Returns:
            MCP config dict with mcpServers wrapper: {"mcpServers": {server_name: server_config, ...}}
        """
        result: dict = {}
        installs = UserMcpInstallRepository.list_by_user(db, user_id)
        for install in installs:
            if not install.enabled:
                continue
            server = McpServerRepository.get_by_id(db, install.server_id)
            if not server:
                continue
            # Extract mcpServers from server_config and merge
            server_mcp = server.server_config.get("mcpServers", {})
            result = {**result, **server_mcp}
        return {"mcpServers": result}

    def _build_user_mcp_with_toggles(
        self, db: Session, user_id: str, toggles: dict[str, bool]
    ) -> dict:
        """Build MCP config from user's installations, applying task-level toggles.

        Args:
            db: Database session
            user_id: User ID
            toggles: MCP server display name -> enabled flag (true=enabled, false=disabled)
                    Servers not in this dict use their default enabled state.

        Returns:
            MCP config dict with mcpServers wrapper: {"mcpServers": {server_name: server_config, ...}}
        """
        result: dict = {}
        installs = UserMcpInstallRepository.list_by_user(db, user_id)
        for install in installs:
            server = McpServerRepository.get_by_id(db, install.server_id)
            if not server:
                continue
            # Determine if this server should be enabled:
            # 1. If explicitly set in toggles, use that value
            # 2. Otherwise, use the install's default enabled state
            if server.name in toggles:
                if not toggles[server.name]:
                    continue  # Explicitly disabled
            elif not install.enabled:
                continue  # Default disabled

            # Extract mcpServers from server_config and merge
            server_mcp = server.server_config.get("mcpServers", {})
            result = {**result, **server_mcp}

        return {"mcpServers": result}

    def _build_user_skill_defaults(self, db: Session, user_id: str) -> dict:
        defaults: dict = {}
        installs = UserSkillInstallRepository.list_by_user(db, user_id)
        for install in installs:
            if not install.enabled:
                continue
            preset = SkillPresetRepository.get_by_id(db, install.preset_id)
            if not preset or not preset.is_active:
                continue
            entry = {"$ref": f"skill-preset:{preset.name}", "enabled": True}
            if install.overrides:
                entry.update(install.overrides)
            defaults[preset.name] = entry
        return defaults
