from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.message import MessageResponse
from app.schemas.response import Response, ResponseSchema
from app.services.message_service import MessageService

router = APIRouter(prefix="/messages", tags=["messages"])

message_service = MessageService()


@router.get("/{message_id}", response_model=ResponseSchema[MessageResponse])
async def get_message(
    message_id: int,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Gets a message by ID."""
    message = message_service.get_message(db, message_id)
    return Response.success(
        data=MessageResponse.model_validate(message),
        message="Message retrieved successfully",
    )
