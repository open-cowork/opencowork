from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.session import TaskConfig


class ScheduledTaskCreateRequest(BaseModel):
    name: str
    cron: str
    timezone: str = "UTC"
    prompt: str
    enabled: bool = True
    reuse_session: bool = False
    workspace_scope: Literal["session", "scheduled_task", "project"] = "session"
    project_id: UUID | None = None
    config: TaskConfig | None = None


class ScheduledTaskUpdateRequest(BaseModel):
    name: str | None = None
    cron: str | None = None
    timezone: str | None = None
    prompt: str | None = None
    enabled: bool | None = None
    reuse_session: bool | None = None
    workspace_scope: Literal["session", "scheduled_task", "project"] | None = None


class ScheduledTaskResponse(BaseModel):
    scheduled_task_id: UUID = Field(validation_alias="id")
    user_id: str
    name: str
    cron: str
    timezone: str
    prompt: str
    enabled: bool
    reuse_session: bool
    workspace_scope: Literal["session", "scheduled_task", "project"]
    project_id: UUID | None
    session_id: UUID | None
    next_run_at: datetime
    last_run_id: UUID | None
    last_run_status: str | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ScheduledTaskTriggerResponse(BaseModel):
    session_id: UUID
    run_id: UUID


class ScheduledTaskDispatchRequest(BaseModel):
    limit: int = 50


class ScheduledTaskDispatchResponse(BaseModel):
    dispatched: int
    run_ids: list[UUID] = Field(default_factory=list)
    skipped: int = 0
    errors: int = 0
