from datetime import datetime

from pydantic import BaseModel


class UserPluginInstallCreateRequest(BaseModel):
    plugin_id: int
    enabled: bool = True


class UserPluginInstallUpdateRequest(BaseModel):
    enabled: bool | None = None


class UserPluginInstallBulkUpdateRequest(BaseModel):
    enabled: bool
    install_ids: list[int] | None = None


class UserPluginInstallBulkUpdateResponse(BaseModel):
    updated_count: int


class UserPluginInstallResponse(BaseModel):
    id: int
    user_id: str
    plugin_id: int
    enabled: bool
    created_at: datetime
    updated_at: datetime
