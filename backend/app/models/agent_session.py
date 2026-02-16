import uuid
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import ForeignKey, JSON, Boolean, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_message import AgentMessage
    from app.models.agent_run import AgentRun
    from app.models.project import Project
    from app.models.tool_execution import ToolExecution
    from app.models.usage_log import UsageLog
    from app.models.user_input_request import UserInputRequest


class AgentSession(Base, TimestampMixin):
    __tablename__ = "agent_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sdk_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    config_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    workspace_archive_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    state_patch: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    workspace_files_prefix: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_manifest_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_archive_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_export_status: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    kind: Mapped[str] = mapped_column(
        String(50),
        default="chat",
        server_default=text("'chat'"),
        nullable=False,
        index=True,
    )

    # Workspace scoping:
    # - "session": workspace is unique per session (legacy default)
    # - "scheduled_task": workspace is shared across sessions for the same scheduled task
    # - "project": workspace is shared across sessions for the same project
    workspace_scope: Mapped[str] = mapped_column(
        String(50),
        default="session",
        server_default=text("'session'"),
        nullable=False,
        index=True,
    )
    # UUID of the scope entity (session_id / scheduled_task_id / project_id).
    # Kept nullable for backward compatibility; services should always populate it.
    workspace_ref_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False)
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )

    project: Mapped[Optional["Project"]] = relationship(back_populates="sessions")
    messages: Mapped[list["AgentMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    tool_executions: Mapped[list["ToolExecution"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    runs: Mapped[list["AgentRun"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    usage_logs: Mapped[list["UsageLog"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    user_input_requests: Mapped[list["UserInputRequest"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
