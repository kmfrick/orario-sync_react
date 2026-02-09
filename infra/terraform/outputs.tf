output "backend_public_ip" {
  description = "Public IP of the backend VM"
  value       = google_compute_address.backend_public_ip.address
}

output "backend_port" {
  description = "Backend service port"
  value       = var.backend_port
}

output "api_base_url" {
  description = "Public API base URL"
  value       = "https://${replace(google_compute_address.backend_public_ip.address, ".", "-")}.sslip.io/api"
}

output "sslip_hostname" {
  description = "DNS hostname generated from backend IP via sslip.io"
  value       = "${replace(google_compute_address.backend_public_ip.address, ".", "-")}.sslip.io"
}

output "ssh_user" {
  description = "SSH user configured on VM"
  value       = var.ssh_user
}

output "ssh_public_key_path" {
  description = "Public key path used by Terraform"
  value       = pathexpand(var.ssh_public_key_path)
}

output "ssh_command" {
  description = "Convenience SSH command"
  value       = "ssh ${var.ssh_user}@${google_compute_address.backend_public_ip.address}"
}
