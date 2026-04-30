#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRED_NODE_VERSION="20.19.0"

version_ge() {
  local current required
  current="${1#v}"
  required="${2#v}"
  [[ "$(printf '%s\n%s\n' "${required}" "${current}" | sort -V | head -n1)" == "${required}" ]]
}

find_compatible_node() {
  if [[ -n "${SETI_E2E_NODE_BIN:-}" ]]; then
    if [[ ! -x "${SETI_E2E_NODE_BIN}" ]]; then
      echo "SETI_E2E_NODE_BIN is not executable: ${SETI_E2E_NODE_BIN}" >&2
      exit 1
    fi
    echo "${SETI_E2E_NODE_BIN}"
    return
  fi

  if command -v node >/dev/null 2>&1; then
    local current_node
    current_node="$(command -v node)"
    if version_ge "$("${current_node}" -v)" "${REQUIRED_NODE_VERSION}"; then
      echo "${current_node}"
      return
    fi
  fi

  if [[ -d "${HOME}/.nvm/versions/node" ]]; then
    while IFS= read -r candidate; do
      if version_ge "$("${candidate}" -v 2>/dev/null || echo v0.0.0)" "${REQUIRED_NODE_VERSION}"; then
        echo "${candidate}"
        return
      fi
    done < <(find "${HOME}/.nvm/versions/node" -path '*/bin/node' -type f | sort -V -r)
  fi

  echo "No Node.js >= ${REQUIRED_NODE_VERSION} found. Set SETI_E2E_NODE_BIN explicitly." >&2
  exit 1
}

find_pnpm_cli() {
  if [[ -n "${SETI_E2E_PNPM_CLI:-}" ]]; then
    if [[ ! -f "${SETI_E2E_PNPM_CLI}" ]]; then
      echo "SETI_E2E_PNPM_CLI does not exist: ${SETI_E2E_PNPM_CLI}" >&2
      exit 1
    fi
    echo "${SETI_E2E_PNPM_CLI}"
    return
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is not installed." >&2
    exit 1
  fi

  local pnpm_bin pnpm_root pnpm_cli
  pnpm_bin="$(command -v pnpm)"
  pnpm_root="$(cd "$(dirname "${pnpm_bin}")/.." && pwd)"
  pnpm_cli="${pnpm_root}/lib/node_modules/pnpm/bin/pnpm.cjs"

  if [[ ! -f "${pnpm_cli}" ]]; then
    echo "Unable to locate pnpm.cjs from ${pnpm_bin}. Set SETI_E2E_PNPM_CLI explicitly." >&2
    exit 1
  fi

  echo "${pnpm_cli}"
}

find_tsx_loader() {
  if [[ -n "${SETI_E2E_TSX_LOADER:-}" ]]; then
    if [[ ! -f "${SETI_E2E_TSX_LOADER}" ]]; then
      echo "SETI_E2E_TSX_LOADER does not exist: ${SETI_E2E_TSX_LOADER}" >&2
      exit 1
    fi
    echo "${SETI_E2E_TSX_LOADER}"
    return
  fi

  local loader
  loader="$(find "${ROOT_DIR}/node_modules/.pnpm" -path '*/node_modules/tsx/dist/loader.mjs' -type f | sort | head -n1 || true)"
  if [[ -z "${loader}" ]]; then
    echo "Unable to find tsx loader under node_modules/.pnpm." >&2
    exit 1
  fi

  echo "${loader}"
}

run_pnpm() {
  env PATH="${NODE_DIR}:$PATH" "${NODE_BIN}" "${PNPM_CLI}" --dir "${ROOT_DIR}" "$@"
}

ensure_client_env() {
  local env_file example_file
  env_file="${ROOT_DIR}/packages/client/.env"
  example_file="${ROOT_DIR}/packages/client/.env.example"

  if [[ ! -f "${env_file}" && -f "${example_file}" ]]; then
    cp "${example_file}" "${env_file}"
    echo "[e2e:init] Created packages/client/.env from .env.example"
  fi
}

NODE_BIN="$(find_compatible_node)"
NODE_DIR="$(dirname "${NODE_BIN}")"
PNPM_CLI="$(find_pnpm_cli)"
TSX_LOADER="$(find_tsx_loader)"

ensure_client_env
env PATH="${NODE_DIR}:$PATH" "${NODE_BIN}" --import "${TSX_LOADER}" \
  "${ROOT_DIR}/packages/server/scripts/prepare-e2e-db.ts"

echo "[e2e:init] Node: ${NODE_BIN}"
echo "[e2e:init] pnpm CLI: ${PNPM_CLI}"
echo "[e2e:init] tsx loader: ${TSX_LOADER}"
echo "[e2e:init] Ready"
