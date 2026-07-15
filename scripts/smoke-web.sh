#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-3101}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="${ROOT_DIR}/.smoke-web.log"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "Starting @seti/web on ${BASE_URL}"
pnpm --dir "${ROOT_DIR}" --filter @seti/web dev -- -p "${PORT}" >"${LOG_FILE}" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 60); do
  if curl -fsS "${BASE_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}" >/dev/null 2>&1; then
  echo "Web server did not become ready. Check ${LOG_FILE}" >&2
  exit 1
fi

ROUTES=(
  "/"
  "/card/1"
  "/card/39"
  "/card/128"
  "/prelude"
)

echo "Running route smoke checks..."
for route in "${ROUTES[@]}"; do
  url="${BASE_URL}${route}"
  status="$(curl -sS -o /tmp/seti-smoke-route.html -w "%{http_code}" "${url}")"
  if [[ "${status}" != "200" ]]; then
    echo "FAIL ${route} -> ${status}" >&2
    exit 1
  fi
  if ! rg -q "<html" /tmp/seti-smoke-route.html; then
    echo "FAIL ${route} -> non-html response" >&2
    exit 1
  fi
  echo "OK   ${route}"
done

echo "Smoke checks passed."
