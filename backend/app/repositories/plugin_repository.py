from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.plugin import Plugin
from app.models.user_plugin_install import UserPluginInstall


class PluginRepository:
    @staticmethod
    def create(session_db: Session, plugin: Plugin) -> Plugin:
        session_db.add(plugin)
        return plugin

    @staticmethod
    def get_by_id(session_db: Session, plugin_id: int) -> Plugin | None:
        return session_db.query(Plugin).filter(Plugin.id == plugin_id).first()

    @staticmethod
    def get_by_name(session_db: Session, name: str, user_id: str) -> Plugin | None:
        """Get a user-owned plugin by name."""
        return (
            session_db.query(Plugin)
            .filter(Plugin.name == name, Plugin.owner_user_id == user_id)
            .first()
        )

    @staticmethod
    def list_visible(session_db: Session, user_id: str) -> list[Plugin]:
        """List plugins visible to the user.

        Mirrors MCP/Skill visibility rules: user-scoped plugins override system plugins with
        the same name. Soft-deleted installs hide the plugin entry from the user.
        """
        hidden_ids = (
            session_db.query(UserPluginInstall.plugin_id)
            .filter(
                UserPluginInstall.user_id == user_id,
                UserPluginInstall.is_deleted.is_(True),
            )
            .scalar_subquery()
        )

        user_names = (
            session_db.query(Plugin.name)
            .filter(
                Plugin.scope == "user",
                Plugin.owner_user_id == user_id,
                ~Plugin.id.in_(hidden_ids),
            )
            .scalar_subquery()
        )

        query = session_db.query(Plugin).filter(
            or_(
                and_(
                    Plugin.scope == "user",
                    Plugin.owner_user_id == user_id,
                    ~Plugin.id.in_(hidden_ids),
                ),
                and_(
                    Plugin.scope == "system",
                    ~Plugin.name.in_(user_names),
                    ~Plugin.id.in_(hidden_ids),
                ),
            )
        )
        return query.order_by(Plugin.created_at.desc()).all()

    @staticmethod
    def delete(session_db: Session, plugin: Plugin) -> None:
        session_db.delete(plugin)
