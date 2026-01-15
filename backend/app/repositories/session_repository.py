import uuid
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.models.agent_session import AgentSession


class SessionRepository:
    """Data access layer for sessions."""

    @staticmethod
    def create(
        session_db: Session, user_id: str, config: dict[str, Any] | None = None
    ) -> AgentSession:
        """Creates a new session.

        Note: Does not commit. Transaction handled by Service layer.
        """
        db_session = AgentSession(
            user_id=user_id,
            config_snapshot=config,
            status="pending",
        )
        session_db.add(db_session)
        return db_session

    @staticmethod
    def get_by_id(session_db: Session, session_id: uuid.UUID) -> AgentSession | None:
        """Gets a session by ID."""
        return (
            session_db.query(AgentSession).filter(AgentSession.id == session_id).first()
        )

    @staticmethod
    def get_by_sdk_session_id(
        session_db: Session, sdk_session_id: str
    ) -> AgentSession | None:
        """Gets a session by SDK session ID."""
        return (
            session_db.query(AgentSession)
            .filter(AgentSession.sdk_session_id == sdk_session_id)
            .first()
        )

    @staticmethod
    def list_by_user(
        session_db: Session,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AgentSession]:
        """Lists sessions for a user."""
        return (
            session_db.query(AgentSession)
            .filter(AgentSession.user_id == user_id)
            .order_by(AgentSession.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    @staticmethod
    def list_all(
        session_db: Session,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AgentSession]:
        """Lists all sessions."""
        return (
            session_db.query(AgentSession)
            .order_by(AgentSession.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    @staticmethod
    def count_by_user(session_db: Session, user_id: str) -> int:
        """Counts sessions for a user."""
        return (
            session_db.query(AgentSession)
            .filter(AgentSession.user_id == user_id)
            .count()
        )

    @staticmethod
    def list_by_user_with_messages(
        session_db: Session,
        user_id: str,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AgentSession]:
        """Lists sessions for a user with messages loaded for title extraction.

        @deprecated: Temporary method for frontend development.
        """
        query = (
            session_db.query(AgentSession)
            .options(joinedload(AgentSession.messages))
            .filter(AgentSession.user_id == user_id)
            .order_by(AgentSession.created_at.desc())
        )
        if limit is not None:
            query = query.limit(limit).offset(offset)
        return query.all()
