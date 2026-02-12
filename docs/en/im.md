# IM Configuration Guide (Telegram / DingTalk)

This document explains how to configure Telegram and DingTalk bots for Poco's standalone IM service.

Related code directory: `im/`

## 1. Prerequisites

- Backend is available (for example `http://localhost:8000` or a public URL).
- You can start the IM service (`im`) and inspect its logs.
- For Telegram webhook or DingTalk webhook mode, IM must be reachable from a public HTTPS URL.

## 2. Config File Location (Important)

Environment variable source depends on your startup mode:

- `docker compose --profile im up ...`: reads repo root `.env`
- local `uvicorn` run under `im/`: reads `im/.env`

Confirm your mode first, then edit the correct file.

## 3. Common Environment Variables

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

## 4. Telegram Setup

### 4.1 Create the bot

1. Open `@BotFather` in Telegram
2. Run `/newbot` and finish creation
3. Copy `TELEGRAM_BOT_TOKEN`

### 4.2 Configure environment variables

```bash
TELEGRAM_BOT_TOKEN=<your bot token>
# Recommended, prevents forged webhook requests
TELEGRAM_WEBHOOK_SECRET_TOKEN=<random long string>
```

Notes:

- `TELEGRAM_WEBHOOK_SECRET_TOKEN` is user-defined, not issued by BotFather.
- If set, you must pass the same value as `secret_token` when calling `setWebhook`.

### 4.3 Start IM service

- Docker: `docker compose --profile im up -d im`
- Local:

```bash
cd im
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8002
```

### 4.4 Configure Telegram webhook

Replace `WEBHOOK_BASE` with your public HTTPS domain.

```bash
export TELEGRAM_BOT_TOKEN="<your bot token>"
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

### 4.5 Verify webhook

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

Check these fields:

- `url` is correct
- `last_error_message` is empty
- `pending_update_count` is not continuously growing

### 4.6 Functional test

1. Send `/help` in a private chat with the bot
2. Send `/new <task description>` to create a session
3. Send normal text to continue the session

Tip: for groups, prefer plain `/help`, `/list`, `/new ...`; if commands do not respond, verify in private chat first.

## 5. DingTalk Setup

DingTalk supports two inbound modes:

- Stream mode (recommended)
- Webhook mode (optional)

### 5.1 Stream mode (recommended)

Pros: no public webhook required, stable for inbound message/event handling.

#### Environment variables

```bash
DINGTALK_ENABLED=true
DINGTALK_STREAM_ENABLED=true
DINGTALK_STREAM_SUBSCRIBE_EVENTS=false

DINGTALK_CLIENT_ID=<appKey>
DINGTALK_CLIENT_SECRET=<appSecret>
DINGTALK_ROBOT_CODE=<robotCode>
DINGTALK_OPEN_BASE_URL=https://api.dingtalk.com
```

#### Platform setup (DingTalk Open Platform)

1. Create an internal enterprise app (robot)
2. Get `appKey/appSecret`
3. Get `robotCode`
4. Enable Stream event receiving for message-related events

> UI labels may vary by console version, but the key pieces are app credentials + robot + stream receiving.

#### Delivery path

- Inbound: via Stream long connection
- Outbound: OpenAPI first (requires `DINGTALK_CLIENT_ID/SECRET/ROBOT_CODE`)

### 5.2 Webhook mode (optional)

Use webhook callbacks if you do not use Stream.

#### Environment variables

```bash
DINGTALK_ENABLED=true
DINGTALK_STREAM_ENABLED=false
# Optional but recommended
DINGTALK_WEBHOOK_TOKEN=<custom verification token>
```

#### Callback endpoint

- `POST /api/v1/webhooks/dingtalk`
- Example: `https://your-domain.example.com/api/v1/webhooks/dingtalk`

If `DINGTALK_WEBHOOK_TOKEN` is set, send the same value via query `token`, header `X-DingTalk-Token`, or payload field `token`.

### 5.3 Optional outbound fallback webhook

```bash
DINGTALK_WEBHOOK_URL=<group custom robot webhook>
```

This is outbound fallback only. OpenAPI is still the recommended primary path.

### 5.4 Functional test

1. In private or group chat, send `/help` (group usually needs `@bot`)
2. Send `/new <task description>`
3. Verify task notifications are pushed back to DingTalk

## 6. Troubleshooting

### 6.1 `setWebhook` succeeds, but Telegram bot does not reply

Check in order:

1. IM is running and `GET /api/v1/health` works
2. Env vars are in the correct file (root `.env` vs `im/.env`)
3. `TELEGRAM_BOT_TOKEN` is actually loaded
4. If `TELEGRAM_WEBHOOK_SECRET_TOKEN` is set, `setWebhook` includes the same `secret_token`
5. IM logs contain errors like:
   - `Invalid webhook token`
   - `im_provider_disabled`
   - `telegram_send_failed`

### 6.2 DingTalk messages are not received

1. `DINGTALK_ENABLED=true` is loaded
2. In Stream mode, `DINGTALK_CLIENT_ID/SECRET/ROBOT_CODE` are correct
3. In webhook mode, token validation values match
4. In group chat, the bot is mentioned

### 6.3 `/help` works but normal text does not create/continue tasks

Usually no active session is bound:

- Run `/new <task>` or `/connect <session_id>` first
- Then send normal text

## 7. Security Recommendations

- Do not commit `TELEGRAM_BOT_TOKEN` or `DINGTALK_CLIENT_SECRET` to Git.
- Enable `TELEGRAM_WEBHOOK_SECRET_TOKEN` and `DINGTALK_WEBHOOK_TOKEN`.
- Rotate credentials immediately if leaked.
