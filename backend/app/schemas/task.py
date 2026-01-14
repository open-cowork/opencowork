from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.session import TaskConfig


class TaskEnqueueRequest(BaseModel):
    """Enqueue a new agent run (task)."""

    user_id: str
    prompt: str
    config: TaskConfig | None = None
    session_id: UUID | None = None
    schedule_mode: str = "immediate"
    timezone: str | None = None
    scheduled_at: datetime | None = None


class TaskEnqueueResponse(BaseModel):
    """Enqueue task response."""

    session_id: UUID
    run_id: UUID
    status: str
