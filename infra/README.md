## GCP Backend Deployment (Terraform + Ansible)

This stack deploys the backend API on an `e2-micro` VM in `us-east1`, configures it with Ansible, and exposes HTTPS through `sslip.io` + Caddy.
The bootstrap script uses free-tier-oriented defaults (`us-east1`, `e2-micro`, `pd-standard` 10 GB, SSH firewall restricted to your current public IP).
If your IP changes, re-run the bootstrap script (or update `ssh_source_ranges` in `infra/terraform/terraform.tfvars`).
`10 GB` is used because it is the minimum boot-disk size accepted by Compute Engine.

### Prerequisites

- Terraform >= 1.5
- Ansible (`ansible-playbook`)
- A GCP project with billing enabled
- A local SSH key pair (default: `~/.ssh/id_ed25519` + `.pub`)
- GCP auth configured (ADC via `gcloud auth application-default login`), or service-account JSON key

### Configure Terraform

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars
```

At minimum set:

- `project_id`
- `ssh_public_key_path`

Optional (recommended):

- `ssh_source_ranges = ["YOUR.IP/32"]`
- `backend_web_source_ranges = ["0.0.0.0/0"]` (required for public HTTPS access)

TLS notes:

- `BACKEND_TLS_EMAIL` must be set (or discoverable from active `gcloud` account) so Caddy can request certs from ZeroSSL when Let's Encrypt rate-limits `sslip.io`.

### Provision + Configure Backend

From repo root:

```bash
yarn backend:deploy:gcp
```

This command:

1. runs `terraform init/apply`
2. gets VM IP and SSH user from Terraform outputs
3. builds temporary Ansible inventory
4. deploys backend service and starts `orario-sync-backend` via systemd
5. configures Caddy for `https://<ip>.sslip.io/api`

Set custom private key if needed:

```bash
SSH_PRIVATE_KEY_PATH=~/.ssh/your_key yarn backend:deploy:gcp
```

### Deploy Frontend to GitHub Pages using Terraform backend URL

After backend deploy:

```bash
yarn frontend:deploy:ghpages:tf-backend
```

This reads `api_base_url` from Terraform outputs (for example `https://34-138-1-31.sslip.io/api`) and builds/deploys React with:

- `REACT_APP_BACKEND_URL=<terraform api_base_url>`

### Destroy

```bash
terraform -chdir=infra/terraform destroy -var-file=terraform.tfvars
```
