from datetime import datetime
from enum import Enum
from typing import Any

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
    status: str
    active_form: str | None = None


class McpStatus(BaseModel):
    """MCP status."""

    server_name: str
    status: str
    message: str | None = None


class FileChange(BaseModel):
    """File change record."""

    path: str
    status: str  # "added" | "modified" | "staged" | "deleted" | "renamed"
    added_lines: int = 0
    deleted_lines: int = 0
    diff: str | None = None
    old_path: str | None = None


class WorkspaceState(BaseModel):
    """Workspace state."""

    repository: str | None = None
    branch: str | None = None
    total_added_lines: int = 0
    total_deleted_lines: int = 0
    file_changes: list[FileChange] = Field(default_factory=list)
    last_change: datetime


class BrowserState(BaseModel):
    """Browser/desktop capability state exposed to the UI."""

    enabled: bool = False


class AgentCurrentState(BaseModel):
    """Agent current state."""

    todos: list[TodoItem] = Field(default_factory=list)
    mcp_status: list[McpStatus] = Field(default_factory=list)
    browser: BrowserState | None = None
    workspace_state: WorkspaceState | None = None
    current_step: str | None = None


class AgentCallbackRequest(BaseModel):
    """Agent execution callback request."""

    session_id: str
    time: datetime
    status: CallbackStatus
    progress: int
    new_message: Any | None = None
    state_patch: AgentCurrentState | None = None
    sdk_session_id: str | None = None
    workspace_files_prefix: str | None = None
    workspace_manifest_key: str | None = None
    workspace_archive_key: str | None = None
    workspace_export_status: str | None = None


class CallbackResponse(BaseModel):
    """Callback response."""

    session_id: str
    status: str
    callback_status: CallbackStatus | None = None
    message: str | None = None
