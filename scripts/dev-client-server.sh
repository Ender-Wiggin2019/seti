#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_ENV_FILE="${ROOT_DIR}/packages/client/.env"
CLIENT_ENV_EXAMPLE="${ROOT_DIR}/packages/client/.env.example"

SERVER_PID=""
CLIENT_PID=""

cleanup() {
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
  echo "[dev] 未检测到 packages/client/.env，已从 .env.example 自动创建。"
fi

echo "[dev] starting server (@seti/server)..."
pnpm --dir "${ROOT_DIR}" --filter @seti/server dev &
SERVER_PID=$!

echo "[dev] starting client (@seti/client)..."
pnpm --dir "${ROOT_DIR}" --filter @seti/client dev &
CLIENT_PID=$!

echo "[dev] client + server 已启动"
echo "[dev] server: http://localhost:3000 (可通过 PORT 覆盖)"
echo "[dev] client: http://localhost:5173"
echo "[dev] 按 Ctrl+C 同时关闭两个进程"

while true; do
  if ! kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    echo "[dev] server 进程已退出，正在关闭 client..."
    exit 1
  fi

  if ! kill -0 "${CLIENT_PID}" >/dev/null 2>&1; then
    echo "[dev] client 进程已退出，正在关闭 server..."
    exit 1
  fi

  sleep 1
done
