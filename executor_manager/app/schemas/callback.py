from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class CallbackStatus(str, Enum):
    """Callback status enum."""

    ACCEPTED = "accepted"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TodoItem(BaseModel):
    """Todo item."""

    content: str
    status: str  # "pending" | "in_progress" | "completed"
    active_form: str | None = None


class McpStatus(BaseModel):
    """MCP server status."""

    server_name: str
    status: str  # "connected" | "disconnected" | "error"
    message: str | None = None


class FileChange(BaseModel):
    """File change info."""

    path: str
    status: str  # "modified" | "staged" | "deleted" | "renamed"
    added_lines: int = 0
    deleted_lines: int = 0
    diff: str | None = None
    old_path: str | None = None


class WorkspaceState(BaseModel):
    """Workspace state info."""

    repository: str | None = None
    branch: str | None = None
    total_added_lines: int = 0
    total_deleted_lines: int = 0
    file_changes: list[FileChange] = Field(default_factory=list)
    last_change: datetime


class AgentCurrentState(BaseModel):
    """Agent current state."""

    todos: list[TodoItem] = Field(default_factory=list)
    mcp_status: list[McpStatus] = Field(default_factory=list)
    workspace_state: WorkspaceState | None = None
    current_step: str | None = None


class AgentCallbackRequest(BaseModel):
    """Agent execution callback request."""

    session_id: str
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: CallbackStatus
    progress: int
    new_message: object | None = None
    state_patch: AgentCurrentState | None = None
    sdk_session_id: str | None = None


class CallbackReceiveResponse(BaseModel):
    """Callback receive response."""

    status: str  # "received"
    session_id: str
    callback_status: CallbackStatus
    progress: int
