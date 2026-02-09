from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user_plugin_install import UserPluginInstall


class UserPluginInstallRepository:
    @staticmethod
    def create(session_db: Session, install: UserPluginInstall) -> UserPluginInstall:
        session_db.add(install)
        return install

    @staticmethod
    def get_by_id(session_db: Session, install_id: int) -> UserPluginInstall | None:
        return (
            session_db.query(UserPluginInstall)
            .filter(UserPluginInstall.id == install_id)
            .first()
        )

    @staticmethod
    def get_by_user_and_plugin(
        session_db: Session, user_id: str, plugin_id: int
    ) -> UserPluginInstall | None:
        return (
            session_db.query(UserPluginInstall)
            .filter(
                UserPluginInstall.user_id == user_id,
                UserPluginInstall.plugin_id == plugin_id,
            )
            .first()
        )

    @staticmethod
    def list_by_user(session_db: Session, user_id: str) -> list[UserPluginInstall]:
        return (
            session_db.query(UserPluginInstall)
            .filter(
                UserPluginInstall.user_id == user_id,
                UserPluginInstall.is_deleted.is_(False),
            )
            .order_by(UserPluginInstall.created_at.desc())
            .all()
        )

    @staticmethod
    def bulk_set_enabled(
        session_db: Session,
        *,
        user_id: str,
        enabled: bool,
        install_ids: list[int] | None = None,
    ) -> int:
        query = session_db.query(UserPluginInstall).filter(
            UserPluginInstall.user_id == user_id,
            UserPluginInstall.is_deleted.is_(False),
        )
        if install_ids is not None:
            if not install_ids:
                return 0
            query = query.filter(UserPluginInstall.id.in_(install_ids))
        return query.update(
            {
                UserPluginInstall.enabled: enabled,
                UserPluginInstall.updated_at: func.now(),
            },
            synchronize_session=False,
        )

    @staticmethod
    def delete(session_db: Session, install: UserPluginInstall) -> None:
        session_db.delete(install)
