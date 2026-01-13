import logging
import uuid

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.agent_message import AgentMessage
from app.repositories.message_repository import MessageRepository

logger = logging.getLogger(__name__)


class MessageService:
    """Service layer for message queries."""

    def get_messages(self, db: Session, session_id: uuid.UUID) -> list[AgentMessage]:
        """Gets all messages for a session.

        Args:
            db: Database session
            session_id: Session ID

        Returns:
            List of messages ordered by creation time
        """
        messages = MessageRepository.list_by_session(db, session_id)
        logger.debug(f"Retrieved {len(messages)} messages for session {session_id}")
        return messages

    def get_message(self, db: Session, message_id: int) -> AgentMessage:
        """Gets a message by ID.

        Args:
            db: Database session
            message_id: Message ID

        Returns:
            The message

        Raises:
            AppException: If message not found
        """
        message = MessageRepository.get_by_id(db, message_id)
        if not message:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Message not found: {message_id}",
            )
        return message
