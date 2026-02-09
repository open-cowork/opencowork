import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.plugin_import_job import PluginImportJob


class PluginImportJobRepository:
    @staticmethod
    def create(
        session_db: Session,
        *,
        user_id: str,
        archive_key: str,
        selections: list[dict[str, Any]],
    ) -> PluginImportJob:
        job = PluginImportJob(
            user_id=user_id,
            archive_key=archive_key,
            selections=selections,
            status="queued",
            progress=0,
        )
        session_db.add(job)
        return job

    @staticmethod
    def get_by_id(session_db: Session, job_id: uuid.UUID) -> PluginImportJob | None:
        return (
            session_db.query(PluginImportJob)
            .filter(PluginImportJob.id == job_id)
            .first()
        )
