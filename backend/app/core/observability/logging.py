import logging

from app.core.observability.request_context import get_request_id, get_trace_id

_installed_record_factory = False


def configure_logging(*, debug: bool) -> None:
    """Configure logging with request_id/trace_id enrichment.

    Args:
        debug: If True, set logging level to DEBUG; otherwise INFO.
    """
    global _installed_record_factory
    if not _installed_record_factory:
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = get_request_id() or "-"
            record.trace_id = get_trace_id() or "-"
            return record

        logging.setLogRecordFactory(record_factory)
        _installed_record_factory = True

    level = logging.DEBUG if debug else logging.INFO
    if not logging.getLogger().handlers:
        logging.basicConfig(
            level=level,
            format=(
                "%(asctime)s %(levelname)s %(name)s "
                "[request_id=%(request_id)s trace_id=%(trace_id)s] %(message)s"
            ),
        )
    else:
        logging.getLogger().setLevel(level)
