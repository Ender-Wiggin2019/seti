#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_PATH="${1:-tests/game-flow-behavior.spec.ts}"
SERVER_URL="${SERVER_URL:-http://127.0.0.1:3000}"
CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:5173}"
WS_URL="${WS_URL:-http://127.0.0.1:3000}"
PLAYWRIGHT_PROJECT="${PLAYWRIGHT_PROJECT:-chromium}"
PLAYWRIGHT_RETRIES="${PLAYWRIGHT_RETRIES:-0}"
KEEP_SERVERS="${KEEP_SERVERS:-0}"

eval "$("${ROOT_DIR}/scripts/init-e2e-local.sh" | awk '
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

NODE_DIR="$(dirname "${NODE_BIN}")"
CLIENT_ENV_FILE="${ROOT_DIR}/packages/client/.env"
CLIENT_ENV_EXAMPLE="${ROOT_DIR}/packages/client/.env.example"
SERVER_PID=""
CLIENT_PID=""

server_ready() {
  local status
  status="$(curl -s -o /dev/null -w "%{http_code}" "${SERVER_URL}/auth/me" || true)"
  [[ "${status}" == "200" || "${status}" == "401" ]]
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
  exec env PATH="${NODE_DIR}:$PATH" "${NODE_BIN}" --import "${TSX_LOADER}" src/main.ts
) &
SERVER_PID=$!

echo "[e2e:run] starting client on ${CLIENT_URL}"
(
  cd "${ROOT_DIR}/packages/client"
  exec env PATH="${NODE_DIR}:$PATH" ./node_modules/.bin/vite --host 127.0.0.1 --port 5173
) &
CLIENT_PID=$!

for _ in $(seq 1 60); do
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

echo "[e2e:run] running ${SPEC_PATH}"
cd "${ROOT_DIR}/packages/e2e"
env \
  PATH="${NODE_DIR}:$PATH" \
  CI=1 \
  SERVER_URL="${SERVER_URL}" \
  CLIENT_URL="${CLIENT_URL}" \
  WS_URL="${WS_URL}" \
  ./node_modules/.bin/playwright test "${SPEC_PATH}" \
  --project="${PLAYWRIGHT_PROJECT}" \
  --retries="${PLAYWRIGHT_RETRIES}"
