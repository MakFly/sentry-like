# Security Hardening: UFW + Fail2ban (Production)

This guide explains how to harden an ErrorWatch production server with:

- `ufw` for host firewall policy
- `fail2ban` for SSH brute-force protection
- `DOCKER-USER` iptables rules to enforce public web allowlist even when Docker publishes ports

This setup is intended for production with strict IP allowlisting.

---

## 1) Important architecture note

In this stack:

- Caddy runs in Docker and publishes `80/443`
- API + Dashboard run on host (PM2) on `3333/4001`

If you only configure UFW, Docker-published ports may still be reachable depending on iptables chain order.

You must enforce allowlist at two levels:

1. UFW host rules
2. `DOCKER-USER` chain rules

---

## 2) Define your allowlist

Pick trusted public egress IPs (for example VPN egress).

Example:

```bash
ALLOWED_WEB_IPS="212.47.237.112/32"
```

Check your current public IP from client:

```bash
curl -s https://api64.ipify.org
```

---

## 3) Base hardening with UFW + Fail2ban

Use the script (no IPs hardcoded in repository):

```bash
cd /opt/errorwatch
ALLOWED_WEB_IPS="212.47.237.112/32" bash deploy/hardening-ufw-fail2ban.sh
```

What it applies:

- `deny incoming` / `allow outgoing`
- allow SSH `22/tcp`
- allow internal Docker bridge (`172.16.0.0/12`) to host app ports `3333` and `4001`
- optional allowlist for `80/443` when `ALLOWED_WEB_IPS` is provided
- enable Fail2ban `sshd` jail

Verify:

```bash
sudo ufw status numbered
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## 4) Enforce web allowlist for Docker-published ports (critical)

Apply strict filtering in `DOCKER-USER`:

```bash
EXT_IF=enp5s0
ALLOW_IP=212.47.237.112/32

sudo iptables -F DOCKER-USER
sudo iptables -A DOCKER-USER -i "$EXT_IF" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
sudo iptables -A DOCKER-USER -i "$EXT_IF" -s "$ALLOW_IP" -p tcp -m multiport --dports 80,443 -j RETURN
sudo iptables -A DOCKER-USER -i "$EXT_IF" -s "$ALLOW_IP" -p udp --dport 443 -j RETURN
sudo iptables -A DOCKER-USER -i "$EXT_IF" -p tcp -m multiport --dports 80,443 -j DROP
sudo iptables -A DOCKER-USER -i "$EXT_IF" -p udp --dport 443 -j DROP
sudo iptables -A DOCKER-USER -j RETURN
```

Verify:

```bash
sudo iptables -S DOCKER-USER
```

---

## 5) Persist DOCKER-USER rules across reboot

Create runtime config:

```bash
sudo tee /etc/default/errorwatch-firewall >/dev/null <<'EOF'
EXT_IF=enp5s0
ALLOWED_WEB_IPS="212.47.237.112/32"
EOF
```

Create apply script:

```bash
sudo tee /usr/local/sbin/errorwatch-docker-user-firewall.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
source /etc/default/errorwatch-firewall
: "${EXT_IF:?EXT_IF is required}"
: "${ALLOWED_WEB_IPS:?ALLOWED_WEB_IPS is required}"

iptables -F DOCKER-USER
iptables -A DOCKER-USER -i "$EXT_IF" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
for ip in $ALLOWED_WEB_IPS; do
  iptables -A DOCKER-USER -i "$EXT_IF" -s "$ip" -p tcp -m multiport --dports 80,443 -j RETURN
  iptables -A DOCKER-USER -i "$EXT_IF" -s "$ip" -p udp --dport 443 -j RETURN
done
iptables -A DOCKER-USER -i "$EXT_IF" -p tcp -m multiport --dports 80,443 -j DROP
iptables -A DOCKER-USER -i "$EXT_IF" -p udp --dport 443 -j DROP
iptables -A DOCKER-USER -j RETURN
EOF

sudo chmod 700 /usr/local/sbin/errorwatch-docker-user-firewall.sh
```

Create systemd unit:

```bash
sudo tee /etc/systemd/system/errorwatch-docker-user-firewall.service >/dev/null <<'EOF'
[Unit]
Description=Apply Docker USER chain allowlist for web ports
After=docker.service
Wants=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/errorwatch-docker-user-firewall.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now errorwatch-docker-user-firewall.service
sudo systemctl status errorwatch-docker-user-firewall.service --no-pager
```

---

## 6) Validation matrix

From an allowed IP:

- `https://error-watch.tilvest.com` reachable
- `https://api.error-watch.tilvest.com/health/live` reachable

From non-allowed IP:

- web access blocked (`80/443`)

From server:

```bash
docker exec errorwatch-caddy sh -lc "wget -qO- http://host.docker.internal:3333/health/live"
docker exec errorwatch-caddy sh -lc "wget -qO- http://host.docker.internal:4001/ >/dev/null && echo ok"
```

---

## 7) Troubleshooting

Check UFW:

```bash
sudo ufw status verbose
sudo journalctl -k --since "-30 min" --no-pager | grep "UFW BLOCK"
```

Check Caddy for upstream/502:

```bash
docker logs --since 10m errorwatch-caddy
```

Check if Docker bypass is active:

```bash
sudo iptables -S DOCKER-USER
```

If you still have access from non-allowlisted IP, DOCKER-USER policy is likely missing or wrong.

---

## 8) Emergency rollback (temporary)

If you lock yourself out of web access:

```bash
sudo iptables -F DOCKER-USER
sudo iptables -A DOCKER-USER -j RETURN
sudo ufw status numbered
```

Then re-apply policy carefully.
