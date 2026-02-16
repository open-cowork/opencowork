import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.agent_scheduled_task import AgentScheduledTask


class ScheduledTaskRepository:
    """Data access layer for scheduled tasks."""

    @staticmethod
    def create(
        session_db: Session,
        *,
        user_id: str,
        name: str,
        project_id: uuid.UUID | None,
        cron: str,
        timezone_name: str,
        prompt: str,
        enabled: bool,
        reuse_session: bool,
        workspace_scope: str,
        session_id: uuid.UUID | None,
        config_snapshot: dict | None,
        input_files: list[dict] | None,
        next_run_at: datetime,
    ) -> AgentScheduledTask:
        task = AgentScheduledTask(
            user_id=user_id,
            name=name,
            project_id=project_id,
            cron=cron,
            timezone=timezone_name,
            prompt=prompt,
            enabled=enabled,
            reuse_session=reuse_session,
            workspace_scope=workspace_scope,
            session_id=session_id,
            config_snapshot=config_snapshot,
            input_files=input_files,
            next_run_at=next_run_at,
            is_deleted=False,
        )
        session_db.add(task)
        return task

    @staticmethod
    def get_by_id(
        session_db: Session,
        task_id: uuid.UUID,
        *,
        include_deleted: bool = False,
    ) -> AgentScheduledTask | None:
        query = session_db.query(AgentScheduledTask).filter(
            AgentScheduledTask.id == task_id
        )
        if not include_deleted:
            query = query.filter(AgentScheduledTask.is_deleted.is_(False))
        return query.first()

    @staticmethod
    def list_by_user(
        session_db: Session,
        user_id: str,
        *,
        limit: int = 100,
        offset: int = 0,
        include_deleted: bool = False,
    ) -> list[AgentScheduledTask]:
        query = session_db.query(AgentScheduledTask).filter(
            AgentScheduledTask.user_id == user_id
        )
        if not include_deleted:
            query = query.filter(AgentScheduledTask.is_deleted.is_(False))
        return (
            query.order_by(AgentScheduledTask.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    @staticmethod
    def soft_delete(session_db: Session, task_id: uuid.UUID) -> None:
        stmt = (
            update(AgentScheduledTask)
            .where(AgentScheduledTask.id == task_id)
            .values(is_deleted=True)
        )
        session_db.connection().execute(stmt)

    @staticmethod
    def claim_due_for_update(
        session_db: Session,
        *,
        limit: int = 50,
        now_utc: datetime | None = None,
    ) -> list[AgentScheduledTask]:
        """Claim due scheduled tasks for dispatch (row-lock)."""
        if limit <= 0:
            limit = 50
        now = now_utc or datetime.now(timezone.utc)
        stmt = (
            select(AgentScheduledTask)
            .where(AgentScheduledTask.is_deleted.is_(False))
            .where(AgentScheduledTask.enabled.is_(True))
            .where(AgentScheduledTask.next_run_at <= now)
            .order_by(AgentScheduledTask.next_run_at.asc())
            .with_for_update(skip_locked=True)
            .limit(limit)
        )
        return list(session_db.execute(stmt).scalars().all())
