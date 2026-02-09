import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_id, get_db
from app.schemas.plugin_import import (
    PluginImportCommitEnqueueResponse,
    PluginImportCommitRequest,
    PluginImportDiscoverResponse,
    PluginImportJobResponse,
)
from app.schemas.response import Response, ResponseSchema
from app.services.plugin_import_job_service import PluginImportJobService
from app.services.plugin_import_service import PluginImportService

router = APIRouter(prefix="/plugins/import", tags=["plugins"])

import_service = PluginImportService()
job_service = PluginImportJobService(import_service=import_service)


@router.post(
    "/discover",
    response_model=ResponseSchema[PluginImportDiscoverResponse],
)
def discover_plugin_import(
    file: UploadFile | None = File(default=None),
    github_url: str | None = Form(default=None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    result = import_service.discover(
        db,
        user_id=user_id,
        file=file,
        github_url=github_url,
    )
    return Response.success(data=result, message="Plugin import discovered")


@router.post(
    "/commit",
    response_model=ResponseSchema[PluginImportCommitEnqueueResponse],
)
def commit_plugin_import(
    request: PluginImportCommitRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    result = job_service.enqueue_commit(db, user_id=user_id, request=request)
    background_tasks.add_task(job_service.process_commit_job, result.job_id)
    return Response.success(data=result, message="Plugin import queued")


@router.get(
    "/jobs/{job_id}",
    response_model=ResponseSchema[PluginImportJobResponse],
)
def get_plugin_import_job(
    job_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    result = job_service.get_job(db, user_id=user_id, job_id=job_id)
    return Response.success(data=result, message="Plugin import job retrieved")
