#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infra/terraform"
ANSIBLE_DIR="${ROOT_DIR}/infra/ansible"
ANSIBLE_VENV="${ROOT_DIR}/.infra-ansible-venv"

SSH_PRIVATE_KEY_PATH="${SSH_PRIVATE_KEY_PATH:-${HOME}/.ssh/id_ed25519}"
BACKEND_TLS_EMAIL="${BACKEND_TLS_EMAIL:-}"
ANSIBLE_EXTRA_ARGS="${ANSIBLE_EXTRA_ARGS:-}"

if [[ -f "${ROOT_DIR}/.gcp_env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.gcp_env"
fi

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform is required but not found in PATH" >&2
  exit 1
fi

ANSIBLE_PLAYBOOK_BIN=""
if command -v python3.12 >/dev/null 2>&1; then
  if [[ ! -x "${ANSIBLE_VENV}/bin/ansible-playbook" ]]; then
    echo "Creating local Ansible venv at ${ANSIBLE_VENV} (python3.12)..."
    python3.12 -m venv "${ANSIBLE_VENV}"
    "${ANSIBLE_VENV}/bin/pip" install --upgrade pip >/dev/null
    "${ANSIBLE_VENV}/bin/pip" install "ansible-core>=2.17,<2.19" >/dev/null
  fi
  ANSIBLE_PLAYBOOK_BIN="${ANSIBLE_VENV}/bin/ansible-playbook"
elif command -v ansible-playbook >/dev/null 2>&1; then
  ANSIBLE_PLAYBOOK_BIN="$(command -v ansible-playbook)"
else
  echo "ansible-playbook not found and python3.12 unavailable for local ansible venv bootstrap" >&2
  exit 1
fi

if [[ ! -f "${SSH_PRIVATE_KEY_PATH}" ]]; then
  echo "SSH private key not found: ${SSH_PRIVATE_KEY_PATH}" >&2
  exit 1
fi

if [[ -z "${BACKEND_TLS_EMAIL}" ]] && command -v gcloud >/dev/null 2>&1; then
  BACKEND_TLS_EMAIL="$(gcloud auth list --filter=status:ACTIVE --limit=1 --format='value(account)' 2>/dev/null || true)"
fi

if [[ -z "${BACKEND_TLS_EMAIL}" ]]; then
  echo "BACKEND_TLS_EMAIL is required for HTTPS certificate provisioning (set env var or login with gcloud)." >&2
  exit 1
fi

wait_for_ssh() {
  local user_host="$1"
  local tries=60
  local i
  for i in $(seq 1 "${tries}"); do
    if ssh \
      -i "${SSH_PRIVATE_KEY_PATH}" \
      -o BatchMode=yes \
      -o StrictHostKeyChecking=accept-new \
      -o ConnectTimeout=5 \
      "${user_host}" "exit" >/dev/null 2>&1; then
      return 0
    fi
    sleep 5
  done
  return 1
}

terraform -chdir="${TF_DIR}" init
terraform -chdir="${TF_DIR}" apply "$@"

BACKEND_IP="$(terraform -chdir="${TF_DIR}" output -raw backend_public_ip)"
BACKEND_PORT="$(terraform -chdir="${TF_DIR}" output -raw backend_port)"
BACKEND_HOSTNAME="$(terraform -chdir="${TF_DIR}" output -raw sslip_hostname)"
SSH_USER="$(terraform -chdir="${TF_DIR}" output -raw ssh_user)"
USER_HOST="${SSH_USER}@${BACKEND_IP}"

echo "Waiting for SSH on ${USER_HOST}..."
wait_for_ssh "${USER_HOST}" || {
  echo "SSH did not become ready for ${USER_HOST}" >&2
  exit 1
}

cat > "${ANSIBLE_DIR}/inventory.ini" <<INVENTORY
[backend]
backend_vm ansible_host=${BACKEND_IP} ansible_user=${SSH_USER} ansible_python_interpreter=/usr/bin/python3
INVENTORY

ANSIBLE_CONFIG="${ANSIBLE_DIR}/ansible.cfg" \
ANSIBLE_HOST_KEY_CHECKING=False \
ANSIBLE_FORKS=1 \
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES \
"${ANSIBLE_PLAYBOOK_BIN}" \
  -e "ansible_ssh_common_args='-o StrictHostKeyChecking=accept-new'" \
  -i "${ANSIBLE_DIR}/inventory.ini" \
  --private-key "${SSH_PRIVATE_KEY_PATH}" \
  "${ANSIBLE_DIR}/deploy.yml" \
  -e "repo_root=${ROOT_DIR}" \
  -e "backend_port=${BACKEND_PORT}" \
  -e "backend_hostname=${BACKEND_HOSTNAME}" \
  -e "backend_tls_email=${BACKEND_TLS_EMAIL}" \
  ${ANSIBLE_EXTRA_ARGS}

echo "Backend deployed at: https://${BACKEND_HOSTNAME}/api"
