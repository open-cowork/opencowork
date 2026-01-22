from sqlalchemy import Boolean, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class SkillPreset(Base, TimestampMixin):
    __tablename__ = "skill_presets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entry: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    default_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    config_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("name", "owner_user_id", name="uq_skill_preset_name_owner"),
    )
