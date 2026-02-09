#!/usr/bin/env bash
set -euo pipefail

log() { printf "\n[%s] %s\n" "$(date +%H:%M:%S)" "$*"; }
fail() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

wait_for_service_account() {
  local sa_email="$1"
  local project_id="$2"
  local tries=30
  local i
  for i in $(seq 1 "${tries}"); do
    if gcloud iam service-accounts describe "${sa_email}" --project "${project_id}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

retry_cmd() {
  local tries="$1"
  local sleep_seconds="$2"
  shift 2
  local i
  for i in $(seq 1 "${tries}"); do
    if "$@"; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done
  return 1
}

project_has_iam_binding() {
  local project_id="$1"
  local role="$2"
  local member="$3"
  local value
  value="$(gcloud projects get-iam-policy "${project_id}" \
    --flatten="bindings[].members" \
    --filter="bindings.role=\"${role}\" AND bindings.members=\"${member}\"" \
    --format='value(bindings.members)' 2>/dev/null || true)"
  [[ "${value}" == "${member}" ]]
}

service_account_has_iam_binding() {
  local sa_email="$1"
  local role="$2"
  local member="$3"
  local value
  value="$(gcloud iam service-accounts get-iam-policy "${sa_email}" \
    --flatten="bindings[].members" \
    --filter="bindings.role=\"${role}\" AND bindings.members=\"${member}\"" \
    --format='value(bindings.members)' 2>/dev/null || true)"
  [[ "${value}" == "${member}" ]]
}

ensure_billing_linked() {
  local project_id="$1"
  local billing_account="$2"
  local current
  current="$(gcloud billing projects describe "${project_id}" --format='value(billingAccountName)' 2>/dev/null || true)"
  if [[ "${current}" == "billingAccounts/${billing_account}" ]]; then
    log "Billing already linked: ${billing_account}"
    return 0
  fi
  log "Linking billing account: ${billing_account}"
  gcloud billing projects link "${project_id}" --billing-account="${billing_account}" >/dev/null
}

ensure_project_iam_binding() {
  local project_id="$1"
  local role="$2"
  local member="$3"
  if project_has_iam_binding "${project_id}" "${role}" "${member}"; then
    return 0
  fi
  retry_cmd 10 3 gcloud projects add-iam-policy-binding "${project_id}" \
    --member="${member}" \
    --role="${role}" >/dev/null 2>&1 || return 1
}

ensure_service_account_iam_binding() {
  local sa_email="$1"
  local role="$2"
  local member="$3"
  local project_id="$4"
  if service_account_has_iam_binding "${sa_email}" "${role}" "${member}"; then
    return 0
  fi
  retry_cmd 10 3 gcloud iam service-accounts add-iam-policy-binding "${sa_email}" \
    --member="${member}" \
    --role="${role}" \
    --project "${project_id}" >/dev/null 2>&1 || return 1
}

resolve_existing_project_id() {
  local candidate=""

  if [[ -n "${PROJECT_ID:-}" ]]; then
    if gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
      echo "${PROJECT_ID}"
      return 0
    fi
    fail "PROJECT_ID is set but project does not exist or is not accessible: ${PROJECT_ID}"
  fi

  if [[ -f ".gcp_env" ]]; then
    candidate="$(awk -F= '/^export GOOGLE_CLOUD_PROJECT=/{gsub(/"/,"",$2); print $2; exit}' .gcp_env)"
    if [[ -n "${candidate}" ]] && gcloud projects describe "${candidate}" >/dev/null 2>&1; then
      echo "${candidate}"
      return 0
    fi
  fi

  candidate="$(gcloud config get-value project 2>/dev/null || true)"
  if [[ -n "${candidate}" && "${candidate}" != "(unset)" ]] && gcloud projects describe "${candidate}" >/dev/null 2>&1; then
    echo "${candidate}"
    return 0
  fi

  return 1
}

pick_existing_ssh_key() {
  local candidate
  for candidate in \
    "${HOME}/.ssh/id_ed25519" \
    "${HOME}/.ssh/id_rsa" \
    "${HOME}/.ssh/id_ecdsa"
  do
    if [[ -f "${candidate}" && -f "${candidate}.pub" ]]; then
      echo "${candidate}"
      return 0
    fi
  done
  return 1
}

install_brew_formula_if_missing() {
  local pkg="$1"
  if ! brew list --formula "$pkg" >/dev/null 2>&1; then
    log "Installing Homebrew formula: $pkg"
    brew install "$pkg"
  fi
}

install_brew_cask_if_missing() {
  local pkg="$1"
  if ! brew list --cask "$pkg" >/dev/null 2>&1; then
    log "Installing Homebrew cask: $pkg"
    brew install --cask "$pkg"
  fi
}

[[ "$(uname -s)" == "Darwin" ]] || fail "This script currently targets macOS + Homebrew."
command -v brew >/dev/null 2>&1 || fail "Homebrew is required. Install Homebrew first."

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

# Bootstrap calls must run as the user principal, not with stale SA impersonation.
unset GOOGLE_IMPERSONATE_SERVICE_ACCOUNT || true
gcloud config unset auth/impersonate_service_account >/dev/null 2>&1 || true

install_brew_cask_if_missing gcloud-cli
install_brew_formula_if_missing terraform
install_brew_formula_if_missing ansible
install_brew_formula_if_missing jq

require_cmd gcloud
require_cmd terraform
require_cmd ansible-playbook
require_cmd curl
require_cmd npm
require_cmd python3

log "Authenticating with gcloud (browser login may open)"
if [[ -z "$(gcloud auth list --filter=status:ACTIVE --limit=1 --format='value(account)')" ]]; then
  gcloud auth login
fi

if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  gcloud auth application-default login
fi

ACTIVE_USER="$(gcloud auth list --filter=status:ACTIVE --limit=1 --format='value(account)')"
[[ -n "$ACTIVE_USER" ]] || fail "No active gcloud account found."

# Keep <=30 chars with "-<4char>" suffix appended later.
BASE_ID="orario-sync-$(date +%Y%m%d)"
PROJECT_ID=""
if PROJECT_ID="$(resolve_existing_project_id)"; then
  log "Using existing project: ${PROJECT_ID}"
else
  for _ in {1..20}; do
    SUFFIX="$(python3 - <<'PY'
import secrets
import string
alphabet = string.ascii_lowercase + string.digits
print(''.join(secrets.choice(alphabet) for _ in range(4)))
PY
)"
    CANDIDATE="${BASE_ID}-${SUFFIX}"
    if ! gcloud projects describe "$CANDIDATE" >/dev/null 2>&1; then
      PROJECT_ID="$CANDIDATE"
      break
    fi
  done
  [[ -n "$PROJECT_ID" ]] || fail "Could not generate a unique project ID."

  log "Creating project: $PROJECT_ID"
  gcloud projects create "$PROJECT_ID" --name="Orario Sync"
fi

log "Setting active project"
gcloud config set project "$PROJECT_ID"

BILLING_ACCOUNT_NAME="$(gcloud billing accounts list --filter='open=true' --limit=1 --format='value(name)')"
[[ -n "$BILLING_ACCOUNT_NAME" ]] || fail "No OPEN billing account available to this user."
BILLING_ACCOUNT="${BILLING_ACCOUNT_NAME##*/}"

ensure_billing_linked "$PROJECT_ID" "$BILLING_ACCOUNT"

log "Enabling required APIs"
gcloud services enable \
  compute.googleapis.com \
  serviceusage.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project "$PROJECT_ID"

TF_SA_NAME="tf-deployer"
TF_SA_EMAIL="${TF_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$TF_SA_EMAIL" --project "$PROJECT_ID" >/dev/null 2>&1; then
  log "Creating service account: $TF_SA_EMAIL"
  gcloud iam service-accounts create "$TF_SA_NAME" \
    --display-name="Terraform deployer" \
    --project "$PROJECT_ID"
fi

wait_for_service_account "$TF_SA_EMAIL" "$PROJECT_ID" || fail "Service account not visible after creation: ${TF_SA_EMAIL}"

log "Granting project roles to Terraform service account"
for ROLE in \
  roles/compute.instanceAdmin.v1 \
  roles/compute.networkAdmin \
  roles/compute.securityAdmin \
  roles/serviceusage.serviceUsageAdmin
do
  ensure_project_iam_binding "$PROJECT_ID" "$ROLE" "serviceAccount:${TF_SA_EMAIL}" \
    || fail "Failed to ensure IAM binding ${ROLE} for serviceAccount:${TF_SA_EMAIL}"
done

log "Allowing user impersonation of Terraform service account"
ensure_service_account_iam_binding "$TF_SA_EMAIL" "roles/iam.serviceAccountTokenCreator" "user:${ACTIVE_USER}" "$PROJECT_ID" \
  || fail "Failed to ensure impersonation binding for user:${ACTIVE_USER} on ${TF_SA_EMAIL}"

SSH_KEY_PRIV="$(pick_existing_ssh_key || true)"
[[ -n "${SSH_KEY_PRIV}" ]] || fail "No existing SSH keypair found in ~/.ssh (checked id_ed25519, id_rsa, id_ecdsa)."
SSH_KEY_PUB="${SSH_KEY_PRIV}.pub"
log "Using existing SSH key: ${SSH_KEY_PRIV}"

MY_IP="$(curl -fsS https://api.ipify.org || true)"
if [[ -n "$MY_IP" ]]; then
  SSH_CIDR="${MY_IP}/32"
else
  SSH_CIDR="0.0.0.0/0"
fi

if [[ -d "infra/terraform" ]]; then
  log "Writing infra/terraform/terraform.tfvars with free-tier-safe defaults"
  cat > infra/terraform/terraform.tfvars <<EOF
project_id          = "${PROJECT_ID}"
credentials_file    = ""
region              = "us-east1"
zone                = "us-east1-b"
instance_name       = "orario-sync-backend"
machine_type        = "e2-micro"
boot_disk_size_gb   = 10
ssh_user            = "debian"
ssh_public_key_path = "${SSH_KEY_PUB}"
backend_port        = 8080
ssh_source_ranges   = ["${SSH_CIDR}"]
backend_web_source_ranges = ["0.0.0.0/0"]
EOF
else
  log "Skipping tfvars write (infra/terraform not found)."
fi

cat > .gcp_env <<EOF
export GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="${TF_SA_EMAIL}"
export GOOGLE_CLOUD_PROJECT="${PROJECT_ID}"
export BACKEND_TLS_EMAIL="${ACTIVE_USER}"
EOF

log "Project + credentials bootstrap complete."
echo "PROJECT_ID=$PROJECT_ID"
echo "TF_SA_EMAIL=$TF_SA_EMAIL"
echo "Env file written: .gcp_env"

if [[ -x "infra/deploy_backend.sh" ]]; then
  log "Deploying backend VM + configuring service via Terraform + Ansible"
  GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="$TF_SA_EMAIL" \
    SSH_PRIVATE_KEY_PATH="${SSH_KEY_PRIV}" \
    npm run backend:deploy:gcp -- -auto-approve

  API_URL="$(GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="$TF_SA_EMAIL" terraform -chdir=infra/terraform output -raw api_base_url 2>/dev/null || true)"
  if [[ -n "$API_URL" ]]; then
    echo "Backend API: $API_URL"
  fi
fi

if [[ -x "scripts/deploy_ghpages_with_tf_backend.sh" ]]; then
  log "Deploying frontend to GitHub Pages with Terraform backend URL"
  GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="$TF_SA_EMAIL" \
    npm run frontend:deploy:ghpages:tf-backend
fi

log "Done."
