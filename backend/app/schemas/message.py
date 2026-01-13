from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    """Message response."""

    id: int
    role: str
    content: dict[str, Any]
    text_preview: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
