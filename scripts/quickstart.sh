#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${ROOT_DIR}/.env}"

DATA_DIR="./oss_data"
DATA_DIR_SET=false
WORKSPACE_DIR="./tmp_workspace"
WORKSPACE_DIR_SET=false
RUSTFS_UID="10001"
RUSTFS_GID="10001"
CHOWN_RUSTFS=true
S3_BUCKET=""
S3_BUCKET_SET=false
S3_ACCESS_KEY=""
S3_ACCESS_KEY_SET=false
S3_SECRET_KEY=""
S3_SECRET_KEY_SET=false
S3_PUBLIC_ENDPOINT=""
S3_PUBLIC_ENDPOINT_SET=false
CORS_ORIGINS=""
CORS_ORIGINS_SET=false
DOCKER_GID=""
START_ALL=true
ONLY_RUSTFS=false
INIT_BUCKET=true
PULL_EXECUTOR=true
FORCE_ENV=false
INTERACTIVE=true
ANTHROPIC_KEY=""
OPENAI_KEY=""
ANTHROPIC_BASE_URL=""
OPENAI_BASE_URL=""
DEFAULT_MODEL=""
OPENAI_DEFAULT_MODEL=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
  cat <<'USAGE'
Usage: scripts/quickstart.sh [options]

Options:
  -i, --interactive         Interactive mode (default when run in a terminal)
  --non-interactive         Disable interactive prompts (recommended for CI)
  --no-start                Only prepare env and directories
  --force-env               Overwrite existing keys in env file
  --anthropic-key KEY       Anthropic API key (writes to env)
  --openai-key KEY          OpenAI API key (writes to env, optional)
  -h, --help                Show this help

Advanced options:
  --data-dir PATH           Host path for RustFS data (default: ./oss_data)
  --workspace-dir PATH      Host path for workspaces (default: ./tmp_workspace)
  --rustfs-uid UID          RustFS uid for data dir ownership (default: 10001)
  --rustfs-gid GID          RustFS gid for data dir ownership (default: 10001)
  --no-chown-rustfs         Skip chown for RustFS data dir
  --s3-bucket NAME          Bucket name (writes to env)
  --s3-access-key KEY       S3 access key (writes to env)
  --s3-secret-key KEY       S3 secret key (writes to env)
  --s3-public-endpoint URL  S3 public endpoint for artifact access (writes to env)
  --cors-origins CSV|JSON   Allowed origins (writes to env)
  --docker-gid GID          Docker socket group id (auto-detect if omitted)
  --env-file PATH           Target env file (default: ./.env)
  --only-rustfs             Start only rustfs (and rustfs-init)
  --no-init-bucket          Skip rustfs-init bucket creation
  --no-pull-executor        Skip pulling executor image

Examples:
  # Interactive setup (default)
  ./scripts/quickstart.sh

  # Interactive setup without starting services
  ./scripts/quickstart.sh --no-start

  # Quick setup with API keys via CLI
  ./scripts/quickstart.sh --non-interactive --anthropic-key sk-ant-xxx
USAGE
}

print_header() {
  local title="$1"
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $title${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}[ok]${NC} $*"
}

print_warn() {
  echo -e "${YELLOW}[warn]${NC} $*" >&2
}

print_error() {
  echo -e "${RED}[error]${NC} $*" >&2
}

print_info() {
  echo -e "${BLUE}[info]${NC} $*"
}

warn() {
  print_warn "$@"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    print_error "Missing command: $1"
    exit 1
  fi
}

resolve_path() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    echo "$path"
  else
    echo "${ROOT_DIR}/${path#./}"
  fi
}

to_json_array() {
  local raw="$1"
  if [[ "$raw" == "["* ]]; then
    echo "$raw"
    return
  fi
  local IFS=','
  read -r -a parts <<< "$raw"
  local json="["
  local first=true
  for item in "${parts[@]}"; do
    item="${item## }"
    item="${item%% }"
    if [[ -z "$item" ]]; then
      continue
    fi
    if [[ "$first" = true ]]; then
      first=false
    else
      json+=","
    fi
    json+="\"$item\""
  done
  json+="]"
  echo "$json"
}

detect_docker_gid() {
  local sock="/var/run/docker.sock"
  if [[ ! -S "$sock" ]]; then
    return 1
  fi
  if stat -c "%g" "$sock" >/dev/null 2>&1; then
    stat -c "%g" "$sock"
    return
  fi
  if stat -f "%g" "$sock" >/dev/null 2>&1; then
    stat -f "%g" "$sock"
    return
  fi
  return 1
}

ensure_gitignore() {
  local dir="$1"
  local path="${dir}/.gitignore"
  if [[ ! -f "$path" ]]; then
    printf "*\n" > "$path"
  fi
}

read_env_key() {
  local key="$1"
  if [[ -f "$ENV_FILE" ]]; then
    local line
    line="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" | tail -n 1 || true)"
    if [[ -n "$line" ]]; then
      local value="${line#*=}"
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      # Treat empty values as "not set"
      if [[ -z "$value" ]]; then
        return 1
      fi
      # Treat example placeholders as "not set".
      if [[ "$key" == "ANTHROPIC_AUTH_TOKEN" && "$value" == "sk-ant-xxxxx" ]]; then
        return 1
      fi
      if [[ "$key" == "OPENAI_API_KEY" && "$value" == "sk-xxxxx" ]]; then
        return 1
      fi
      echo "$value"
      return 0
    fi
  fi
  return 1
}

write_env_key() {
  local key="$1"
  local value="$2"
  if [[ -z "$key" ]]; then
    return
  fi
  
  # FIX: Logic improved to allow overwrite if value is different
  if [[ "$FORCE_ENV" = false ]]; then
    local existing_value
    existing_value="$(read_env_key "$key" || true)"
    # Only skip if the value is EXACTLY the same as what we are trying to write
    if [[ -n "$existing_value" ]] && [[ "$existing_value" == "$value" ]]; then
      return 0
    fi
  fi

  local tmp_file
  tmp_file="$(mktemp)"
  if [[ -f "$ENV_FILE" ]]; then
    awk -v key="$key" -v val="$value" '
      BEGIN { replaced = 0 }
      $0 ~ "^" key "=" {
        print key "=" val
        replaced = 1
        next
      }
      { print }
      END {
        if (replaced == 0) {
          print key "=" val
        }
      }
    ' "$ENV_FILE" > "$tmp_file"
  else
    echo "${key}=${value}" > "$tmp_file"
  fi
  mv "$tmp_file" "$ENV_FILE"
}

prompt_for_key() {
  local key_name="$1"
  local prompt_msg="$2"
  local is_optional="${3:-false}"
  local current_value="$4"
  local input_value=""

  # FIX: Removed the "Keep current? [Y/n]" logic.
  # Instead, use standard default value prompt style.
  
  local display_default=""
  if [[ -n "$current_value" ]]; then
     # Mask the key for display
     if [[ "${#current_value}" -gt 12 ]]; then
        display_default="${current_value:0:8}...${current_value: -4}"
     else
        display_default="$current_value"
     fi
  fi

  while true; do
    echo "$prompt_msg"
    if [[ -n "$display_default" ]]; then
        echo -n -e "Input (Press Enter to keep [${GREEN}${display_default}${NC}]): "
    else
        echo -n "Input: "
    fi
    
    read -r input_value
    echo ""

    # User hit enter
    if [[ -z "$input_value" ]]; then
      if [[ -n "$current_value" ]]; then
        echo "$current_value"
        return
      elif [[ "$is_optional" == "true" ]]; then
        print_info "Skipping ${key_name} (optional)"
        echo ""
        return
      else
        print_warn "${key_name} is required"
        continue
      fi
    else
      # User entered a value
      echo "$input_value"
      return
    fi
  done
}

prompt_for_text() {
  local prompt_msg="$1"
  local default_value="$2"
  local is_optional="${3:-true}"
  local input_value=""

  if [[ -n "$default_value" ]]; then
    echo -n "$prompt_msg [$default_value]: "
  else
    echo -n "$prompt_msg: "
  fi
  read -r input_value

  if [[ -z "$input_value" ]]; then
    if [[ "$is_optional" == "true" ]]; then
      echo "$default_value"
    else
      echo ""
    fi
  else
    echo "$input_value"
  fi
}

prompt_for_s3_public_endpoint() {
  local current_value="$1"
  local input_value=""

  print_header "S3 Public Endpoint Configuration"
  cat <<'EOF'

The S3 Public Endpoint is used to access generated artifacts (images, HTML files, etc.)
directly from your browser. This is the URL that your frontend will use to download
artifacts stored in S3/R2.

EOF
  echo -e "${YELLOW}When do you need this?${NC}"
  cat <<'EOF'
  • Remote deployments (VPS, cloud servers) - Users access from different networks
  • Cloudflare R2 or other cloud S3-compatible storage - Has a public domain
  • Sharing artifacts with others - Need accessible URLs

EOF
  echo -e "${YELLOW}When can you skip this?${NC}"
  cat <<'EOF'
  • Local development only - You access everything from localhost
  • Using built-in MinIO (default) - Local S3 at localhost:9000

EOF

  # Standardize prompt style
  local display_msg="Enter S3 public endpoint (or press Enter to skip)"
  if [[ -n "$current_value" ]]; then
      echo -n "$display_msg [${current_value}]: "
  else
      echo -n "$display_msg: "
  fi
  
  read -r input_value
  echo ""

  if [[ -z "$input_value" ]]; then
    if [[ -n "$current_value" ]]; then
        echo "$current_value"
        return
    fi
    print_info "Skipping S3 public endpoint (local development mode)"
    echo ""
    return
  fi

  echo "$input_value"
}

interactive_setup() {
  print_header "Poco Interactive Setup"

  cat <<'EOF'

Welcome to Poco! This wizard will help you configure the essential settings.

EOF

  # Check for existing values in env
  local existing_anthropic
  local existing_anthropic_base_url
  local existing_default_model
  local existing_openai
  local existing_openai_base_url
  local existing_openai_model
  local existing_s3_endpoint

  existing_anthropic="$(read_env_key "ANTHROPIC_AUTH_TOKEN" || true)"
  existing_anthropic_base_url="$(read_env_key "ANTHROPIC_BASE_URL" || true)"
  existing_default_model="$(read_env_key "DEFAULT_MODEL" || true)"
  existing_openai="$(read_env_key "OPENAI_API_KEY" || true)"
  existing_openai_base_url="$(read_env_key "OPENAI_BASE_URL" || true)"
  existing_openai_model="$(read_env_key "OPENAI_DEFAULT_MODEL" || true)"
  existing_s3_endpoint="$(read_env_key "S3_PUBLIC_ENDPOINT" || true)"

  # FIX: Allow CLI args to override .env defaults during interactive setup
  if [[ -n "$ANTHROPIC_KEY" ]]; then existing_anthropic="$ANTHROPIC_KEY"; fi
  if [[ -n "$OPENAI_KEY" ]]; then existing_openai="$OPENAI_KEY"; fi

  # Prompt for Anthropic key (required)
  print_header "Required Configuration"
  ANTHROPIC_KEY="$(prompt_for_key "Anthropic API Key" \
    "Enter your Anthropic API key (get one at https://console.anthropic.com/)" \
    "false" \
    "$existing_anthropic")"

  # Prompt for Anthropic Base URL (optional)
  cat <<'EOF'

If you use a proxy or custom API endpoint for Anthropic, enter the base URL below.
Otherwise, press Enter to use the default (https://api.anthropic.com).

EOF
  ANTHROPIC_BASE_URL="$(prompt_for_text "Anthropic Base URL" "${existing_anthropic_base_url:-https://api.anthropic.com}" "true")"

  # Prompt for Default Model (optional)
  cat <<'EOF'

Enter the default Claude model to use. Press Enter to use the default.
Common options: claude-sonnet-4-20250514, claude-opus-4-20250514

EOF
  DEFAULT_MODEL="$(prompt_for_text "Default Model" "${existing_default_model:-claude-sonnet-4-20250514}" "true")"

  # Prompt for OpenAI key (optional)
  print_header "Optional Configuration"
  cat <<'EOF'

OpenAI API Key is optional but recommended if you want to:
  • Use GPT models alongside Claude
  • Access OpenAI's tools and capabilities
  • Compare results between different AI providers

EOF
  OPENAI_KEY="$(prompt_for_key "OpenAI API Key" \
    "Enter your OpenAI API key (or press Enter to skip)" \
    "true" \
    "$existing_openai")"

  if [[ -n "$OPENAI_KEY" ]]; then
    # Prompt for OpenAI Base URL (only if key is set)
    cat <<'EOF'

If you use a proxy or custom API endpoint for OpenAI, enter the base URL below.
Otherwise, press Enter to use the default (https://api.openai.com/v1).

EOF
    OPENAI_BASE_URL="$(prompt_for_text "OpenAI Base URL" "${existing_openai_base_url}" "true")"

    # Prompt for OpenAI Default Model
    cat <<'EOF'

Enter the default GPT model to use. Press Enter to use the default.
Common options: gpt-4o, gpt-4o-mini, gpt-4-turbo

EOF
    OPENAI_DEFAULT_MODEL="$(prompt_for_text "OpenAI Default Model" "${existing_openai_model:-gpt-4o-mini}" "true")"
  fi

  # Prompt for S3 public endpoint
  S3_PUBLIC_ENDPOINT="$(prompt_for_s3_public_endpoint "$existing_s3_endpoint")"

  # Write all collected keys
  # NOTE: write_env_key now handles check-before-write logic correctly
  if [[ -n "$ANTHROPIC_KEY" ]]; then
    write_env_key "ANTHROPIC_AUTH_TOKEN" "$ANTHROPIC_KEY"
    print_success "Anthropic API key configured"
  fi

  if [[ -n "$ANTHROPIC_BASE_URL" ]]; then
    write_env_key "ANTHROPIC_BASE_URL" "$ANTHROPIC_BASE_URL"
    print_success "Anthropic base URL configured"
  fi

  if [[ -n "$DEFAULT_MODEL" ]]; then
    write_env_key "DEFAULT_MODEL" "$DEFAULT_MODEL"
    print_success "Default model configured"
  fi

  if [[ -n "$OPENAI_KEY" ]]; then
    write_env_key "OPENAI_API_KEY" "$OPENAI_KEY"
    print_success "OpenAI API key configured"
  fi

  if [[ -n "$OPENAI_BASE_URL" ]]; then
    write_env_key "OPENAI_BASE_URL" "$OPENAI_BASE_URL"
    print_success "OpenAI base URL configured"
  fi

  if [[ -n "$OPENAI_DEFAULT_MODEL" ]]; then
    write_env_key "OPENAI_DEFAULT_MODEL" "$OPENAI_DEFAULT_MODEL"
    print_success "OpenAI default model configured"
  fi

  if [[ -n "$S3_PUBLIC_ENDPOINT" ]]; then
    write_env_key "S3_PUBLIC_ENDPOINT" "$S3_PUBLIC_ENDPOINT"
    print_success "S3 public endpoint configured"
  fi

  echo ""
}

# --- MAIN EXECUTION START ---

# First pass: parse CLI args to override defaults
while [[ $# -gt 0 ]]; do
  case "$1" in
    --data-dir)
      DATA_DIR="$2"; DATA_DIR_SET=true; shift 2 ;;
    --workspace-dir)
      WORKSPACE_DIR="$2"; WORKSPACE_DIR_SET=true; shift 2 ;;
    --rustfs-uid)
      RUSTFS_UID="$2"; shift 2 ;;
    --rustfs-gid)
      RUSTFS_GID="$2"; shift 2 ;;
    --no-chown-rustfs)
      CHOWN_RUSTFS=false; shift ;;
    --s3-bucket)
      S3_BUCKET="$2"; S3_BUCKET_SET=true; shift 2 ;;
    --s3-access-key)
      S3_ACCESS_KEY="$2"; S3_ACCESS_KEY_SET=true; shift 2 ;;
    --s3-secret-key)
      S3_SECRET_KEY="$2"; S3_SECRET_KEY_SET=true; shift 2 ;;
    --s3-public-endpoint)
      S3_PUBLIC_ENDPOINT="$2"; S3_PUBLIC_ENDPOINT_SET=true; shift 2 ;;
    --cors-origins)
      CORS_ORIGINS="$2"; CORS_ORIGINS_SET=true; shift 2 ;;
    --docker-gid)
      DOCKER_GID="$2"; shift 2 ;;
    --env-file)
      ENV_FILE="$2"; shift 2 ;;
    --no-start)
      START_ALL=false; shift ;;
    --only-rustfs)
      ONLY_RUSTFS=true; shift ;;
    --no-init-bucket)
      INIT_BUCKET=false; shift ;;
    --no-pull-executor)
      PULL_EXECUTOR=false; shift ;;
    --force-env)
      FORCE_ENV=true; shift ;;
    -i|--interactive)
      INTERACTIVE=true; shift ;;
    --non-interactive|--no-interactive)
      INTERACTIVE=false; shift ;;
    --anthropic-key)
      ANTHROPIC_KEY="$2"; shift 2 ;;
    --openai-key)
      OPENAI_KEY="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      print_error "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

print_header "Poco Quickstart"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "${ROOT_DIR}/.env.example" ]]; then
    cp "${ROOT_DIR}/.env.example" "$ENV_FILE"
    print_success "Created .env from .env.example"
  else
    touch "$ENV_FILE"
  fi
fi

# Run interactive setup if requested
if [[ "$INTERACTIVE" = true ]]; then
  interactive_setup
fi

# Handle API keys from CLI arguments (In non-interactive mode, or ensuring persistent write)
if [[ -n "$ANTHROPIC_KEY" ]]; then
  write_env_key "ANTHROPIC_AUTH_TOKEN" "$ANTHROPIC_KEY"
  print_success "Anthropic API key configured"
fi

if [[ -n "$OPENAI_KEY" ]]; then
  write_env_key "OPENAI_API_KEY" "$OPENAI_KEY"
  print_success "OpenAI API key configured"
fi

DATA_DIR_ABS="$(resolve_path "$DATA_DIR")"
WORKSPACE_DIR_ABS="$(resolve_path "$WORKSPACE_DIR")"
if [[ -n "$CORS_ORIGINS" ]]; then
  CORS_ORIGINS_JSON="$(to_json_array "$CORS_ORIGINS")"
else
  CORS_ORIGINS_JSON=""
fi

if [[ -z "$DOCKER_GID" ]]; then
  DOCKER_GID="$(detect_docker_gid || true)"
fi

if [[ "$DATA_DIR_SET" = true ]]; then
  write_env_key "RUSTFS_DATA_DIR" "$DATA_DIR"
fi
if [[ "$S3_ACCESS_KEY_SET" = true ]]; then
  write_env_key "S3_ACCESS_KEY" "$S3_ACCESS_KEY"
fi
if [[ "$S3_SECRET_KEY_SET" = true ]]; then
  write_env_key "S3_SECRET_KEY" "$S3_SECRET_KEY"
fi
if [[ "$S3_BUCKET_SET" = true ]]; then
  write_env_key "S3_BUCKET" "$S3_BUCKET"
fi
if [[ "$S3_PUBLIC_ENDPOINT_SET" = true ]]; then
  write_env_key "S3_PUBLIC_ENDPOINT" "$S3_PUBLIC_ENDPOINT"
  print_success "S3 public endpoint configured"
fi
if [[ "$CORS_ORIGINS_SET" = true ]]; then
  write_env_key "CORS_ORIGINS" "$CORS_ORIGINS_JSON"
fi
if [[ -n "$DOCKER_GID" ]]; then
  write_env_key "DOCKER_GID" "$DOCKER_GID"
else
  warn "DOCKER_GID not detected; executor-manager may fail to access docker.sock"
fi

mkdir -p "$DATA_DIR_ABS"
mkdir -p "$WORKSPACE_DIR_ABS/active" "$WORKSPACE_DIR_ABS/archive" "$WORKSPACE_DIR_ABS/temp"

ensure_gitignore "$DATA_DIR_ABS"
ensure_gitignore "$WORKSPACE_DIR_ABS"

if [[ "$CHOWN_RUSTFS" = true ]]; then
  if ! chown -R "${RUSTFS_UID}:${RUSTFS_GID}" "$DATA_DIR_ABS" 2>/dev/null; then
    warn "Failed to chown RustFS data dir. You may need to run: sudo chown -R ${RUSTFS_UID}:${RUSTFS_GID} \"$DATA_DIR_ABS\""
  fi
fi

chmod -R u+rwX "$DATA_DIR_ABS" 2>/dev/null || \
  warn "Failed to chmod RustFS data dir. You may need to run: sudo chown -R ${RUSTFS_UID}:${RUSTFS_GID} \"$DATA_DIR_ABS\""

chmod -R u+rwX "$WORKSPACE_DIR_ABS" 2>/dev/null || \
  warn "Failed to chmod workspace directories. You may need to run: sudo chown -R \"$(id -u)\":\"$(id -g)\" \"$WORKSPACE_DIR_ABS\""

if [[ "$START_ALL" = true ]] && ! read_env_key "ANTHROPIC_AUTH_TOKEN" >/dev/null 2>&1; then
  print_error "ANTHROPIC_AUTH_TOKEN is not set. Run ./scripts/quickstart.sh (interactive) or pass --anthropic-key."
  exit 1
fi

if [[ "$START_ALL" = true ]]; then
  require_cmd docker
  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  else
    print_error "docker compose not found"
    exit 1
  fi

  if [[ "$PULL_EXECUTOR" = true ]]; then
    # Pull both lite and full executor images
    executor_lite_image="${EXECUTOR_IMAGE:-}"
    if [[ -z "$executor_lite_image" ]]; then
      executor_lite_image="$(read_env_key "EXECUTOR_IMAGE" || true)"
    fi
    if [[ -z "$executor_lite_image" ]]; then
      executor_lite_image="ghcr.io/poco-ai/poco-executor:lite"
    fi

    executor_full_image="${EXECUTOR_BROWSER_IMAGE:-}"
    if [[ -z "$executor_full_image" ]]; then
      executor_full_image="$(read_env_key "EXECUTOR_BROWSER_IMAGE" || true)"
    fi
    if [[ -z "$executor_full_image" ]]; then
      executor_full_image="ghcr.io/poco-ai/poco-executor:full"
    fi

    print_info "Pulling executor images..."
    print_info "  - $executor_lite_image"
    docker pull "$executor_lite_image"
    print_info "  - $executor_full_image"
    docker pull "$executor_full_image"
  fi

  if [[ "$ONLY_RUSTFS" = true ]]; then
    "${COMPOSE[@]}" up -d rustfs
  else
    "${COMPOSE[@]}" up -d
  fi

  if [[ "$INIT_BUCKET" = true ]]; then
    "${COMPOSE[@]}" --profile init up -d rustfs-init || \
      warn "rustfs-init failed; you can retry: docker compose --profile init up -d rustfs-init"
  fi
fi

# Final status check
print_header "Setup Complete"

# Check if Anthropic key is set
if ! read_env_key "ANTHROPIC_AUTH_TOKEN" >/dev/null 2>&1; then
  print_warn "ANTHROPIC_AUTH_TOKEN is not set!"
  cat <<'EOF'

  Please set your Anthropic API key in .env or run:
    ./scripts/quickstart.sh

  Get your key at: https://console.anthropic.com/
EOF
else
  print_success "Anthropic API key is configured"
fi

# Remind about optional keys
if ! read_env_key "OPENAI_API_KEY" >/dev/null 2>&1; then
  print_info "OpenAI API key not set (optional)"
  echo "  Add it later in .env if you want to use GPT models"
fi

echo ""
print_success "Bootstrap completed!"
echo ""
echo "Next steps:"
echo "  1. Make sure ANTHROPIC_AUTH_TOKEN is set in .env"
echo "  2. Start services: docker compose up -d"
echo "  3. Open browser: http://localhost:3000"
echo ""