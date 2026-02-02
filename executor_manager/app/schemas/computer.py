from pydantic import BaseModel


class ComputerScreenshotUploadResponse(BaseModel):
    session_id: str
    tool_use_id: str
    key: str
    content_type: str
    size_bytes: int
