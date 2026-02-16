variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "credentials_file" {
  description = "Path to a GCP service account JSON key. Leave empty to use ADC."
  type        = string
  default     = ""
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-east1"

  validation {
    condition     = contains(["us-east1", "us-central1", "us-west1"], var.region)
    error_message = "For Compute Engine Always Free, region must be one of us-east1, us-central1, us-west1."
  }
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-east1-b"
}

variable "network" {
  description = "VPC network name"
  type        = string
  default     = "default"
}

variable "instance_name" {
  description = "Name of the backend VM"
  type        = string
  default     = "orario-sync-backend"
}

variable "machine_type" {
  description = "GCE machine type"
  type        = string
  default     = "e2-micro"

  validation {
    condition     = var.machine_type == "e2-micro"
    error_message = "Always Free Compute Engine applies to e2-micro only."
  }
}

variable "image" {
  description = "Boot disk image"
  type        = string
  default     = "debian-cloud/debian-12"
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB"
  type        = number
  default     = 10

  validation {
    condition     = var.boot_disk_size_gb >= 10 && var.boot_disk_size_gb <= 30
    error_message = "Boot disk must be between 10 and 30 GB. 10 GB is GCE minimum; 30 GB-month is the Always Free standard PD quota."
  }
}

variable "ssh_user" {
  description = "SSH username to provision on the VM"
  type        = string
  default     = "debian"
}

variable "ssh_public_key_path" {
  description = "Path to local SSH public key"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_source_ranges" {
  description = "CIDRs allowed to SSH to VM"
  type        = list(string)
  nullable    = false

  validation {
    condition     = length(var.ssh_source_ranges) > 0
    error_message = "ssh_source_ranges must contain at least one CIDR."
  }

  validation {
    condition     = !contains(var.ssh_source_ranges, "0.0.0.0/0")
    error_message = "ssh_source_ranges cannot include 0.0.0.0/0."
  }
}

variable "backend_port" {
  description = "Port exposed by backend service"
  type        = number
  default     = 8080
}

variable "backend_web_source_ranges" {
  description = "CIDRs allowed to access backend HTTPS/HTTP entrypoints (443/80)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
