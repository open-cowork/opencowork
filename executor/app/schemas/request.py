from typing import Literal

from pydantic import BaseModel, Field


class InputFile(BaseModel):
    """User-provided input file or URL attachment."""

    id: str | None = None
    type: Literal["file", "url"] = "file"
    name: str
    source: str
    size: int | None = None
    content_type: str | None = None
    path: str | None = None


class TaskConfig(BaseModel):
    repo_url: str | None = None
    git_branch: str = "main"
    mcp_config: dict = Field(default_factory=dict)
    skill_files: dict = Field(default_factory=dict)
    input_files: list[InputFile] = Field(default_factory=list)


class TaskRun(BaseModel):
    session_id: str
    prompt: str
    callback_url: str
    callback_token: str
    config: TaskConfig
    sdk_session_id: str | None = None
