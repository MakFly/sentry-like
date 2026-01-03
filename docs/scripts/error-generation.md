# Error Generation Scripts for ErrorWatch Testing

These scripts help you generate test errors to simulate monthly usage of the ErrorWatch platform.

## Prerequisites

- ErrorWatch monitoring server running on `http://localhost:3333`
- A valid API key for your project
- Node.js installed

## Quick Start

### Generate 5000 errors (default)

```bash
./generate-5k-errors.sh
```

### Use the Node.js script directly (more options)

```bash
# Generate 5000 errors in burst mode (default)
node generate-errors.js

# Generate 1000 errors
node generate-errors.js 1000

# Generate 5000 errors with custom API key
node generate-errors.js 5000 YOUR_API_KEY

# Progressive mode (50ms delay between errors)
node generate-errors.js 5000 YOUR_API_KEY progressive

# Progressive mode with custom delay
node generate-errors.js 5000 YOUR_API_KEY progressive
# (Edit DELAY_MS in the file to change delay)
```

## Getting Your API Key

1. Go to http://localhost:3001/dashboard
2. Navigate to Settings → API Keys
3. Copy your project API key

## Modes

### Burst Mode (default)
Sends all errors as fast as possible. Use this to quickly populate the dashboard with data.

```bash
./generate-5k-errors.sh
# or
node generate-errors.js 5000 YOUR_API_KEY burst
```

### Progressive Mode
Sends errors with a delay between each. This simulates real-world traffic patterns.

```bash
node generate-errors.js 5000 YOUR_API_KEY progressive
```

## Error Types Generated

The script generates 10 different error scenarios:
- RuntimeException (runtime errors)
- LogicException (invalid state)
- InvalidArgumentException (invalid parameters)
- PaymentGatewayException (payment failures)
- InventoryException (out of stock)
- HTTP errors (400, 404, etc.)
- Database errors (connection failures)
- API integration errors (timeouts)
- Authentication errors (invalid tokens)

Each error includes:
- Stack trace
- Random timestamps (within last 24h)
- Breadcrumbs (50% of errors)
- Release versions
- Random severity levels (fatal, error, warning, info, debug)

## Troubleshooting

### "Cannot connect to localhost:3333"
Make sure the monitoring server is running:
```bash
make status
```

### "Invalid API key" or 401 error
Check that your API key is valid and active in the dashboard.

### Quota exceeded (429 error)
You've reached your plan's limit. Upgrade your plan or delete some existing events.

## Dashboard URLs

After generating errors, check:
- Dashboard: http://localhost:3001/dashboard
- Issues: http://localhost:3001/dashboard/{orgSlug}/{projectSlug}/issues
- Stats: http://localhost:3001/dashboard/{orgSlug}/{projectSlug}/stats
