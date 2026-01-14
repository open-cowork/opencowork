import logging

from app.schemas.callback import AgentCallbackRequest, CallbackReceiveResponse

logger = logging.getLogger(__name__)


class CallbackService:
    """Service layer for callback processing."""

    def __init__(self) -> None:
        pass

    async def process_callback(
        self, callback: AgentCallbackRequest
    ) -> CallbackReceiveResponse:
        """Process agent execution callback from executor.

        Args:
            callback: Callback data from executor

        Returns:
            CallbackReceiveResponse with acknowledgment

        Raises:
            AppException: If callback forwarding to backend fails
        """
        from app.core.errors.error_codes import ErrorCode
        from app.core.errors.exceptions import AppException
        from app.services.backend_client import BackendClient

        backend_client = BackendClient()

        # Log callback summary
        logger.info(
            f"Callback received - Session: {callback.session_id}, "
            f"Status: {callback.status}, Progress: {callback.progress}%"
        )

        if callback.state_patch:
            state = callback.state_patch
            todo_count = len(state.todos) if state.todos else 0
            mcp_count = len(state.mcp_status) if state.mcp_status else 0
            file_count = (
                len(state.workspace_state.file_changes) if state.workspace_state else 0
            )
            logger.info(
                f"State patch: {todo_count} todos, {mcp_count} MCP servers, {file_count} file changes"
            )

        try:
            # Forward callback to backend
            await backend_client.forward_callback(callback.model_dump(mode="json"))

            if callback.status in ["completed", "failed"]:
                from app.scheduler.task_dispatcher import TaskDispatcher

                logger.info(
                    f"Task {callback.status}, cleaning up container for session {callback.session_id}"
                )
                await TaskDispatcher.on_task_complete(callback.session_id)

            return CallbackReceiveResponse(
                status="received",
                session_id=callback.session_id,
                callback_status=callback.status,
                progress=callback.progress,
            )

        except Exception as e:
            logger.error(f"Failed to forward callback: {e}")
            raise AppException(
                error_code=ErrorCode.CALLBACK_FORWARD_FAILED,
                message=f"Failed to forward callback to backend: {e}",
            )
