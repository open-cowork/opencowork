# IM 配置指南（Telegram / 钉钉）

本文说明如何为 Poco 的独立 IM 服务配置 Telegram 和钉钉机器人。

相关代码目录：`im/`

## 1. 先决条件

- Backend 已可用（例如 `http://localhost:8000` 或线上地址）。
- 你准备启动 IM 服务（`im`）并可查看日志。
- 如果使用 Telegram webhook 或钉钉 webhook 模式，IM 需要可被公网 HTTPS 访问。

## 2. 配置文件位置（非常重要）

根据你的启动方式，环境变量来源不同：

- `docker compose --profile im up ...`：读取仓库根目录 `.env`
- 在 `im/` 目录本地运行 `uvicorn`：读取 `im/.env`

建议先确认你当前是 Docker 方式还是本地方式，再编辑对应文件。

## 3. 通用环境变量

```bash
# IM service
IM_PORT=8002
IM_DATABASE_URL=sqlite:///./im.db
BACKEND_URL=http://localhost:8000
BACKEND_USER_ID=default
FRONTEND_PUBLIC_URL=http://localhost:3000
FRONTEND_DEFAULT_LANG=zh

# Polling
POLL_USER_INPUT_INTERVAL_SECONDS=2
POLL_SESSION_MESSAGES_INTERVAL_SECONDS=2
POLL_SESSIONS_RECENT_INTERVAL_SECONDS=5
POLL_SESSIONS_FULL_INTERVAL_SECONDS=300
POLL_HTTP_TIMEOUT_SECONDS=10
```

## 4. Telegram 配置

### 4.1 申请机器人

1. 在 Telegram 中找到 `@BotFather`
2. 执行 `/newbot` 并完成创建
3. 拿到 `TELEGRAM_BOT_TOKEN`

### 4.2 配置环境变量

```bash
TELEGRAM_BOT_TOKEN=<你的 bot token>
# 建议配置，防止伪造 webhook 请求
TELEGRAM_WEBHOOK_SECRET_TOKEN=<随机长字符串>
```

说明：

- `TELEGRAM_WEBHOOK_SECRET_TOKEN` 是你自定义的值，不是 BotFather 提供。
- 如果你配置了该值，Telegram 的 `setWebhook` 必须传同样的 `secret_token`。

### 4.3 启动 IM 服务

- Docker：`docker compose --profile im up -d im`
- 本地：

```bash
cd im
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8002
```

### 4.4 设置 Telegram webhook

将 `WEBHOOK_BASE` 换成你的公网 HTTPS 域名。

```bash
export TELEGRAM_BOT_TOKEN="<你的 bot token>"
export WEBHOOK_SECRET="<TELEGRAM_WEBHOOK_SECRET_TOKEN>"
export WEBHOOK_BASE="https://your-domain.example.com"

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_BASE}/api/v1/webhooks/telegram\",
    \"secret_token\": \"${WEBHOOK_SECRET}\",
    \"allowed_updates\": [\"message\", \"edited_message\"],
    \"drop_pending_updates\": true
  }"
```

### 4.5 验证 webhook

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

重点检查：

- `url` 是否正确
- `last_error_message` 是否为空
- `pending_update_count` 是否持续积压

### 4.6 联调测试

1. 私聊机器人发送 `/help`
2. 发送 `/new <任务描述>` 创建会话
3. 再发送普通文本，验证续聊

提示：当前实现对群聊命令更建议直接使用 `/help`、`/list`、`/new ...`；若遇到命令无响应，优先在私聊中验证。

## 5. 钉钉配置

钉钉支持两种入站模式：

- Stream 模式（推荐）
- Webhook 模式（可选）

### 5.1 Stream 模式（推荐）

优点：不依赖公网 webhook，适合稳定收消息/事件回调。

#### 环境变量

```bash
DINGTALK_ENABLED=true
DINGTALK_STREAM_ENABLED=true
DINGTALK_STREAM_SUBSCRIBE_EVENTS=false

DINGTALK_CLIENT_ID=<应用 appKey>
DINGTALK_CLIENT_SECRET=<应用 appSecret>
DINGTALK_ROBOT_CODE=<机器人 robotCode>
DINGTALK_OPEN_BASE_URL=https://api.dingtalk.com
```

#### 平台侧配置（钉钉开放平台）

1. 创建企业内部应用（机器人）
2. 获取 `appKey/appSecret`
3. 获取 `robotCode`
4. 启用 Stream 事件接收能力（消息相关）

> 不同钉钉控制台版本的按钮名称可能有差异，但核心是“应用 + 机器人 + Stream 接收”。

#### 发送路径说明

- 入站：通过 Stream 长连接接收
- 出站：优先使用 OpenAPI（依赖 `DINGTALK_CLIENT_ID/SECRET/ROBOT_CODE`）

### 5.2 Webhook 模式（可选）

当你不使用 Stream 时可启用 webhook 回调。

#### 环境变量

```bash
DINGTALK_ENABLED=true
DINGTALK_STREAM_ENABLED=false
# 可选，建议配置
DINGTALK_WEBHOOK_TOKEN=<自定义校验 token>
```

#### 回调地址

- `POST /api/v1/webhooks/dingtalk`
- 示例：`https://your-domain.example.com/api/v1/webhooks/dingtalk`

`DINGTALK_WEBHOOK_TOKEN` 启用后，请确保请求中带同值（支持 query `token`、请求头 `X-DingTalk-Token` 或 payload 字段 `token`）。

### 5.3 钉钉出站兜底 webhook（可选）

```bash
DINGTALK_WEBHOOK_URL=<群自定义机器人 webhook>
```

该配置仅作为出站兜底通知通道，推荐仍优先使用 OpenAPI。

### 5.4 联调测试

1. 私聊或群聊 `@机器人` 后发送 `/help`
2. 发送 `/new <任务描述>`
3. 验证任务通知是否能回推到钉钉

说明：群聊场景中，钉钉通常要求 `@机器人` 才会被处理。

## 6. 常见问题排查

### 6.1 Telegram 能 setWebhook 成功但机器人不回消息

按顺序检查：

1. IM 是否真的在运行，`GET /api/v1/health` 是否正常
2. 环境变量是否写在正确文件（根 `.env` vs `im/.env`）
3. `TELEGRAM_BOT_TOKEN` 是否生效
4. 若配置了 `TELEGRAM_WEBHOOK_SECRET_TOKEN`，`setWebhook` 是否传了同值 `secret_token`
5. 查看 IM 日志是否有：
   - `Invalid webhook token`
   - `im_provider_disabled`
   - `telegram_send_failed`

### 6.2 钉钉消息收不到

1. `DINGTALK_ENABLED=true` 是否生效
2. Stream 模式下 `DINGTALK_CLIENT_ID/SECRET/ROBOT_CODE` 是否正确
3. Webhook 模式下 token 校验是否一致
4. 群聊中是否 `@机器人`

### 6.3 `/help` 可以，但普通文本不触发任务

这通常是未连接会话导致：

- 先执行 `/new <任务>` 或 `/connect <session_id>`
- 再发送普通文本续聊

## 7. 安全建议

- 不要把 `TELEGRAM_BOT_TOKEN`、`DINGTALK_CLIENT_SECRET` 提交到 Git。
- 建议开启 `TELEGRAM_WEBHOOK_SECRET_TOKEN` 和 `DINGTALK_WEBHOOK_TOKEN`。
- 若凭据泄露，立即在平台侧轮换（revoke/重置）。
