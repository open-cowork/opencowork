from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.scheduler.pull_schedule_config import (
    IntervalPullRule,
    PullScheduleConfig,
    WindowPullRule,
)
from app.scheduler.pull_schedule_state import set_current_pull_schedule_config
from app.services.run_pull_service import RunPullService


def register_pull_jobs(
    scheduler: AsyncIOScheduler,
    pull_service: RunPullService,
    config: PullScheduleConfig,
) -> list[str]:
    """Register queue pulling jobs based on PullScheduleConfig.

    Returns:
        A list of APScheduler job IDs registered by this call.
    """
    set_current_pull_schedule_config(config)

    job_ids: list[str] = []

    if not config.enabled:
        return job_ids

    now_utc = datetime.now(timezone.utc)

    for rule in config.rules:
        if not rule.enabled:
            continue

        if isinstance(rule, IntervalPullRule):
            job_id = f"pull-{rule.id}"
            scheduler.add_job(
                pull_service.poll,
                trigger="interval",
                seconds=max(1, int(rule.seconds)),
                id=job_id,
                replace_existing=True,
                kwargs={"schedule_modes": rule.schedule_modes},
                next_run_time=now_utc if rule.start_immediately else None,
            )
            job_ids.append(job_id)
            continue

        if isinstance(rule, WindowPullRule):
            open_job_id = f"pull-{rule.id}-open"
            poll_job_id = f"pull-{rule.id}-poll"

            trigger: CronTrigger = rule.build_cron_trigger()
            window_until = rule.resolve_bootstrap_window_until(now_utc)
            if window_until:
                pull_service.set_window_until(rule.id, window_until)

            scheduler.add_job(
                pull_service.open_window,
                trigger=trigger,
                id=open_job_id,
                replace_existing=True,
                kwargs={
                    "window_id": rule.id,
                    "schedule_modes": rule.schedule_modes,
                    "window_minutes": rule.window_minutes,
                },
            )
            job_ids.append(open_job_id)

            scheduler.add_job(
                pull_service.poll_window,
                trigger="interval",
                seconds=max(1, int(rule.poll_interval_seconds)),
                id=poll_job_id,
                replace_existing=True,
                next_run_time=now_utc,
                kwargs={
                    "window_id": rule.id,
                    "schedule_modes": rule.schedule_modes,
                },
            )
            job_ids.append(poll_job_id)

    return job_ids


def unregister_pull_jobs(scheduler: AsyncIOScheduler, job_ids: list[str]) -> None:
    for job_id in job_ids:
        try:
            scheduler.remove_job(job_id)
        except Exception:
            continue
