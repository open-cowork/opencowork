from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TaskConfig(BaseModel):
    """Task configuration."""

    repo_url: str | None = None
    git_branch: str = "main"
    mcp_config: dict = Field(default_factory=dict)
    skill_files: dict = Field(default_factory=dict)


class SessionCreateRequest(BaseModel):
    """Request to create a session."""

    config: TaskConfig | None = None


class SessionUpdateRequest(BaseModel):
    """Request to update a session."""

    status: str | None = None
    sdk_session_id: str | None = None
    workspace_archive_url: str | None = None


class SessionResponse(BaseModel):
    """Session response."""

    session_id: UUID = Field(validation_alias="id")
    user_id: str
    sdk_session_id: str | None
    config_snapshot: dict[str, Any] | None
    workspace_archive_url: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SessionWithTitleResponse(BaseModel):
    """Session response with title (first user prompt).

    @deprecated: Temporary API for frontend development. Will be replaced.
    """

    session_id: UUID = Field(validation_alias="id")
    user_id: str
    sdk_session_id: str | None
    config_snapshot: dict[str, Any] | None
    workspace_archive_url: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    title: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
