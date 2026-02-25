#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${ALLOWED_WEB_IPS:-}" ]]; then
  # shellcheck disable=SC2206
  ALLOWED_IP_ARRAY=(${ALLOWED_WEB_IPS})
else
  ALLOWED_IP_ARRAY=()
fi

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  if ! command -v sudo >/dev/null 2>&1; then
    echo "[ERROR] This script requires root or sudo."
    exit 1
  fi
  SUDO="sudo"
fi

echo "[1/6] Installing required packages (ufw + fail2ban)"
if command -v ufw >/dev/null 2>&1 && command -v fail2ban-client >/dev/null 2>&1; then
  echo "ufw and fail2ban already installed, skipping install"
else
  # apt update can fail intermittently with mirror setup; continue if indexes are partially available.
  ${SUDO} apt-get update -y || true
  ${SUDO} env DEBIAN_FRONTEND=noninteractive apt-get install -y ufw fail2ban
fi

echo "[2/6] Configuring UFW defaults"
${SUDO} ufw --force disable
${SUDO} ufw --force reset
${SUDO} ufw default deny incoming
${SUDO} ufw default allow outgoing

echo "[3/6] Allowing SSH (22/tcp)"
${SUDO} ufw allow 22/tcp comment 'SSH'

echo "[4/6] Allowing HTTP/HTTPS only from approved IPs"
if [[ "${#ALLOWED_IP_ARRAY[@]}" -eq 0 ]]; then
  echo "[WARN] No ALLOWED_WEB_IPS provided. 80/443 rules were not added."
  echo "       Add them manually with:"
  echo "       sudo ufw allow from <ip/cidr> to any port 80 proto tcp"
  echo "       sudo ufw allow from <ip/cidr> to any port 443 proto tcp"
fi
for ip in "${ALLOWED_IP_ARRAY[@]}"; do
  ${SUDO} ufw allow from "${ip}" to any port 80 proto tcp comment "HTTP allow ${ip}"
  ${SUDO} ufw allow from "${ip}" to any port 443 proto tcp comment "HTTPS allow ${ip}"
done

echo "[5/6] Enabling UFW"
${SUDO} ufw --force enable

echo "[6/6] Configuring Fail2ban (sshd jail)"
${SUDO} install -d -m 0755 /etc/fail2ban/jail.d
${SUDO} tee /etc/fail2ban/jail.d/sshd-local.conf >/dev/null <<EOF
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
backend = systemd
EOF

${SUDO} systemctl enable fail2ban
${SUDO} systemctl restart fail2ban

echo
echo "UFW status:"
${SUDO} ufw status numbered
echo
echo "Fail2ban status:"
${SUDO} fail2ban-client status
${SUDO} fail2ban-client status sshd || true

echo
echo "[DONE] Security policy applied:"
echo "- Incoming denied by default"
echo "- SSH allowed on 22/tcp"
if [[ "${#ALLOWED_IP_ARRAY[@]}" -gt 0 ]]; then
  echo "- 80/443 allowed only for:"
  for ip in "${ALLOWED_IP_ARRAY[@]}"; do
    echo "  - ${ip}"
  done
else
  echo "- 80/443 IP allowlist not configured by script (manual setup expected)"
fi
