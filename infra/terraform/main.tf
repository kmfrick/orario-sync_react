provider "google" {
  project     = var.project_id
  region      = var.region
  zone        = var.zone
  credentials = var.credentials_file == "" ? null : file(pathexpand(var.credentials_file))
}

locals {
  ssh_public_key = trimspace(file(pathexpand(var.ssh_public_key_path)))
}

resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_compute_address" "backend_public_ip" {
  name   = "${var.instance_name}-ip"
  region = var.region

  depends_on = [google_project_service.compute]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.instance_name}-allow-ssh"
  network = var.network

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.ssh_source_ranges
  target_tags   = ["orario-sync-backend"]
  depends_on    = [google_project_service.compute]
}

resource "google_compute_firewall" "allow_web" {
  name    = "${var.instance_name}-allow-web"
  network = var.network

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = var.backend_web_source_ranges
  target_tags   = ["orario-sync-backend"]
  depends_on    = [google_project_service.compute]
}

resource "google_compute_instance" "backend" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["orario-sync-backend"]

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.boot_disk_size_gb
      type  = "pd-standard"
    }
  }

  network_interface {
    network = var.network
    access_config {
      nat_ip = google_compute_address.backend_public_ip.address
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${local.ssh_public_key}"
  }

  allow_stopping_for_update = true
  depends_on                = [google_project_service.compute, google_compute_address.backend_public_ip]
}
