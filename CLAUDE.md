# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poco is a multi-service AI agent execution platform that orchestrates Claude AI agents to perform coding tasks. The system consists of four main components:

- **Frontend** (Next.js 16) - Web UI for task management and monitoring
- **Backend** (FastAPI) - API server, database management, and session orchestration
- **Executor** (FastAPI + Claude Agent SDK) - Agent execution engine with hook-based extensibility
- **Executor Manager** (FastAPI + APScheduler) - Task scheduling and dispatch service

## Architecture Flow

1. User creates task via Frontend
2. Executor Manager receives task, creates session via Backend
3. Executor Manager schedules task with APScheduler
4. Task Dispatcher sends task to Executor with callback URL
5. Executor runs Claude Agent SDK with configured hooks
6. Hooks send progress callbacks to Executor Manager during execution
7. Executor Manager forwards callbacks to Backend for persistence
8. Frontend polls Backend for session status updates

## Development Commands

### Frontend (Next.js)

```bash
cd frontend
pnpm install        # Install dependencies
pnpm dev            # Development server
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # ESLint
pnpm format         # Prettier
```

### Python Services (Backend, Executor, Executor Manager)

Each Python service has its own directory with a `pyproject.toml`. Run commands from within the service directory:

```bash
cd <service>        # backend/, executor/, or executor_manager/
uv sync             # Install dependencies
uv run python -m app.main    # Run development server
# Or directly with uvicorn:
uvicorn app.main:app --reload
```

### Database Migrations (Backend)

```bash
cd backend
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                               # Apply migrations
alembic downgrade -1                               # Rollback one migration
```

### Pre-commit Hooks

```bash
pre-commit install      # Install hooks
pre-commit run --all-files  # Run manually
```

## Technology Stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, pnpm

**Backend Services:** Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic Settings, PostgreSQL

**Executor:** claude-agent-sdk, FastAPI

**Executor Manager:** APScheduler, httpx, FastAPI

**Package Managers:** UV for Python, pnpm for Node.js

**Python Package Index:** Tsinghua mirror (https://pypi.tuna.tsinghua.edu.cn/simple)

## Code Organization

### Backend (`backend/app/`)

- `api/v1/` - API endpoints (sessions, callback)
- `core/` - Settings, error handlers, middleware, observability
- `models/` - SQLAlchemy models (agent_session, agent_message, tool_execution, usage_log)
- `repositories/` - Data access layer (session_repository, message_repository, etc.)
- `schemas/` - Pydantic schemas (session, callback, response)
- `services/` - Business logic (session_service, callback_service)
- `main.py` - FastAPI app factory

### Executor (`executor/app/`)

- `core/` - AgentExecutor engine, workspace management, callback client
- `hooks/` - Hook system for extensibility (base, manager, callback, todo, workspace)
- `utils/` - Serializer, git platform clients (GitHub, GitLab)
- `schemas/` - Request, response, callback, state schemas and enums
- `api/v1/` - Task execution callback endpoint

### Executor Manager (`executor_manager/app/`)

- `core/settings.py` - Service configuration
- `scheduler/` - APScheduler config and task dispatcher
- `services/` - Backend and executor API clients
- `schemas/` - Task and callback schemas
- `api/v1/` - Task creation, status, and callback endpoints

### Frontend (`frontend/`)

- `app/` - App Router pages (home/, layout.tsx, page.tsx, globals.css)
- `components/` - React components (home/, ui/, theme-provider.tsx)
- `hooks/` - Custom React hooks
- `lib/` - Utilities (utils.ts)

## Key Design Patterns

- **Repository Pattern** - Data access abstraction in `backend/app/repositories/`
- **Service Layer** - Business logic in `backend/app/services/`
- **Hook Pattern** - Plugin-based extensibility in `executor/app/hooks/`
- **Abstract Base Classes** - Git platform clients extend `BaseGitClient`

## Environment Configuration

Each Python service requires a `.env` file. See `backend/.env.example` for the Backend template.

**Backend:** DATABASE_URL, HOST, PORT, CORS_ORIGINS, SECRET_KEY, DEBUG
**Executor Manager:** backend_url, executor_url, callback_base_url, max_concurrent_tasks, callback_token
**Executor:** DEFAULT_MODEL, workspace mount path

## Development Standards

### Code Comments

- All comments must be in English
- Keep comments concise - omit obvious comments
- Follow Google Python Style Guide for docstrings

### Type Annotations (Python 3.12+)

All Python code MUST use proper type annotations. Since we use Python 3.12+, prefer built-in generic types over `typing` module (e.g., `list[T]` instead of `List[T]`, `T | None` instead of `Optional[T]`).

### Backend Layer Separation

**Repositories (`backend/app/repositories/`):**

- Database operations only (CRUD)
- No business logic
- Return SQLAlchemy model instances

**Services (`backend/app/services/`):**

- Business logic
- Transaction management
- Orchestrate multiple repository calls
- **Return types:** SQLAlchemy models OR Pydantic schemas
- **DO NOT** return `dict[str, Any]` - use explicit schemas for type safety

**Database Injection:**

Database sessions MUST be injected via FastAPI dependency injection at the API endpoint level, then passed as parameters to service/repository methods. Each request gets its own db session from the connection pool.

**Schemas (`backend/app/schemas/`):**

- Data transfer objects
- Define API request/response contracts
- Pydantic models for validation and serialization
- **Naming:** `{Entity}{Action}Request` / `{Entity}Response` (e.g., `SessionCreateRequest`, `CallbackResponse`)
- Internal/nested models use descriptive names (e.g., `TaskConfig`, `AgentCurrentState`)

### API Endpoint Exception Handling

Global handlers in `app/core/errors/exception_handlers.py` process:

- `AppException` -> 400 with error code
- `HTTPException` -> preserve status code
- `Exception` -> 500 with stack trace logged

**Rules:**

- **DO NOT** catch `Exception` to re-raise as `HTTPException(500, ...)` (redundant)
- **DO** raise `AppException` for business errors, `HTTPException` for HTTP-specific errors
- **DO NOT** log errors - global handler uses `logger.exception()`

### Frontend Styling

Use Tailwind CSS v4 utility classes with CSS variables. All colors, shadows, and spacing should reference the design system variables in `app/globals.css`:

- Colors: `var(--background)`, `var(--foreground)`, `var(--primary)`, `var(--border)`, etc.
- Shadows: `var(--shadow-sm)`, `var(--shadow-md)`, `var(--shadow-lg)`, etc.
- Border radius: `var(--radius)`

**DO NOT** hardcode colors like `#ffffff` or write raw CSS without using these variables.

### Frontend Internationalization (i18n)

All user-facing text MUST use i18n translations, NOT hardcoded strings:

```tsx
import { useT } from "@/app/i18n/client";
const { t } = useT();

// ✅ Correct
<Button>{t("sidebar.newTask")}</Button>

// ❌ Wrong
<Button>New Task</Button>
```

Translation files: `app/i18n/locales/{lng}/translation.json` | Config: `app/i18n/settings.ts`

## Linting and Formatting

**Python:**

- Ruff for linting and formatting
- Pyrefly for type checking
- Configured in root `pyproject.toml` and `.pre-commit-config.yaml`

**TypeScript/React:**

- ESLint with Next.js config
- Prettier for formatting
- Configured in `.pre-commit-config.yaml`

## Important Notes

- The workspace mount path in `executor/app/core/engine.py` is hardcoded to `/Users/qychen/01-Develop/toto`

- APScheduler uses in-memory job storage (jobs lost on restart)
- Callback endpoints use token-based authentication
- Git operations support GitHub and GitLab platforms
- All services can run independently for local development
