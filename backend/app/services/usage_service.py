import logging
import uuid

from sqlalchemy.orm import Session

from app.repositories.usage_log_repository import UsageLogRepository
from app.schemas.usage import UsageResponse

logger = logging.getLogger(__name__)


class UsageService:
    """Service layer for usage statistics."""

    def get_usage_summary(self, db: Session, session_id: uuid.UUID) -> UsageResponse:
        """Gets aggregated usage statistics for a session.

        Args:
            db: Database session
            session_id: Session ID

        Returns:
            Aggregated usage statistics
        """
        logs = UsageLogRepository.list_by_session(db, session_id)

        total_cost_usd = 0.0
        total_input_tokens = 0
        total_output_tokens = 0
        total_duration_ms = 0

        for log in logs:
            if log.total_cost_usd is not None:
                total_cost_usd += float(log.total_cost_usd)
            if log.input_tokens is not None:
                total_input_tokens += log.input_tokens
            if log.output_tokens is not None:
                total_output_tokens += log.output_tokens
            if log.duration_ms is not None:
                total_duration_ms += log.duration_ms

        # Return None if no logs exist
        if not logs:
            return UsageResponse(
                total_cost_usd=None,
                total_input_tokens=None,
                total_output_tokens=None,
                total_duration_ms=None,
            )

        logger.debug(
            f"Retrieved usage summary for session {session_id}: "
            f"cost=${total_cost_usd:.6f}, tokens={total_input_tokens}+{total_output_tokens}, "
            f"duration={total_duration_ms}ms"
        )

        return UsageResponse(
            total_cost_usd=total_cost_usd if logs else None,
            total_input_tokens=total_input_tokens if logs else None,
            total_output_tokens=total_output_tokens if logs else None,
            total_duration_ms=total_duration_ms if logs else None,
        )
