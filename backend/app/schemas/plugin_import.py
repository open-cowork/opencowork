import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PluginImportCandidate(BaseModel):
    """A discovered plugin.json candidate inside an uploaded archive."""

    relative_path: str
    plugin_name: str | None = None
    version: str | None = None
    description: str | None = None
    requires_name: bool = False
    will_overwrite: bool = False


class PluginImportDiscoverResponse(BaseModel):
    """Response for plugin import discovery."""

    archive_key: str
    candidates: list[PluginImportCandidate] = Field(default_factory=list)


class PluginImportSelection(BaseModel):
    """User selection for importing a plugin candidate."""

    relative_path: str
    name_override: str | None = None


class PluginImportCommitRequest(BaseModel):
    """Request to import selected plugins from a previously discovered archive."""

    archive_key: str
    selections: list[PluginImportSelection] = Field(default_factory=list)


class PluginImportResultItem(BaseModel):
    """Per-plugin import result."""

    relative_path: str
    plugin_name: str | None = None
    plugin_id: int | None = None
    overwritten: bool = False
    status: str
    error: str | None = None


class PluginImportCommitResponse(BaseModel):
    """Response for plugin import commit."""

    items: list[PluginImportResultItem] = Field(default_factory=list)


class PluginImportCommitEnqueueResponse(BaseModel):
    """Response for enqueueing a plugin import commit job."""

    job_id: uuid.UUID
    status: str


class PluginImportJobResponse(BaseModel):
    """Status response for a plugin import commit job."""

    job_id: uuid.UUID
    status: str
    progress: int = 0
    result: PluginImportCommitResponse | None = None
    error: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
