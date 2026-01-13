from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ToolExecutionResponse(BaseModel):
    """Tool execution response."""

    id: UUID
    message_id: int | None
    tool_use_id: str | None
    tool_name: str
    tool_input: dict[str, Any] | None
    tool_output: dict[str, Any] | None
    is_error: bool
    duration_ms: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
