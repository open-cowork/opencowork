import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_message import AgentMessage
    from app.models.agent_run import AgentRun
    from app.models.tool_execution import ToolExecution
    from app.models.usage_log import UsageLog


class AgentSession(Base, TimestampMixin):
    __tablename__ = "agent_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    sdk_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    config_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    workspace_archive_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False)

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
