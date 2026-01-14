from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.repositories.message_repository import MessageRepository
from app.repositories.run_repository import RunRepository
from app.repositories.session_repository import SessionRepository
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
        self, db: Session, request: TaskEnqueueRequest
    ) -> TaskEnqueueResponse:
        """Enqueue a new run for a session (create session if needed)."""
        if request.session_id:
            db_session = SessionRepository.get_by_id(db, request.session_id)
            if not db_session:
                raise AppException(
                    error_code=ErrorCode.NOT_FOUND,
                    message=f"Session not found: {request.session_id}",
                )
            if db_session.user_id != request.user_id:
                raise AppException(
                    error_code=ErrorCode.FORBIDDEN,
                    message="Session does not belong to the user",
                )
        else:
            config_dict = request.config.model_dump() if request.config else None
            db_session = SessionRepository.create(
                session_db=db,
                user_id=request.user_id,
                config=config_dict,
            )
            db.flush()

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
