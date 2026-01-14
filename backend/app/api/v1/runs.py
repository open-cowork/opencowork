import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.response import Response, ResponseSchema
from app.schemas.run import (
    RunClaimRequest,
    RunClaimResponse,
    RunFailRequest,
    RunResponse,
    RunStartRequest,
)
from app.services.run_service import RunService

router = APIRouter(prefix="/runs", tags=["runs"])

run_service = RunService()


@router.post("/claim", response_model=ResponseSchema[RunClaimResponse | None])
async def claim_next_run(
    request: RunClaimRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Claim the next available run for execution."""
    result = run_service.claim_next_run(db, request)
    return Response.success(data=result, message="Run claimed" if result else "No runs")


@router.post("/{run_id}/start", response_model=ResponseSchema[RunResponse])
async def start_run(
    run_id: uuid.UUID,
    request: RunStartRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Mark a run as running (after dispatch accepted)."""
    result = run_service.start_run(db, run_id, request)
    return Response.success(data=result, message="Run started")


@router.post("/{run_id}/fail", response_model=ResponseSchema[RunResponse])
async def fail_run(
    run_id: uuid.UUID,
    request: RunFailRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Mark a run as failed."""
    result = run_service.fail_run(db, run_id, request)
    return Response.success(data=result, message="Run marked as failed")


@router.get("/{run_id}", response_model=ResponseSchema[RunResponse])
async def get_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Get run details."""
    result = run_service.get_run(db, run_id)
    return Response.success(data=result, message="Run retrieved successfully")


@router.get("/session/{session_id}", response_model=ResponseSchema[list[RunResponse]])
async def list_runs_by_session(
    session_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """List runs for a session."""
    runs = run_service.list_runs(db, session_id, limit=limit, offset=offset)
    return Response.success(data=runs, message="Runs retrieved successfully")
