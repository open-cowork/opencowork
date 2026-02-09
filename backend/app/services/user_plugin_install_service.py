from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.user_plugin_install import UserPluginInstall
from app.repositories.plugin_repository import PluginRepository
from app.repositories.user_plugin_install_repository import UserPluginInstallRepository
from app.schemas.user_plugin_install import (
    UserPluginInstallBulkUpdateRequest,
    UserPluginInstallBulkUpdateResponse,
    UserPluginInstallCreateRequest,
    UserPluginInstallResponse,
    UserPluginInstallUpdateRequest,
)


class UserPluginInstallService:
    def list_installs(
        self, db: Session, user_id: str
    ) -> list[UserPluginInstallResponse]:
        installs = UserPluginInstallRepository.list_by_user(db, user_id)
        return [self._to_response(i) for i in installs]

    def create_install(
        self, db: Session, user_id: str, request: UserPluginInstallCreateRequest
    ) -> UserPluginInstallResponse:
        plugin = PluginRepository.get_by_id(db, request.plugin_id)
        if not plugin or (plugin.scope != "system" and plugin.owner_user_id != user_id):
            raise AppException(
                error_code=ErrorCode.PLUGIN_NOT_FOUND,
                message=f"Plugin not found: {request.plugin_id}",
            )

        existing = UserPluginInstallRepository.get_by_user_and_plugin(
            db, user_id, request.plugin_id
        )
        if existing:
            if existing.is_deleted:
                existing.is_deleted = False
                existing.enabled = request.enabled
                db.commit()
                db.refresh(existing)
                return self._to_response(existing)
            raise AppException(
                error_code=ErrorCode.BAD_REQUEST,
                message="Plugin install already exists for plugin",
            )

        install = UserPluginInstall(
            user_id=user_id,
            plugin_id=request.plugin_id,
            enabled=request.enabled,
        )
        UserPluginInstallRepository.create(db, install)
        db.commit()
        db.refresh(install)
        return self._to_response(install)

    def update_install(
        self,
        db: Session,
        user_id: str,
        install_id: int,
        request: UserPluginInstallUpdateRequest,
    ) -> UserPluginInstallResponse:
        install = UserPluginInstallRepository.get_by_id(db, install_id)
        if (
            not install
            or install.user_id != user_id
            or getattr(install, "is_deleted", False)
        ):
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Plugin install not found: {install_id}",
            )

        if request.enabled is not None:
            install.enabled = request.enabled

        db.commit()
        db.refresh(install)
        return self._to_response(install)

    def bulk_update_installs(
        self,
        db: Session,
        user_id: str,
        request: UserPluginInstallBulkUpdateRequest,
    ) -> UserPluginInstallBulkUpdateResponse:
        updated_count = UserPluginInstallRepository.bulk_set_enabled(
            db,
            user_id=user_id,
            enabled=request.enabled,
            install_ids=request.install_ids,
        )
        db.commit()
        return UserPluginInstallBulkUpdateResponse(updated_count=updated_count)

    def delete_install(self, db: Session, user_id: str, install_id: int) -> None:
        install = UserPluginInstallRepository.get_by_id(db, install_id)
        if not install or install.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Plugin install not found: {install_id}",
            )
        install.is_deleted = True
        install.enabled = False
        db.commit()

    @staticmethod
    def _to_response(install: UserPluginInstall) -> UserPluginInstallResponse:
        return UserPluginInstallResponse(
            id=install.id,
            user_id=install.user_id,
            plugin_id=install.plugin_id,
            enabled=install.enabled,
            created_at=install.created_at,
            updated_at=install.updated_at,
        )
