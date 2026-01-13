import logging
import uuid

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.tool_execution import ToolExecution
from app.repositories.tool_execution_repository import ToolExecutionRepository

logger = logging.getLogger(__name__)


class ToolExecutionService:
    """Service layer for tool execution queries."""

    def get_tool_executions(
        self, db: Session, session_id: uuid.UUID
    ) -> list[ToolExecution]:
        """Gets all tool executions for a session.

        Args:
            db: Database session
            session_id: Session ID

        Returns:
            List of tool executions ordered by creation time
        """
        executions = ToolExecutionRepository.list_by_session(db, session_id)
        logger.debug(
            f"Retrieved {len(executions)} tool executions for session {session_id}"
        )
        return executions

    def get_tool_execution(self, db: Session, execution_id: uuid.UUID) -> ToolExecution:
        """Gets a tool execution by ID.

        Args:
            db: Database session
            execution_id: Tool execution ID

        Returns:
            The tool execution

        Raises:
            AppException: If tool execution not found
        """
        execution = ToolExecutionRepository.get_by_id(db, execution_id)
        if not execution:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Tool execution not found: {execution_id}",
            )
        return execution
