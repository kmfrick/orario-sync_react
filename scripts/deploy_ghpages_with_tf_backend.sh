#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infra/terraform"

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform is required but not found in PATH" >&2
  exit 1
fi

if [[ -f "${ROOT_DIR}/.gcp_env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.gcp_env"
fi

BACKEND_API_URL="$(terraform -chdir="${TF_DIR}" output -raw api_base_url)"

if [[ "${BACKEND_API_URL}" == http://* ]] && [[ "${ALLOW_INSECURE_BACKEND:-0}" != "1" ]]; then
  echo "Refusing to deploy GH Pages with insecure backend URL: ${BACKEND_API_URL}" >&2
  echo "GH Pages runs over HTTPS, and browsers will block mixed-content API calls to http:// backends." >&2
  echo "Set up HTTPS on the backend (recommended) or override once with ALLOW_INSECURE_BACKEND=1." >&2
  exit 1
fi

echo "Deploying frontend to GitHub Pages with backend: ${BACKEND_API_URL}"
(
  cd "${ROOT_DIR}"
  REACT_APP_BACKEND_URL="${BACKEND_API_URL}" yarn deploy
)
