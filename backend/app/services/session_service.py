import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.agent_session import AgentSession
from app.models.agent_run import AgentRun
from app.repositories.project_repository import ProjectRepository
from app.repositories.scheduled_task_repository import ScheduledTaskRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.tool_execution_repository import ToolExecutionRepository
from app.repositories.user_input_request_repository import UserInputRequestRepository
from app.schemas.session import SessionCreateRequest, SessionUpdateRequest

logger = logging.getLogger(__name__)


class SessionService:
    """Service layer for session management."""

    def create_session(
        self, db: Session, user_id: str, request: SessionCreateRequest
    ) -> AgentSession:
        """Creates a new session."""
        config_dict = request.config.model_dump() if request.config else None
        project_id = request.project_id
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
            kind="chat",
        )
        db.flush()
        if db_session.workspace_ref_id is None:
            db_session.workspace_ref_id = db_session.id

        db.commit()
        db.refresh(db_session)

        logger.info(f"Created session {db_session.id} for user {user_id}")
        return db_session

    def get_session(self, db: Session, session_id: uuid.UUID) -> AgentSession:
        """Gets a session by ID.

        Raises:
            AppException: If session not found.
        """
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Session not found: {session_id}",
            )
        return db_session

    def update_session(
        self, db: Session, session_id: uuid.UUID, request: SessionUpdateRequest
    ) -> AgentSession:
        """Updates session fields."""
        db_session = self.get_session(db, session_id)
        if "project_id" in request.model_fields_set:
            project_id = request.project_id
            if project_id is None:
                db_session.project_id = None
            else:
                project = ProjectRepository.get_by_id(db, project_id)
                if not project or project.user_id != db_session.user_id:
                    raise AppException(
                        error_code=ErrorCode.PROJECT_NOT_FOUND,
                        message=f"Project not found: {project_id}",
                    )
                db_session.project_id = project_id

        if "title" in request.model_fields_set:
            if request.title is None:
                db_session.title = None
            else:
                title = request.title.strip()
                if not title:
                    raise AppException(
                        error_code=ErrorCode.BAD_REQUEST,
                        message="Title cannot be empty",
                    )
                if len(title) > 255:
                    raise AppException(
                        error_code=ErrorCode.BAD_REQUEST,
                        message="Title exceeds maximum length (255)",
                    )
                db_session.title = title

        if request.status is not None:
            db_session.status = request.status
        if request.sdk_session_id is not None:
            db_session.sdk_session_id = request.sdk_session_id
        if request.workspace_archive_url is not None:
            db_session.workspace_archive_url = request.workspace_archive_url
        if request.state_patch is not None:
            db_session.state_patch = request.state_patch
        if request.workspace_files_prefix is not None:
            db_session.workspace_files_prefix = request.workspace_files_prefix
        if request.workspace_manifest_key is not None:
            db_session.workspace_manifest_key = request.workspace_manifest_key
        if request.workspace_archive_key is not None:
            db_session.workspace_archive_key = request.workspace_archive_key
        if request.workspace_export_status is not None:
            db_session.workspace_export_status = request.workspace_export_status

        db.commit()
        db.refresh(db_session)

        logger.info(f"Updated session {session_id}")
        return db_session

    def delete_session(self, db: Session, session_id: uuid.UUID) -> AgentSession:
        """Soft deletes a session."""
        db_session = self.get_session(db, session_id)
        db_session.is_deleted = True

        db.commit()
        db.refresh(db_session)

        logger.info(f"Soft deleted session {session_id}")
        return db_session

    def list_sessions(
        self,
        db: Session,
        user_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
        project_id: uuid.UUID | None = None,
        *,
        kind: str | None = None,
    ) -> list[AgentSession]:
        """Lists sessions, optionally filtered by user."""
        if user_id:
            return SessionRepository.list_by_user(
                db, user_id, limit, offset, project_id, kind=kind
            )
        return SessionRepository.list_all(db, limit, offset, project_id, kind=kind)

    def find_session_by_sdk_id_or_uuid(
        self, db: Session, session_id: str
    ) -> AgentSession | None:
        """Finds session by SDK session ID or UUID."""
        db_session = SessionRepository.get_by_sdk_session_id(db, session_id)

        if not db_session:
            try:
                session_uuid = uuid.UUID(session_id)
                db_session = SessionRepository.get_by_id(db, session_uuid)
            except ValueError:
                pass

        return db_session

    def cancel_session(
        self,
        db: Session,
        session_id: uuid.UUID,
        *,
        user_id: str,
        reason: str | None = None,
    ) -> tuple[AgentSession, int, int]:
        """Cancel a session by marking all unfinished runs as canceled.

        This is a best-effort local cancellation: it updates database state so the UI stops
        polling and no new runs are claimed. Executor termination is handled by Executor Manager.

        Returns:
            (session, canceled_run_count, expired_user_input_request_count)
        """
        db_session = self.get_session(db, session_id)
        if db_session.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.FORBIDDEN,
                message="Session does not belong to the user",
            )

        now = datetime.now(timezone.utc)

        # Cancel all unfinished runs (queued/claimed/running), including future scheduled runs.
        runs = (
            db.query(AgentRun)
            .filter(AgentRun.session_id == session_id)
            .filter(AgentRun.status.in_(["queued", "claimed", "running"]))
            .order_by(AgentRun.created_at.desc())
            .all()
        )
        canceled_runs = 0
        for run in runs:
            run.status = "canceled"
            run.finished_at = now
            run.claimed_by = None
            run.lease_expires_at = None
            canceled_runs += 1

            # Keep scheduled task summary fields in sync when the latest run is canceled.
            if run.scheduled_task_id:
                db_task = ScheduledTaskRepository.get_by_id(db, run.scheduled_task_id)
                if db_task and (
                    not db_task.last_run_id or db_task.last_run_id == run.id
                ):
                    db_task.last_run_id = run.id
                    db_task.last_run_status = run.status
                    db_task.last_error = None

        # Expire any pending user input requests so the UI doesn't keep showing blocking cards.
        pending_requests = UserInputRequestRepository.list_pending_by_session(
            db, session_id
        )
        expired_requests = 0
        for entry in pending_requests:
            entry.status = "expired"
            # Ensure it is considered expired immediately.
            entry.expires_at = now
            expired_requests += 1

        # Mark in-flight tool executions as ended so the UI doesn't keep showing spinners
        # after the session is canceled (a ToolResultBlock may never arrive once we stop the executor).
        unfinished_tools = ToolExecutionRepository.list_unfinished_by_session(
            db, session_id
        )
        if unfinished_tools:
            suffix = (
                f": {reason.strip()}"
                if isinstance(reason, str) and reason.strip()
                else ""
            )
            for execution in unfinished_tools:
                execution.is_error = True
                execution.tool_output = {"content": f"Canceled{suffix}"}
                if execution.duration_ms is None and execution.created_at is not None:
                    started_at = execution.created_at
                    if started_at.tzinfo is None:
                        started_at = started_at.replace(tzinfo=timezone.utc)
                    duration = now - started_at.astimezone(timezone.utc)
                    execution.duration_ms = max(0, int(duration.total_seconds() * 1000))

        db_session.status = "canceled"

        db.commit()
        db.refresh(db_session)

        return db_session, canceled_runs, expired_requests
