# ErrorWatch System Metrics Agent

Lightweight agent for collecting and streaming system metrics (CPU, RAM, Network) to [ErrorWatch](https://errorwatch.io). Designed for real-time infrastructure monitoring with low overhead.

## Requirements

- Go 1.21+ (for building)
- Linux/macOS (for running)

## Installation

### Download Binary

```bash
# Download the latest release for your platform
curl -L -o sdk-metrics https://github.com/MakFly/sentry-like/releases/latest/download/sdk-metrics

# Make it executable
chmod +x sdk-metrics
```

### From Source

```bash
git clone https://github.com/MakFly/sentry-like.git
cd sentry-like/packages/sdk-metrics
go build -o sdk-metrics .
```

## Quick Start

```bash
# Initialize configuration file
./sdk-metrics --init

# Edit the config file
vim sdk-metrics.yaml

# Run the agent
./sdk-metrics -c sdk-metrics.yaml
```

Or with environment variables:

```bash
export METRICS_API_KEY="your_api_key_here"
export METRICS_ENDPOINT="http://localhost:3333"
./sdk-metrics
```

## Configuration

### Configuration File

Create `sdk-metrics.yaml`:

```yaml
endpoint: "http://localhost:3333"
api_key: "your_api_key_here"
host_id: "server-01"
hostname: "production-server"
collection_interval: 10
tags:
  env: production
  region: eu-west
  role: api
transport:
  use_sse: false
  retry_interval: 5
  max_retries: 10
  buffer_size: 100
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `METRICS_API_KEY` | Your ErrorWatch API key | (required) |
| `METRICS_ENDPOINT` | API endpoint URL | `http://localhost:3333` |
| `METRICS_HOST_ID` | Unique host identifier | hostname |
| `METRICS_HOSTNAME` | Display hostname | hostname |
| `METRICS_COLLECTION_INTERVAL` | Collection interval (seconds) | `10` |
| `METRICS_TAGS` | Comma-separated tags | - |
| `METRICS_USE_SSE` | Use SSE streaming | `false` |

### Command Line Options

```bash
./sdk-metrics --help

Options:
  --config path       Path to config file
  --init             Create default config file
  --config-show      Show current configuration
  --config-reset     Reset configuration to defaults
  --version          Show version
```

## Metrics Collected

### CPU
- `user` - CPU time in user mode (%)
- `system` - CPU time in system mode (%)
- `idle` - CPU idle time (%)
- `iowait` - CPU waiting for I/O (%)
- `nice` - CPU time in nice mode (%)

### Memory
- `total` - Total memory (bytes)
- `used` - Used memory (bytes)
- `free` - Free memory (bytes)
- `available` - Available memory (bytes)
- `cached` - Cached memory (bytes)
- `swapTotal` - Total swap (bytes)
- `swapUsed` - Used swap (bytes)

### Network
- `interface` - Network interface name
- `rxBytes` - Bytes received per second
- `txBytes` - Bytes transmitted per second
- `rxPackets` - Packets received
- `txPackets` - Packets transmitted
- `rxErrors` - Receive errors
- `txErrors` - Transmit errors

## Docker

```dockerfile
FROM errorwatch/sdk-metrics:latest

ENV METRICS_API_KEY=your_api_key
ENV METRICS_HOST_ID=container-name

CMD ["/sdk-metrics"]
```

```bash
docker run -d \
  --name metrics-agent \
  -e METRICS_API_KEY=your_api_key \
  -e METRICS_ENDPOINT=http://host.docker.internal:3333 \
  errorwatch/sdk-metrics:latest
```

## Systemd Service

Create `/etc/systemd/system/sdk-metrics.service`:

```ini
[Unit]
Description=ErrorWatch Metrics Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sdk-metrics
ExecStart=/opt/sdk-metrics/sdk-metrics
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo cp sdk-metrics /opt/sdk-metrics/
sudo systemctl daemon-reload
sudo systemctl enable sdk-metrics
sudo systemctl start sdk-metrics
```

## Troubleshooting

### Agent not sending metrics

1. Check API key is correct:
   ```bash
   ./sdk-metrics --config-show
   ```

2. Verify endpoint is reachable:
   ```bash
   curl -X POST http://localhost:3333/api/v1/metrics/ingest \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your_key" \
     -d '{"hostId":"test","hostname":"test","metrics":{"hostname":"test","timestamp":1234567890,"os":"linux","cpu":{"user":0,"system":0,"idle":100},"memory":{"total":0,"used":0,"free":0,"available":0}}}'
   ```

3. Check logs for errors

### Reset configuration

```bash
./sdk-metrics --config-reset
```

## License

MIT
