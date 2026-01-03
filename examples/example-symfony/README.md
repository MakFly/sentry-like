# ErrorWatch Test Client

Sophisticated error scenario generator for testing the ErrorWatch dashboard.

## Setup

```bash
cd example-client
composer install
```

## Usage

### Web Dashboard

Start the PHP development server:

```bash
php -S localhost:8080 -t public
```

Then open http://localhost:8080 in your browser.

The dashboard provides:
- **8 error categories** with realistic scenarios
- **50+ different error types**
- **Quick actions** for batch testing
- **Chaos mode** for stress testing

### CLI Command

Generate errors from the command line:

```bash
# Generate 10 random errors
php bin/console app:generate-errors 10

# Generate 50 errors from a specific category
php bin/console app:generate-errors 50 --category=ecommerce

# Generate errors in burst mode (no delay)
php bin/console app:generate-errors 100 --burst

# Generate errors with custom delay (500ms between each)
php bin/console app:generate-errors 20 --delay=500
```

**Available categories:**
- `basic` - RuntimeException, LogicException, TypeError, etc.
- `http` - HTTP error codes (400, 401, 403, 404, 429, 500, 503)
- `ecommerce` - Payment failures, out of stock, cart issues
- `database` - Connection errors, deadlocks, constraints
- `api` - Timeouts, rate limits, SSL errors
- `auth` - JWT errors, account locks, 2FA failures
- `file` - File operations, permissions, disk full
- `chaos` - Fun/random critical errors

## Error Scenarios

### Basic Exceptions
- RuntimeException
- LogicException
- InvalidArgumentException
- TypeError
- DivisionByZeroError
- OverflowException
- UnderflowException
- RangeException

### HTTP Errors
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 429 Too Many Requests
- 500 Internal Server Error
- 503 Service Unavailable

### E-Commerce
- Payment gateway failures
- Out of stock errors
- Invalid coupon codes
- Shipping calculation errors
- Cart session expiry
- Order limit exceeded

### Database
- Connection refused
- Query timeout
- Deadlock detected
- Constraint violations
- Duplicate entries
- Entity not found

### API Integration
- Request timeouts
- Rate limiting
- Invalid responses
- Authentication failures
- SSL certificate errors
- DNS resolution failures

### Authentication
- Invalid JWT tokens
- Expired tokens
- Invalid credentials
- Account lockouts
- Session hijacking detection
- 2FA verification failures

### File Operations
- File not found
- Permission denied
- File too large
- Invalid file type
- Disk full
- Corrupted files

### Chaos Mode
Random catastrophic errors for stress testing.

## Configuration

Edit `config/packages/error_monitoring.yaml`:

```yaml
error_monitoring:
  enabled: true
  endpoint: 'http://localhost:3333'
  api_key: 'your-api-key'
  environment: 'dev'
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Test dashboard |
| `GET /api/scenarios` | List all scenarios (JSON) |
| `GET /test/{category}/{scenario}` | Trigger specific error |
| `GET /test/batch/{count}` | Trigger batch errors |
| `GET /test/chaos` | Trigger random chaos error |
