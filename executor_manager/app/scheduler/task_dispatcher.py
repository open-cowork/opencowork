import logging

from app.core.settings import get_settings
from app.services.backend_client import BackendClient
from app.services.container_pool import ContainerPool
from app.services.executor_client import ExecutorClient

logger = logging.getLogger(__name__)


class TaskDispatcher:
    """Task dispatcher with container pool integration."""

    container_pool: ContainerPool | None = None

    @classmethod
    def get_container_pool(cls) -> ContainerPool:
        """Get container pool instance (lazy load)."""
        if cls.container_pool is None:
            cls.container_pool = ContainerPool()
        return cls.container_pool

    @staticmethod
    async def dispatch(
        task_id: str,
        session_id: str,
        prompt: str,
        config: dict,
        sdk_session_id: str | None = None,
    ) -> None:
        """Dispatch task to executor.

        Args:
            task_id: Task ID
            session_id: Session ID
            prompt: Task prompt
            config: Task configuration
            sdk_session_id: Claude SDK session ID for resuming conversations
        """
        settings = get_settings()
        executor_client = ExecutorClient()
        backend_client = BackendClient()
        container_pool = TaskDispatcher.get_container_pool()

        user_id = config.get("user_id", "")
        container_mode = config.get("container_mode", "ephemeral")
        container_id = config.get("container_id")

        callback_url = f"{settings.callback_base_url}/api/v1/callback"
        callback_token = settings.callback_token

        executor_url = None
        try:
            logger.info(
                f"Dispatching task {task_id} (session: {session_id}, mode: {container_mode})"
            )

            executor_url, container_id = await container_pool.get_or_create_container(
                session_id=session_id,
                user_id=user_id,
                container_mode=container_mode,
                container_id=container_id,
            )

            await backend_client.update_session_status(session_id, "running")

            await executor_client.execute_task(
                executor_url=executor_url,
                session_id=session_id,
                prompt=prompt,
                callback_url=callback_url,
                callback_token=callback_token,
                config=config,
                sdk_session_id=sdk_session_id,
            )

            logger.info(f"Task {task_id} dispatched successfully to executor")

        except Exception as e:
            logger.error(f"Failed to dispatch task {task_id}: {e}")
            await backend_client.update_session_status(session_id, "failed")
            await container_pool.cancel_task(session_id)
            raise

    @staticmethod
    async def on_task_complete(session_id: str) -> None:
        """Handle task completion.

        Args:
            session_id: Session ID
        """
        container_pool = TaskDispatcher.get_container_pool()
        await container_pool.on_task_complete(session_id)
