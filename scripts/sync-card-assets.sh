#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/packages/cards/assets/images"
TARGET_DIRS=(
  "${ROOT_DIR}/packages/web/public/seti-assets"
  "${ROOT_DIR}/packages/client/public/seti-assets"
)

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Card asset source does not exist: ${SOURCE_DIR}" >&2
  exit 1
fi

for TARGET_DIR in "${TARGET_DIRS[@]}"; do
  rm -rf "${TARGET_DIR}"
  mkdir -p "${TARGET_DIR}"
  cp -R "${SOURCE_DIR}/." "${TARGET_DIR}/"
  echo "Synced card assets to ${TARGET_DIR}"
done
