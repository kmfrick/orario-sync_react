#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
INSTALL_DEPS="${INSTALL_DEPS:-1}"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "${API_PID}" >/dev/null 2>&1; then
    kill "${API_PID}" >/dev/null 2>&1 || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "${ROOT_DIR}"

if [[ ! -d .venv ]]; then
  echo "Creating .venv..."
  python3 -m venv .venv
fi

if [[ "${INSTALL_DEPS}" == "1" ]]; then
  echo "Installing backend dependencies in .venv..."
  .venv/bin/python -m pip install -r orario-sync_unibo/requirements.txt
fi

echo "Starting local API on ${API_HOST}:${API_PORT}..."
PYTHONPATH="${ROOT_DIR}/orario-sync_unibo" \
  .venv/bin/python scripts/local_api_server.py --host "${API_HOST}" --port "${API_PORT}" &
API_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS "http://${API_HOST}:${API_PORT}/api/getschools.py" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Starting React frontend on port ${FRONTEND_PORT} (backend: http://${API_HOST}:${API_PORT}/api)..."
REACT_APP_BACKEND_URL="http://${API_HOST}:${API_PORT}/api" \
PORT="${FRONTEND_PORT}" \
BROWSER=none \
  yarn start
