#!/usr/bin/env bash
#
# Server-side deploy for HAB Barbershop POS (Hostinger shared hosting)
# Run via SSH from the project root after initial git clone.
# Usage: bash deploy.sh

set -euo pipefail

echo "==> Pulling latest code"
git pull --ff-only origin main

echo "==> Done."
