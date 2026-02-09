from datetime import datetime

from pydantic import BaseModel


class PluginCreateRequest(BaseModel):
    name: str
    entry: dict
    scope: str | None = None
    description: str | None = None
    version: str | None = None
    manifest: dict | None = None


class PluginUpdateRequest(BaseModel):
    name: str | None = None
    entry: dict | None = None
    scope: str | None = None
    description: str | None = None
    version: str | None = None
    manifest: dict | None = None


class PluginResponse(BaseModel):
    id: int
    name: str
    entry: dict
    scope: str
    owner_user_id: str | None
    description: str | None = None
    version: str | None = None
    manifest: dict | None = None
    created_at: datetime
    updated_at: datetime
