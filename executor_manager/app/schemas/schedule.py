from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ScheduleJobInfo(BaseModel):
    """APScheduler job info for UI display."""

    job_id: str
    trigger: str
    next_run_time: datetime | None = None


class ScheduleRuleInfo(BaseModel):
    """Effective schedule rule info (config + current APScheduler state)."""

    id: str
    kind: Literal["interval", "window"]
    enabled: bool
    schedule_modes: list[str] = Field(default_factory=list)

    # interval
    seconds: int | None = None
    start_immediately: bool | None = None

    # window
    cron: dict[str, Any] | None = None
    timezone: str | None = None
    window_minutes: int | None = None
    poll_interval_seconds: int | None = None
    bootstrap_lookback_hours: int | None = None
    bootstrap_max_iterations: int | None = None

    jobs: list[ScheduleJobInfo] = Field(default_factory=list)


class SchedulesResponse(BaseModel):
    """All schedule modes supported by Executor Manager."""

    rules: list[ScheduleRuleInfo] = Field(default_factory=list)
