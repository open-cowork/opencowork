import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.plugin_import_job import PluginImportJob
from app.repositories.plugin_import_job_repository import PluginImportJobRepository
from app.schemas.plugin_import import (
    PluginImportCommitEnqueueResponse,
    PluginImportCommitRequest,
    PluginImportCommitResponse,
    PluginImportJobResponse,
)
from app.services.plugin_import_service import PluginImportService

logger = logging.getLogger(__name__)


class PluginImportJobService:
    def __init__(self, import_service: PluginImportService | None = None) -> None:
        self.import_service = import_service or PluginImportService()

    def enqueue_commit(
        self,
        db: Session,
        *,
        user_id: str,
        request: PluginImportCommitRequest,
    ) -> PluginImportCommitEnqueueResponse:
        selections: list[dict[str, Any]] = [
            selection.model_dump() for selection in request.selections
        ]
        job = PluginImportJobRepository.create(
            db,
            user_id=user_id,
            archive_key=request.archive_key,
            selections=selections,
        )
        db.commit()
        db.refresh(job)
        return PluginImportCommitEnqueueResponse(job_id=job.id, status=job.status)

    def get_job(
        self,
        db: Session,
        *,
        user_id: str,
        job_id: uuid.UUID,
    ) -> PluginImportJobResponse:
        job = PluginImportJobRepository.get_by_id(db, job_id)
        if job is None:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message="Plugin import job not found",
            )
        if job.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.FORBIDDEN,
                message="Plugin import job does not belong to the user",
            )
        return self._to_schema(job)

    def process_commit_job(self, job_id: uuid.UUID) -> None:
        """Run a plugin import commit job in the background."""

        db = SessionLocal()
        job: PluginImportJob | None = None
        try:
            job = PluginImportJobRepository.get_by_id(db, job_id)
            if job is None:
                return
            if job.status not in {"queued", "running"}:
                return

            job_ref = job
            job.status = "running"
            job.progress = 0
            job.started_at = datetime.now(timezone.utc)
            job.error = None
            db.commit()

            request = PluginImportCommitRequest(
                archive_key=job.archive_key,
                selections=job.selections,
            )

            def on_progress(processed: int, total: int) -> None:
                if total <= 0:
                    return
                job_ref.progress = min(99, int(processed * 100 / total))
                db.commit()

            result = self.import_service.commit(
                db,
                user_id=job.user_id,
                request=request,
                on_progress=on_progress,
            )

            self._mark_success(db, job, result)
        except Exception as exc:
            logger.exception("plugin_import_job_failed", extra={"job_id": str(job_id)})
            if job is not None:
                db.rollback()
                self._mark_failed(db, job, str(exc))
        finally:
            db.close()

    @staticmethod
    def _mark_success(
        db: Session,
        job: PluginImportJob,
        result: PluginImportCommitResponse,
    ) -> None:
        job.status = "success"
        job.progress = 100
        job.result = result.model_dump()
        job.error = None
        job.finished_at = datetime.now(timezone.utc)
        db.commit()

    @staticmethod
    def _mark_failed(db: Session, job: PluginImportJob, error: str) -> None:
        job.status = "failed"
        job.error = error
        job.finished_at = datetime.now(timezone.utc)
        db.commit()

    @staticmethod
    def _to_schema(job: PluginImportJob) -> PluginImportJobResponse:
        result = (
            PluginImportCommitResponse.model_validate(job.result)
            if isinstance(job.result, dict)
            else None
        )
        return PluginImportJobResponse(
            job_id=job.id,
            status=job.status,
            progress=int(job.progress or 0),
            result=result,
            error=job.error,
            created_at=job.created_at,
            updated_at=job.updated_at,
            started_at=job.started_at,
            finished_at=job.finished_at,
        )
