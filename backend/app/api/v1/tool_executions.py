import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.response import Response, ResponseSchema
from app.schemas.tool_execution import ToolExecutionResponse
from app.services.tool_execution_service import ToolExecutionService

router = APIRouter(prefix="/tool-executions", tags=["tool-executions"])

tool_execution_service = ToolExecutionService()


@router.get("/{execution_id}", response_model=ResponseSchema[ToolExecutionResponse])
async def get_tool_execution(
    execution_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Gets a tool execution by ID."""
    execution = tool_execution_service.get_tool_execution(db, execution_id)
    return Response.success(
        data=ToolExecutionResponse.model_validate(execution),
        message="Tool execution retrieved successfully",
    )
