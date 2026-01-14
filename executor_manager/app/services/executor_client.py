import httpx

from app.core.settings import get_settings


class ExecutorClient:
    """Client for calling the Executor service."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.executor_url = self.settings.executor_url

    async def execute_task(
        self,
        executor_url: str,
        session_id: str,
        prompt: str,
        callback_url: str,
        callback_token: str,
        config: dict,
        sdk_session_id: str | None = None,
    ) -> str:
        """Call Executor to execute a task.

        Args:
            executor_url: Executor service URL
            session_id: Session ID
            prompt: Task prompt
            callback_url: Callback URL
            callback_token: Callback token
            config: Task configuration
            sdk_session_id: Claude SDK session ID for resuming conversations
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{executor_url}/v1/tasks/execute",
                json={
                    "session_id": session_id,
                    "prompt": prompt,
                    "callback_url": callback_url,
                    "callback_token": callback_token,
                    "config": config,
                    "sdk_session_id": sdk_session_id,
                },
                timeout=httpx.Timeout(30.0, connect=10.0),
            )
            response.raise_for_status()
            data = response.json()
            return data["session_id"]
