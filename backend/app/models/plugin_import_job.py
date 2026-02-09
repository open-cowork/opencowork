import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class PluginImportJob(Base, TimestampMixin):
    __tablename__ = "plugin_import_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    archive_key: Mapped[str] = mapped_column(Text, nullable=False)
    selections: Mapped[list[dict]] = mapped_column(JSON, nullable=False)

    status: Mapped[str] = mapped_column(
        String(50), default="queued", nullable=False, index=True
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
