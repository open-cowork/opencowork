from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class UserPluginInstall(Base, TimestampMixin):
    __tablename__ = "user_plugin_installs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    plugin_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("plugins.id", ondelete="CASCADE"), nullable=False
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "plugin_id", name="uq_user_plugin_user_plugin"),
    )
