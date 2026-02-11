import json
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.settings import get_settings
from app.models.channel import Channel
from app.repositories.active_session_repository import ActiveSessionRepository
from app.repositories.channel_repository import ChannelRepository
from app.repositories.watch_repository import WatchRepository
from app.services.backend_client import BackendClient, BackendClientError
from app.services.message_formatter import MessageFormatter

logger = logging.getLogger(__name__)


CommandHandler = Callable[[Session, Channel, str], Awaitable[list[str]]]


@dataclass(slots=True)
class ParsedCommand:
    name: str
    args: str


class CommandService:
    def __init__(self) -> None:
        settings = get_settings()
        self.backend_user_id = settings.backend_user_id
        self.backend = BackendClient()
        self.formatter = MessageFormatter()
        self._handlers: dict[str, CommandHandler] = {
            "help": self._cmd_help,
            "start": self._cmd_help,
            "list": self._cmd_list,
            "new": self._cmd_new,
            "connect": self._cmd_connect,
            "watch": self._cmd_watch,
            "unwatch": self._cmd_unwatch,
            "subscribe": self._cmd_subscribe,
            "unsubscribe": self._cmd_unsubscribe,
            "link": self._cmd_link,
            "current": self._cmd_link,
            "clear": self._cmd_clear,
            "disconnect": self._cmd_clear,
            "approve": self._cmd_approve,
            "reject": self._cmd_reject,
            "answer": self._cmd_answer,
        }

    async def handle_text(
        self, *, db: Session, channel: Channel, text: str
    ) -> list[str]:
        clean = (text or "").strip()
        if not clean:
            return []

        if clean.startswith("/"):
            parsed = _parse_command(clean)
            if not parsed:
                return [self._help_text()]
            handler = self._handlers.get(parsed.name)
            if not handler:
                return [self._help_text()]
            return await handler(db, channel, parsed.args)

        active = ActiveSessionRepository.get_by_channel(db, channel_id=channel.id)
        if not active:
            return [
                "当前未连接会话。请先使用 /list 查看会话，或 /new 创建新会话，然后 /connect 连接。"
            ]

        try:
            result = await self.backend.enqueue_task(
                prompt=clean,
                session_id=active.session_id,
            )
        except BackendClientError as exc:
            logger.warning("enqueue_task_failed", extra={"error": str(exc)})
            return [f"发送失败：{exc}"]

        session_id = str(result.get("session_id") or active.session_id)
        run_id = str(result.get("run_id") or "")
        status = str(result.get("status") or "")
        WatchRepository.add_watch(db, channel_id=channel.id, session_id=session_id)
        return [
            self.formatter.format_task_created(
                session_id=session_id,
                run_id=run_id or None,
                status=status or None,
            )
        ]

    async def _cmd_help(self, db: Session, channel: Channel, args: str) -> list[str]:
        _ = db, channel, args
        return [self._help_text()]

    async def _cmd_list(self, db: Session, channel: Channel, args: str) -> list[str]:
        limit = _parse_positive_int(args, default=10, max_value=30)
        try:
            sessions = await self.backend.list_sessions(
                limit=limit,
                offset=0,
                kind="chat",
            )
        except BackendClientError as exc:
            return [f"查询失败：{exc}"]

        if not sessions:
            return ["暂无会话。你可以使用 /new <任务描述> 创建会话。"]

        active = ActiveSessionRepository.get_by_channel(db, channel_id=channel.id)
        active_session_id = active.session_id if active else ""
        watched_set = {
            row.session_id
            for row in WatchRepository.list_by_channel(db, channel_id=channel.id)
        }

        lines = [f"最近会话（最多 {limit} 条）："]
        for idx, item in enumerate(sessions, start=1):
            session_id = _extract_session_id(item)
            if not session_id:
                continue
            status = str(item.get("status") or "unknown")
            title = str(item.get("title") or "").strip() or "(无标题)"
            short_id = session_id[:8]

            tags: list[str] = []
            if session_id == active_session_id:
                tags.append("👉 当前")
            if session_id in watched_set:
                tags.append("👀 订阅")
            tag_str = f" [{' / '.join(tags)}]" if tags else ""

            lines.append(
                f"{idx}. {_format_status_badge(status)} {title} ({short_id}){tag_str}"
            )

        lines.append("")
        lines.append("使用 /connect <序号|session_id> 连接会话")
        lines.append("使用 /new <任务描述> 创建并连接新会话")
        return ["\n".join(lines)]

    async def _cmd_new(self, db: Session, channel: Channel, args: str) -> list[str]:
        prompt = args.strip()
        if not prompt:
            return ["用法：/new <任务描述>"]

        try:
            result = await self.backend.enqueue_task(prompt=prompt)
        except BackendClientError as exc:
            return [f"创建失败：{exc}"]

        session_id = str(result.get("session_id") or "")
        run_id = str(result.get("run_id") or "")
        status = str(result.get("status") or "")
        if session_id:
            ActiveSessionRepository.set_active(
                db,
                channel_id=channel.id,
                session_id=session_id,
            )
            WatchRepository.add_watch(db, channel_id=channel.id, session_id=session_id)

        created_text = self.formatter.format_task_created(
            session_id=session_id,
            run_id=run_id or None,
            status=status or None,
        )
        return [f"{created_text}\n已自动连接该会话。"]

    async def _cmd_connect(self, db: Session, channel: Channel, args: str) -> list[str]:
        ref = args.strip()
        if not ref:
            return ["用法：/connect <session_id|序号>"]

        try:
            session_id = await self._resolve_session_ref(ref)
            await self.backend.get_session_state(session_id=session_id)
        except BackendClientError as exc:
            return [f"连接失败：{exc}"]
        except ValueError as exc:
            return [str(exc)]

        ActiveSessionRepository.set_active(
            db,
            channel_id=channel.id,
            session_id=session_id,
        )
        WatchRepository.add_watch(db, channel_id=channel.id, session_id=session_id)
        return [
            f"🔗 已连接会话：{session_id}\n"
            f"🌐 前端查看: {self.formatter.session_url(session_id)}"
        ]

    async def _cmd_watch(self, db: Session, channel: Channel, args: str) -> list[str]:
        session_id = args.strip()
        if not session_id:
            return ["用法：/watch <session_id>"]
        WatchRepository.add_watch(db, channel_id=channel.id, session_id=session_id)
        return [
            f"👀 已订阅会话：{session_id}\n"
            f"🌐 前端查看: {self.formatter.session_url(session_id)}"
        ]

    async def _cmd_unwatch(self, db: Session, channel: Channel, args: str) -> list[str]:
        session_id = args.strip()
        if not session_id:
            return ["用法：/unwatch <session_id>"]

        removed = WatchRepository.remove_watch(
            db,
            channel_id=channel.id,
            session_id=session_id,
        )
        return [f"已取消订阅：{session_id}（removed={removed}）"]

    async def _cmd_subscribe(
        self, db: Session, channel: Channel, args: str
    ) -> list[str]:
        if args.strip().lower() != "all":
            return ["用法：/subscribe all"]
        ChannelRepository.set_subscribe_all(db, channel_id=channel.id, enabled=True)
        return [f"已开启：订阅用户 {self.backend_user_id} 的所有会话"]

    async def _cmd_unsubscribe(
        self, db: Session, channel: Channel, args: str
    ) -> list[str]:
        if args.strip().lower() != "all":
            return ["用法：/unsubscribe all"]
        ChannelRepository.set_subscribe_all(db, channel_id=channel.id, enabled=False)
        return ["已关闭：订阅所有会话"]

    async def _cmd_link(self, db: Session, channel: Channel, args: str) -> list[str]:
        _ = args
        active = ActiveSessionRepository.get_by_channel(db, channel_id=channel.id)
        if not active:
            return [
                "当前没有绑定的会话。用 /list 查看会话并 /connect，或者用 /new 创建。"
            ]
        return [
            f"👉 当前会话：{active.session_id}\n"
            f"🌐 前端查看: {self.formatter.session_url(active.session_id)}"
        ]

    async def _cmd_clear(self, db: Session, channel: Channel, args: str) -> list[str]:
        _ = args
        ActiveSessionRepository.clear(db, channel_id=channel.id)
        return ["已清除当前会话绑定"]

    async def _cmd_approve(self, db: Session, channel: Channel, args: str) -> list[str]:
        _ = db, channel
        request_id = args.strip()
        if not request_id:
            return ["用法：/approve <request_id>"]
        try:
            await self.backend.answer_user_input_request(
                request_id=request_id,
                answers={"approved": "true"},
            )
        except BackendClientError as exc:
            return [f"提交失败：{exc}"]
        return ["已同意"]

    async def _cmd_reject(self, db: Session, channel: Channel, args: str) -> list[str]:
        _ = db, channel
        request_id = args.strip()
        if not request_id:
            return ["用法：/reject <request_id>"]
        try:
            await self.backend.answer_user_input_request(
                request_id=request_id,
                answers={"approved": "false"},
            )
        except BackendClientError as exc:
            return [f"提交失败：{exc}"]
        return ["已拒绝"]

    async def _cmd_answer(self, db: Session, channel: Channel, args: str) -> list[str]:
        _ = db, channel
        parts = args.split(maxsplit=1)
        request_id = parts[0].strip() if parts else ""
        raw_json = parts[1].strip() if len(parts) > 1 else ""
        if not request_id or not raw_json:
            return ['用法：/answer <request_id> {"问题": "答案"}']

        try:
            parsed = json.loads(raw_json)
        except Exception:
            return [
                '答案 JSON 解析失败，请检查格式，例如：/answer <id> {"question":"answer"}'
            ]

        if not isinstance(parsed, dict):
            return ['答案必须是 JSON object，例如：{"question":"answer"}']

        answers: dict[str, str] = {}
        for key, value in parsed.items():
            if not isinstance(key, str):
                continue
            answers[key] = value if isinstance(value, str) else str(value)

        if not answers:
            return ["未解析到有效答案"]

        try:
            await self.backend.answer_user_input_request(
                request_id=request_id,
                answers=answers,
            )
        except BackendClientError as exc:
            return [f"提交失败：{exc}"]

        return ["已提交"]

    async def _resolve_session_ref(self, ref: str) -> str:
        raw = ref.strip()
        if not raw:
            raise ValueError("会话标识不能为空")

        if raw.isdigit():
            index = int(raw)
            if index <= 0:
                raise ValueError("会话序号必须大于 0")
            limit = min(max(index, 10), 50)
            sessions = await self.backend.list_sessions(
                limit=limit, offset=0, kind="chat"
            )
            if index > len(sessions):
                raise ValueError(f"序号超出范围：当前仅有 {len(sessions)} 条可选")
            session_id = _extract_session_id(sessions[index - 1])
            if not session_id:
                raise ValueError("无法解析会话 ID，请改用完整 session_id")
            return session_id

        return raw

    def _help_text(self) -> str:
        return (
            "可用命令：\n"
            "/list [n]  查看最近会话（默认 10）\n"
            "/connect <session_id|序号>  连接到会话\n"
            "/new <任务>  创建新会话并自动连接\n"
            "/watch <session_id>  订阅某个会话（前端会话也可）\n"
            "/unwatch <session_id>  取消订阅\n"
            "/subscribe all  订阅当前用户的所有会话\n"
            "/unsubscribe all  取消订阅所有会话\n"
            "/link  查看当前连接会话\n"
            "/clear  清除当前会话绑定\n"
            '/answer <request_id> {"问题":"答案"}  回答 AskQuestion\n'
            "/approve <request_id>  同意 plan\n"
            "/reject <request_id>  拒绝 plan\n"
            "\n"
            "普通文本：如果已连接会话，会作为续聊消息发送。"
        )


def _parse_command(text: str) -> ParsedCommand | None:
    raw = text.strip()
    if not raw.startswith("/"):
        return None
    body = raw[1:]
    if not body:
        return None
    parts = body.split(maxsplit=1)
    name = parts[0].strip().lower()
    args = parts[1].strip() if len(parts) > 1 else ""
    if not name:
        return None
    return ParsedCommand(name=name, args=args)


def _extract_session_id(item: dict) -> str:
    if not isinstance(item, dict):
        return ""
    session_id = str(item.get("session_id") or item.get("id") or "").strip()
    return session_id


def _parse_positive_int(raw: str, *, default: int, max_value: int) -> int:
    text = raw.strip()
    if not text:
        return default
    try:
        val = int(text)
    except ValueError:
        return default
    if val <= 0:
        return default
    return min(val, max_value)


def _format_status_badge(status: str) -> str:
    text = status.strip() or "unknown"
    return f"{_status_emoji(text)} [{text}]"


def _status_emoji(status: str) -> str:
    normalized = status.strip().lower()
    if normalized in {"completed", "done", "success", "succeeded"}:
        return "✅"
    if normalized in {"claimed", "running", "in_progress", "executing"}:
        return "⏳"
    if normalized in {"pending", "queued", "scheduled", "created"}:
        return "🕒"
    if normalized in {"failed", "error"}:
        return "❌"
    if normalized in {"cancelled", "canceled", "aborted"}:
        return "🚫"
    return "❔"
