import os

from claude_agent_sdk import ClaudeAgentOptions
from claude_agent_sdk.client import ClaudeSDKClient
from dotenv import load_dotenv

from app.core.workspace import WorkspaceManager
from app.hooks.base import ExecutionContext
from app.hooks.manager import HookManager
from app.schemas.request import TaskConfig

load_dotenv()


class AgentExecutor:
    def __init__(self, session_id: str, hooks: list, sdk_session_id: str | None = None):
        self.session_id = session_id
        self.sdk_session_id = sdk_session_id
        self.hooks = HookManager(hooks)
        self.workspace = WorkspaceManager(
            mount_path=os.environ.get("WORKSPACE_PATH", "/workspace")
        )

    async def execute(self, prompt: str, config: TaskConfig):
        await self.workspace.prepare(config)
        ctx = ExecutionContext(self.session_id, str(self.workspace.work_path))

        try:
            await self.hooks.run_on_setup(ctx)

            input_hint = self._build_input_hint(config)
            if input_hint:
                prompt = f"{input_hint}\n\n{prompt}"

            options = ClaudeAgentOptions(
                cwd=ctx.cwd,
                resume=self.sdk_session_id,
                setting_sources=["project"],
                mcp_servers=config.mcp_config,
                permission_mode="bypassPermissions",
                model=os.environ["DEFAULT_MODEL"],
            )

            async with ClaudeSDKClient(options=options) as client:
                await client.query(prompt)
                async for msg in client.receive_response():
                    await self.hooks.run_on_response(ctx, msg)

        except Exception as e:
            import traceback

            traceback.print_exc()
            await self.hooks.run_on_error(ctx, e)

        finally:
            await self.hooks.run_on_teardown(ctx)
            await self.workspace.cleanup()

    def _build_input_hint(self, config: TaskConfig) -> str | None:
        inputs = config.input_files or []
        if not inputs:
            return None

        lines = [
            "User-uploaded inputs are available under inputs/ (or /workspace/inputs):",
        ]
        for item in inputs:
            path = getattr(item, "path", None) or ""
            name = getattr(item, "name", None) or ""
            display = path.lstrip("/") if path else (f"inputs/{name}" if name else "")
            if display:
                lines.append(f"- {display}")
        lines.append("Do not modify files under inputs/ unless the user asks.")
        return "\n".join(lines)
