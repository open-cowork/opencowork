import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.message import MessageResponse
from app.schemas.response import Response, ResponseSchema
from app.schemas.session import (
    SessionCreateRequest,
    SessionResponse,
    SessionUpdateRequest,
)
from app.schemas.tool_execution import ToolExecutionResponse
from app.schemas.usage import UsageResponse
from app.services.message_service import MessageService
from app.services.session_service import SessionService
from app.services.tool_execution_service import ToolExecutionService
from app.services.usage_service import UsageService

router = APIRouter(prefix="/sessions", tags=["sessions"])

session_service = SessionService()
message_service = MessageService()
tool_execution_service = ToolExecutionService()
usage_service = UsageService()


@router.post("", response_model=ResponseSchema[SessionResponse])
async def create_session(
    request: SessionCreateRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Creates a new session."""
    db_session = session_service.create_session(db, request)
    return Response.success(
        data=SessionResponse.model_validate(db_session),
        message="Session created successfully",
    )


@router.get("/{session_id}", response_model=ResponseSchema[SessionResponse])
async def get_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Gets session details."""
    db_session = session_service.get_session(db, session_id)
    return Response.success(
        data=SessionResponse.model_validate(db_session),
        message="Session retrieved successfully",
    )


@router.patch("/{session_id}", response_model=ResponseSchema[SessionResponse])
async def update_session(
    session_id: uuid.UUID,
    request: SessionUpdateRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Updates a session."""
    db_session = session_service.update_session(db, session_id, request)
    return Response.success(
        data=SessionResponse.model_validate(db_session),
        message="Session updated successfully",
    )


@router.get("", response_model=ResponseSchema[list[SessionResponse]])
async def list_sessions(
    user_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Lists sessions."""
    sessions = session_service.list_sessions(db, user_id, limit, offset)
    return Response.success(
        data=[SessionResponse.model_validate(s) for s in sessions],
        message="Sessions retrieved successfully",
    )


@router.get(
    "/{session_id}/messages", response_model=ResponseSchema[list[MessageResponse]]
)
async def get_session_messages(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Gets all messages for a session."""
    # Verify session exists
    session_service.get_session(db, session_id)
    messages = message_service.get_messages(db, session_id)
    return Response.success(
        data=[MessageResponse.model_validate(m) for m in messages],
        message="Messages retrieved successfully",
    )


@router.get(
    "/{session_id}/tool-executions",
    response_model=ResponseSchema[list[ToolExecutionResponse]],
)
async def get_session_tool_executions(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Gets all tool executions for a session."""
    # Verify session exists
    session_service.get_session(db, session_id)
    executions = tool_execution_service.get_tool_executions(db, session_id)
    return Response.success(
        data=[ToolExecutionResponse.model_validate(e) for e in executions],
        message="Tool executions retrieved successfully",
    )


@router.get("/{session_id}/usage", response_model=ResponseSchema[UsageResponse])
async def get_session_usage(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Gets usage statistics for a session."""
    # Verify session exists
    session_service.get_session(db, session_id)
    usage = usage_service.get_usage_summary(db, session_id)
    return Response.success(
        data=usage,
        message="Usage statistics retrieved successfully",
    )
