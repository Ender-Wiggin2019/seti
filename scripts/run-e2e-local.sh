#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_PATHS=("$@")
SERVER_URL="${SERVER_URL:-http://127.0.0.1:3100}"
CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:5177}"
WS_URL="${WS_URL:-http://127.0.0.1:3100}"
SERVER_PORT="${SERVER_URL##*:}"
SERVER_PORT="${SERVER_PORT%%/*}"
CLIENT_PORT="${CLIENT_URL##*:}"
CLIENT_PORT="${CLIENT_PORT%%/*}"
PLAYWRIGHT_PROJECT="${PLAYWRIGHT_PROJECT:-chromium}"
PLAYWRIGHT_RETRIES="${PLAYWRIGHT_RETRIES:-0}"
KEEP_SERVERS="${KEEP_SERVERS:-0}"
E2E_PGDATABASE="${PGDATABASE:-seti_e2e}"
E2E_DATABASE_URL="${E2E_DATABASE_URL:-}"

assert_e2e_database_env() {
  if [[ -n "${DATABASE_URL:-}" && -z "${E2E_DATABASE_URL:-}" ]]; then
    echo "[e2e:run] DATABASE_URL is set. Unset it or use E2E_DATABASE_URL for the isolated local E2E database." >&2
    exit 1
  fi
}

assert_e2e_database_env

eval "$(PGDATABASE="${E2E_PGDATABASE}" E2E_DATABASE_URL="${E2E_DATABASE_URL}" "${ROOT_DIR}/scripts/init-e2e-local.sh" | awk '
  /^\[e2e:init\] Node:/ { print "NODE_BIN=\"" $3 "\"" }
  /^\[e2e:init\] pnpm CLI:/ {
    sub(/^\[e2e:init\] pnpm CLI: /, "", $0)
    print "PNPM_CLI=\"" $0 "\""
  }
  /^\[e2e:init\] tsx loader:/ {
    sub(/^\[e2e:init\] tsx loader: /, "", $0)
    print "TSX_LOADER=\"" $0 "\""
  }
')"

if [[ -z "${NODE_BIN:-}" || -z "${PNPM_CLI:-}" || -z "${TSX_LOADER:-}" ]]; then
  echo "[e2e:run] failed to initialize E2E runtime" >&2
  exit 1
fi

NODE_DIR="$(dirname "${NODE_BIN}")"
CLIENT_ENV_FILE="${ROOT_DIR}/packages/client/.env"
CLIENT_ENV_EXAMPLE="${ROOT_DIR}/packages/client/.env.example"
SERVER_PID=""
CLIENT_PID=""

server_ready() {
  local status
  status="$(curl -s -o /dev/null -w "%{http_code}" "${SERVER_URL}/health" || true)"
  [[ "${status}" == "200" ]]
}

process_alive() {
  local pid="$1"
  [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1
}

cleanup() {
  if [[ "${KEEP_SERVERS}" == "1" ]]; then
    return
  fi

  for pid in "${SERVER_PID}" "${CLIENT_PID}"; do
    if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
      kill "${pid}" >/dev/null 2>&1 || true
      wait "${pid}" >/dev/null 2>&1 || true
    fi
  done
}
trap cleanup EXIT INT TERM

if [[ ! -f "${CLIENT_ENV_FILE}" && -f "${CLIENT_ENV_EXAMPLE}" ]]; then
  cp "${CLIENT_ENV_EXAMPLE}" "${CLIENT_ENV_FILE}"
fi

echo "[e2e:run] starting server on ${SERVER_URL}"
(
  cd "${ROOT_DIR}/packages/server"
  unset DATABASE_URL
  if [[ -n "${E2E_DATABASE_URL}" ]]; then
    export DATABASE_URL="${E2E_DATABASE_URL}"
  fi
  exec env PATH="${NODE_DIR}:$PATH" PGDATABASE="${E2E_PGDATABASE}" PORT="${SERVER_PORT}" SETI_ENABLE_DEBUG_API=true SETI_THROTTLE_LIMIT=10000 "${NODE_BIN}" --import "${TSX_LOADER}" src/main.ts
) &
SERVER_PID=$!

echo "[e2e:run] starting client on ${CLIENT_URL}"
(
  cd "${ROOT_DIR}/packages/client"
  exec env PATH="${NODE_DIR}:$PATH" VITE_API_URL="${SERVER_URL}" VITE_WS_URL="${WS_URL}" VITE_ENABLE_DEBUG_ROUTES=true ./node_modules/.bin/vite --host 127.0.0.1 --port "${CLIENT_PORT}" --strictPort
) &
CLIENT_PID=$!

for _ in $(seq 1 60); do
  if ! process_alive "${SERVER_PID}"; then
    echo "[e2e:run] server process exited before becoming ready at ${SERVER_URL}" >&2
    exit 1
  fi

  if ! process_alive "${CLIENT_PID}"; then
    echo "[e2e:run] client process exited before becoming ready at ${CLIENT_URL}" >&2
    exit 1
  fi

  if server_ready && curl -fs "${CLIENT_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! server_ready; then
  echo "[e2e:run] server did not become ready at ${SERVER_URL}" >&2
  exit 1
fi

if ! curl -fs "${CLIENT_URL}" >/dev/null 2>&1; then
  echo "[e2e:run] client did not become ready at ${CLIENT_URL}" >&2
  exit 1
fi

if [[ "${#SPEC_PATHS[@]}" -gt 0 ]]; then
  echo "[e2e:run] running ${SPEC_PATHS[*]}"
else
  echo "[e2e:run] running full e2e suite"
fi
cd "${ROOT_DIR}/packages/e2e"
PLAYWRIGHT_CMD=(
  ./node_modules/.bin/playwright
  test
)

if [[ "${#SPEC_PATHS[@]}" -gt 0 ]]; then
  PLAYWRIGHT_CMD+=("${SPEC_PATHS[@]}")
fi

PLAYWRIGHT_CMD+=(
  --project="${PLAYWRIGHT_PROJECT}"
  --retries="${PLAYWRIGHT_RETRIES}"
)

(
  unset DATABASE_URL
  if [[ -n "${E2E_DATABASE_URL}" ]]; then
    export DATABASE_URL="${E2E_DATABASE_URL}"
  fi
  env \
    PATH="${NODE_DIR}:$PATH" \
    CI=1 \
    SERVER_URL="${SERVER_URL}" \
    CLIENT_URL="${CLIENT_URL}" \
    WS_URL="${WS_URL}" \
    SKIP_E2E_DB_PREPARE=1 \
    "${PLAYWRIGHT_CMD[@]}"
)
