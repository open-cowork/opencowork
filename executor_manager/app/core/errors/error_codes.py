from enum import Enum


class ErrorCode(Enum):
    BAD_REQUEST = (40000, "Bad request")
    UNAUTHORIZED = (40100, "Unauthorized")
    FORBIDDEN = (40300, "Forbidden")
    NOT_FOUND = (40400, "Resource not found")

    TASK_NOT_FOUND = (20001, "Task not found")
    TASK_DISPATCH_FAILED = (20002, "Failed to dispatch task to executor")
    TASK_SCHEDULING_FAILED = (20003, "Failed to schedule task")

    SESSION_NOT_FOUND = (21001, "Session not found")
    SESSION_CREATE_FAILED = (21002, "Failed to create session")
    SESSION_UPDATE_FAILED = (21003, "Failed to update session status")

    EXECUTOR_UNAVAILABLE = (30001, "Executor service unavailable")
    BACKEND_UNAVAILABLE = (30002, "Backend service unavailable")
    CALLBACK_FORWARD_FAILED = (30003, "Failed to forward callback to backend")
    EXTERNAL_SERVICE_ERROR = (50201, "External service error")
    ENV_VAR_NOT_FOUND = (40001, "Environment variable not found")
    MCP_SERVER_NOT_FOUND = (40002, "MCP server not found")
    SKILL_NOT_FOUND = (40003, "Skill not found")
    SKILL_DOWNLOAD_FAILED = (40004, "Skill download failed")
    PLUGIN_DOWNLOAD_FAILED = (40005, "Plugin download failed")

    WORKSPACE_NOT_FOUND = (22001, "Workspace not found")
    WORKSPACE_ARCHIVE_FAILED = (22002, "Failed to archive workspace")
    WORKSPACE_DELETE_FAILED = (22003, "Failed to delete workspace")
    WORKSPACE_PERSISTENT_DELETE_FORBIDDEN = (
        22004,
        "Cannot delete persistent workspace without force flag",
    )

    CONTAINER_START_FAILED = (31001, "Failed to start container")
    CONTAINER_NOT_FOUND = (31002, "Container not found")

    INTERNAL_ERROR = (50000, "Internal server error")

    @property
    def code(self) -> int:
        return self.value[0]

    @property
    def message(self) -> str:
        return self.value[1]
