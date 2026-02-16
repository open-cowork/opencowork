import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_run import AgentRun
    from app.models.agent_session import AgentSession


class AgentScheduledTask(Base, TimestampMixin):
    __tablename__ = "agent_scheduled_tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
        index=True,
    )

    # If true, all runs reuse the same session (messages append in the UI) and
    # therefore the same session-scoped workspace.
    reuse_session: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )

    # When reuse_session=false, controls which workspace is reused across runs.
    # "session" (default): new workspace per run (legacy behavior)
    # "scheduled_task": reuse workspace for the scheduled task
    # "project": reuse workspace for the project (requires project_id)
    workspace_scope: Mapped[str] = mapped_column(
        String(50),
        default="session",
        server_default=text("'session'"),
        nullable=False,
        index=True,
    )

    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("agent_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    cron: Mapped[str] = mapped_column(String(100), nullable=False)
    timezone: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        server_default=text("'UTC'"),
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)

    # Pinned config snapshot (without sensitive MCP payloads).
    config_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Optional pinned per-run inputs (same shape as TaskConfig.input_files items).
    input_files: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)

    next_run_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    last_run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True, index=True)
    last_run_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
        index=True,
    )

    session: Mapped[Optional["AgentSession"]] = relationship(foreign_keys=[session_id])
    runs: Mapped[list["AgentRun"]] = relationship(back_populates="scheduled_task")
