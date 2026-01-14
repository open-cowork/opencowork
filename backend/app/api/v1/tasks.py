from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.response import Response, ResponseSchema
from app.schemas.task import TaskEnqueueRequest, TaskEnqueueResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])

task_service = TaskService()


@router.post("", response_model=ResponseSchema[TaskEnqueueResponse])
async def enqueue_task(
    request: TaskEnqueueRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Enqueue a task (agent run) for execution."""
    result = task_service.enqueue_task(db, request)
    return Response.success(data=result, message="Task enqueued successfully")
