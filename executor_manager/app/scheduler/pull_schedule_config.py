import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any, Literal

import tomllib
from apscheduler.triggers.cron import CronTrigger
from pydantic import BaseModel, Field, field_validator, model_validator
from zoneinfo import ZoneInfo


class IntervalPullRule(BaseModel):
    kind: Literal["interval"] = "interval"
    id: str
    enabled: bool = True
    schedule_modes: list[str] = Field(default_factory=list)
    seconds: int = 2
    start_immediately: bool = True

    @field_validator("id")
    @classmethod
    def _validate_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("rule id cannot be empty")
        return v

    @field_validator("schedule_modes")
    @classmethod
    def _validate_schedule_modes(cls, v: list[str]) -> list[str]:
        cleaned = [m.strip() for m in v if isinstance(m, str) and m.strip()]
        return cleaned


class WindowPullRule(BaseModel):
    kind: Literal["window"] = "window"
    id: str
    enabled: bool = True
    schedule_modes: list[str] = Field(default_factory=list)

    # CronTrigger fields (APS cheduler)
    cron: dict[str, Any] = Field(default_factory=dict)
    timezone: str = "UTC"

    window_minutes: int = 360
    poll_interval_seconds: int = 2

    # Bootstrap window if Manager restarts during an active window
    bootstrap_lookback_hours: int = 48
    bootstrap_max_iterations: int = 5000

    @field_validator("id")
    @classmethod
    def _validate_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("rule id cannot be empty")
        return v

    @field_validator("schedule_modes")
    @classmethod
    def _validate_schedule_modes(cls, v: list[str]) -> list[str]:
        cleaned = [m.strip() for m in v if isinstance(m, str) and m.strip()]
        return cleaned

    @model_validator(mode="after")
    def _validate_window(self) -> "WindowPullRule":
        if not self.cron:
            raise ValueError("window rule requires non-empty cron config")
        if self.window_minutes <= 0:
            raise ValueError("window_minutes must be > 0")
        if self.poll_interval_seconds <= 0:
            raise ValueError("poll_interval_seconds must be > 0")
        if self.bootstrap_lookback_hours <= 0:
            raise ValueError("bootstrap_lookback_hours must be > 0")
        if self.bootstrap_max_iterations <= 0:
            raise ValueError("bootstrap_max_iterations must be > 0")
        return self

    def build_cron_trigger(self) -> CronTrigger:
        cron = dict(self.cron)
        tz_name = str(cron.pop("timezone", self.timezone)).strip() or "UTC"
        try:
            tz = ZoneInfo(tz_name)
        except Exception:
            tz = timezone.utc
        return CronTrigger(timezone=tz, **cron)

    def resolve_bootstrap_window_until(self, now_utc: datetime) -> datetime | None:
        trigger = self.build_cron_trigger()
        lookback = now_utc - timedelta(hours=self.bootstrap_lookback_hours)

        last_fire: datetime | None = None
        next_fire = trigger.get_next_fire_time(None, lookback)
        iterations = 0

        while next_fire and next_fire <= now_utc:
            last_fire = next_fire
            iterations += 1
            if iterations >= self.bootstrap_max_iterations:
                break
            next_fire = trigger.get_next_fire_time(
                last_fire, last_fire + timedelta(microseconds=1)
            )

        if not last_fire:
            return None

        window_until = last_fire + timedelta(minutes=self.window_minutes)
        window_until_utc = window_until.astimezone(timezone.utc)
        if window_until_utc <= now_utc:
            return None
        return window_until_utc


PullRule = Annotated[IntervalPullRule | WindowPullRule, Field(discriminator="kind")]


class PullScheduleConfig(BaseModel):
    enabled: bool = True
    rules: list[PullRule] = Field(default_factory=list)

    @model_validator(mode="after")
    def _normalize(self) -> "PullScheduleConfig":
        seen: set[str] = set()
        for rule in self.rules:
            if rule.id in seen:
                raise ValueError(f"duplicate rule id: {rule.id}")
            seen.add(rule.id)
            if not rule.schedule_modes:
                rule.schedule_modes = [rule.id]
        return self


def _load_file_data(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(str(path))

    raw = path.read_bytes()
    suffix = path.suffix.lower()

    if suffix in [".toml"]:
        return tomllib.loads(raw.decode("utf-8"))
    if suffix in [".json"]:
        return json.loads(raw.decode("utf-8"))

    raise ValueError(f"Unsupported schedule config format: {path.suffix}")


def load_pull_schedule_config(path: str | None) -> PullScheduleConfig | None:
    if not path:
        return None
    resolved = Path(path).expanduser()
    data = _load_file_data(resolved)
    return PullScheduleConfig.model_validate(data)


def default_pull_schedule_config_from_settings(settings: Any) -> PullScheduleConfig:
    default_interval = max(1, int(getattr(settings, "task_pull_interval_seconds", 2)))

    rules: list[PullRule] = []

    if bool(getattr(settings, "task_pull_immediate_enabled", True)):
        seconds = max(
            1,
            int(
                getattr(settings, "task_pull_immediate_interval_seconds", None)
                or default_interval
            ),
        )
        rules.append(
            IntervalPullRule(
                id="immediate",
                enabled=True,
                schedule_modes=["immediate"],
                seconds=seconds,
                start_immediately=True,
            )
        )

    if bool(getattr(settings, "task_pull_scheduled_enabled", True)):
        seconds = max(
            1,
            int(
                getattr(settings, "task_pull_scheduled_interval_seconds", None)
                or default_interval
            ),
        )
        rules.append(
            IntervalPullRule(
                id="scheduled",
                enabled=True,
                schedule_modes=["scheduled"],
                seconds=seconds,
                start_immediately=True,
            )
        )

    if bool(getattr(settings, "task_pull_nightly_enabled", True)):
        rules.append(
            WindowPullRule(
                id="nightly",
                enabled=True,
                schedule_modes=["nightly"],
                cron={
                    "hour": int(getattr(settings, "task_pull_nightly_start_hour", 2)),
                    "minute": int(
                        getattr(settings, "task_pull_nightly_start_minute", 0)
                    ),
                },
                timezone=str(getattr(settings, "task_pull_nightly_timezone", "UTC")),
                window_minutes=int(
                    getattr(settings, "task_pull_nightly_window_minutes", 360)
                ),
                poll_interval_seconds=int(
                    getattr(settings, "task_pull_nightly_poll_interval_seconds", 2)
                ),
            )
        )

    return PullScheduleConfig(
        enabled=bool(getattr(settings, "task_pull_enabled", True)), rules=rules
    )
