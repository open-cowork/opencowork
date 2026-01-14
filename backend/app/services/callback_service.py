import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.agent_run import AgentRun
from app.repositories.message_repository import MessageRepository
from app.repositories.tool_execution_repository import ToolExecutionRepository
from app.repositories.usage_log_repository import UsageLogRepository
from app.schemas.callback import (
    AgentCallbackRequest,
    CallbackResponse,
    CallbackStatus,
)
from app.schemas.session import SessionUpdateRequest
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


class CallbackService:
    """Service layer for processing executor callbacks."""

    def _extract_sdk_session_id_from_message(
        self, message: dict[str, Any]
    ) -> str | None:
        message_type = message.get("_type", "")

        if "ResultMessage" in message_type and isinstance(
            message.get("session_id"), str
        ):
            return message["session_id"]

        if "SystemMessage" in message_type and message.get("subtype") == "init":
            data = message.get("data", {})
            if not isinstance(data, dict):
                return None
            inner = data.get("data")
            if isinstance(inner, dict) and isinstance(inner.get("session_id"), str):
                return inner["session_id"]
            if isinstance(data.get("session_id"), str):
                return data["session_id"]

        return None

    def _extract_role_from_message(self, message: dict[str, Any]) -> str:
        message_type = message.get("_type", "")

        if "AssistantMessage" in message_type:
            return "assistant"
        elif "UserMessage" in message_type:
            return "user"
        elif "SystemMessage" in message_type:
            return "system"

        logger.warning(
            f"Unknown message type: {message_type}, defaulting to 'assistant'"
        )
        return "assistant"

    def _extract_tool_executions(
        self,
        session_db: Session,
        message: dict[str, Any],
        session_id: uuid.UUID,
        message_id: int,
    ) -> None:
        content = message.get("content", [])
        if not isinstance(content, list):
            return

        for block in content:
            if not isinstance(block, dict):
                continue

            block_type = block.get("_type", "")

            if "ToolUseBlock" in block_type:
                tool_use_id = block.get("id")
                tool_name = block.get("name")
                tool_input = block.get("input")

                if not tool_use_id or not tool_name:
                    continue

                existing = ToolExecutionRepository.get_by_session_and_tool_use_id(
                    session_db=session_db,
                    session_id=session_id,
                    tool_use_id=tool_use_id,
                )
                if existing:
                    existing.tool_name = tool_name
                    existing.tool_input = tool_input
                    existing.message_id = message_id
                    logger.debug(
                        f"Updated tool execution (tool_use_id={tool_use_id}) in message {message_id}"
                    )
                    continue

                ToolExecutionRepository.create(
                    session_db=session_db,
                    session_id=session_id,
                    message_id=message_id,
                    tool_use_id=tool_use_id,
                    tool_name=tool_name,
                    tool_input=tool_input,
                )
                logger.debug(
                    f"Created tool execution (tool_use_id={tool_use_id}, tool={tool_name}) in message {message_id}"
                )

            elif "ToolResultBlock" in block_type:
                tool_use_id = block.get("tool_use_id")
                result_content = block.get("content")
                is_error = block.get("is_error", False)

                if not tool_use_id:
                    continue

                tool_output = {"content": result_content} if result_content else None
                existing = ToolExecutionRepository.get_by_session_and_tool_use_id(
                    session_db=session_db,
                    session_id=session_id,
                    tool_use_id=tool_use_id,
                )

                if not existing:
                    ToolExecutionRepository.create(
                        session_db=session_db,
                        session_id=session_id,
                        message_id=message_id,
                        tool_use_id=tool_use_id,
                        tool_name="unknown",
                        tool_output=tool_output,
                        result_message_id=message_id,
                        is_error=bool(is_error),
                    )
                    logger.debug(
                        f"Created tool execution placeholder (tool_use_id={tool_use_id}) in message {message_id}"
                    )
                    continue

                existing.tool_output = tool_output
                existing.result_message_id = message_id
                existing.is_error = bool(is_error)

                if existing.duration_ms is None and existing.created_at is not None:
                    duration = datetime.now(timezone.utc) - existing.created_at
                    existing.duration_ms = int(duration.total_seconds() * 1000)

                logger.debug(
                    f"Updated tool execution result (tool_use_id={tool_use_id}) in message {message_id}"
                )

    def _extract_and_persist_usage(
        self, db: Session, session_id: uuid.UUID, message: dict[str, Any]
    ) -> None:
        """Extracts and persists usage data from a ResultMessage."""
        message_type = message.get("_type", "")

        if "ResultMessage" not in message_type:
            return

        usage_data = message.get("usage")
        if not usage_data or not isinstance(usage_data, dict):
            logger.debug(f"No usage data in ResultMessage for session {session_id}")
            return

        total_cost_usd = message.get("total_cost_usd")
        duration_ms = message.get("duration_ms")

        UsageLogRepository.create(
            session_db=db,
            session_id=session_id,
            total_cost_usd=total_cost_usd,
            duration_ms=duration_ms,
            usage_json=usage_data,
        )
        db.commit()

        input_tokens = usage_data.get("input_tokens")
        output_tokens = usage_data.get("output_tokens")

        logger.info(
            f"Persisted usage log for session {session_id}: "
            f"cost=${total_cost_usd}, "
            f"tokens={input_tokens}+{output_tokens}, "
            f"duration={duration_ms}ms"
        )

    def _persist_message_and_tools(
        self, db: Session, session_id: uuid.UUID, message: dict[str, Any]
    ) -> None:
        role = self._extract_role_from_message(message)

        text_preview = None
        content = message.get("content", [])
        if isinstance(content, list) and len(content) > 0:
            for block in content:
                if isinstance(block, dict) and "TextBlock" in block.get("_type", ""):
                    text_preview = block.get("text", "")[:500]
                    break

        db_message = MessageRepository.create(
            session_db=db,
            session_id=session_id,
            role=role,
            content=message,
            text_preview=text_preview,
        )

        db.flush()

        self._extract_tool_executions(db, message, session_id, db_message.id)

        db.commit()
        logger.info(
            f"Persisted message {db_message.id} (role={role}) for session {session_id}"
        )

    def process_agent_callback(
        self, db: Session, callback: AgentCallbackRequest
    ) -> CallbackResponse:
        session_service = SessionService()
        db_session = session_service.find_session_by_sdk_id_or_uuid(
            db, callback.session_id
        )

        if not db_session:
            logger.warning(f"Session not found for callback: {callback.session_id}")
            return CallbackResponse(
                session_id=callback.session_id,
                status="callback_received",
                message="Session not found yet",
            )

        derived_sdk_session_id = callback.sdk_session_id
        if (
            not derived_sdk_session_id
            and callback.new_message
            and isinstance(callback.new_message, dict)
        ):
            derived_sdk_session_id = self._extract_sdk_session_id_from_message(
                callback.new_message
            )

        # Save SDK session_id if present
        if (
            derived_sdk_session_id
            and derived_sdk_session_id != db_session.sdk_session_id
        ):
            session_service.update_session(
                db,
                db_session.id,
                SessionUpdateRequest(sdk_session_id=derived_sdk_session_id),
            )
            logger.info(
                f"Updated session {db_session.id} with sdk_session_id={derived_sdk_session_id}"
            )

        if callback.status in [CallbackStatus.COMPLETED, CallbackStatus.FAILED]:
            session_service.update_session(
                db, db_session.id, SessionUpdateRequest(status=callback.status.value)
            )
            logger.info(
                f"Updated session {db_session.id} status to {callback.status.value} "
                f"via callback from {callback.session_id}"
            )

        if callback.new_message:
            self._persist_message_and_tools(db, db_session.id, callback.new_message)
            # Extract and persist usage data if this is a ResultMessage
            self._extract_and_persist_usage(db, db_session.id, callback.new_message)

        db_run = (
            db.query(AgentRun)
            .filter(AgentRun.session_id == db_session.id)
            .filter(AgentRun.status.in_(["claimed", "running"]))
            .order_by(AgentRun.created_at.desc())
            .first()
        )

        if db_run:
            db_run.progress = int(callback.progress or 0)

            if callback.status == CallbackStatus.RUNNING and db_run.status == "claimed":
                db_run.status = "running"
                if db_run.started_at is None:
                    db_run.started_at = datetime.now(timezone.utc)

            if callback.status in [CallbackStatus.COMPLETED, CallbackStatus.FAILED]:
                db_run.status = callback.status.value
                db_run.finished_at = datetime.now(timezone.utc)
                if callback.status == CallbackStatus.COMPLETED:
                    db_run.progress = 100

            db.commit()

        # TODO: Persist state_patch

        return CallbackResponse(
            session_id=str(db_session.id),
            status=db_session.status,
            callback_status=callback.status,
        )
