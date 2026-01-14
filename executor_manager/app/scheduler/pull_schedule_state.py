from app.scheduler.pull_schedule_config import PullScheduleConfig

_CURRENT_CONFIG: PullScheduleConfig | None = None


def set_current_pull_schedule_config(config: PullScheduleConfig | None) -> None:
    global _CURRENT_CONFIG
    _CURRENT_CONFIG = config


def get_current_pull_schedule_config() -> PullScheduleConfig | None:
    return _CURRENT_CONFIG
