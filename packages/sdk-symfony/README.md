# ErrorWatch Symfony Bundle

Symfony bundle for error monitoring, APM, and session replay with [ErrorWatch](https://errorwatch.io). Captures exceptions, request traces, and user context automatically.

## Requirements

- PHP 8.1+
- Symfony 6.0+ / 7.0+ / 8.0+

## Installation

```bash
composer require errorwatch/sdk-symfony

# Initialize configuration
php bin/console errorwatch:setup
```

The `errorwatch:setup` command:
- Creates `config/packages/error_watch.yaml` with all default settings
- Appends environment variables to `.env` (and `.env.local` if it exists)
- Is idempotent: safe to run multiple times

Configure your API key in `.env.local`:

```bash
ERRORWATCH_ENDPOINT=https://acme.errorwatch.io
ERRORWATCH_API_KEY=your_api_key_here
```

### Without Symfony Flex

1. Register the bundle in `config/bundles.php`:

```php
return [
    // ...
    ErrorWatch\Symfony\ErrorWatchBundle::class => ['all' => true],
];
```

2. Create `config/packages/error_watch.yaml`:

```yaml
error_watch:
    enabled: '%env(bool:ERRORWATCH_ENABLED)%'
    endpoint: '%env(default::ERRORWATCH_ENDPOINT)%'
    api_key: '%env(default::ERRORWATCH_API_KEY)%'
    environment: '%env(default::ERRORWATCH_ENV)%'
    release: '%env(default::ERRORWATCH_RELEASE)%'
```

3. Add environment variables to `.env`:

```bash
ERRORWATCH_ENABLED=true
ERRORWATCH_ENDPOINT=https://api.errorwatch.io
ERRORWATCH_API_KEY=your_api_key_here
```

## Configuration

Environment variables (supported by both Flex and manual installation):

| Variable | Description | Default |
|----------|-------------|---------|
| `ERRORWATCH_ENABLED` | Enable/disable the bundle | `true` |
| `ERRORWATCH_ENDPOINT` | API endpoint URL | (empty) |
| `ERRORWATCH_API_KEY` | Your ErrorWatch API key | (empty) |
| `ERRORWATCH_ENV` | Environment name | `kernel.environment` |
| `ERRORWATCH_RELEASE` | Release version | (auto-detected from git) |

## Features

### Exception Tracking

Automatic — captures all `KernelEvents::EXCEPTION` and sends them to ErrorWatch in best-effort mode (1s timeout, silent errors). No code required.

### Console Command Errors

Captures exceptions and non-zero exit codes from Symfony console commands (cron jobs, imports, workers).

```yaml
error_watch:
  console:
    enabled: true              # default: true
    capture_exit_codes: true   # default: true
```

### Messenger Worker Errors

Captures message failures in Symfony Messenger workers. Requires `symfony/messenger`.

```yaml
error_watch:
  messenger:
    enabled: true              # default: true
    capture_retries: false     # default: false (only final failures)
```

### Security Events

Captures login failures and optionally login successes as breadcrumbs. Requires `symfony/security-bundle`.

```yaml
error_watch:
  security:
    enabled: true              # default: true
    capture_login_success: false  # default: false
```

### APM & Request Tracking

```yaml
error_watch:
  apm:
    enabled: true              # default: true
    request_tracking: true     # default: true
    excluded_routes: ['_profiler', '_wdt']
```

### Outgoing HTTP Client Tracking

Traces outgoing HTTP calls as APM spans. Adds breadcrumbs for 5xx responses.

```yaml
error_watch:
  apm:
    http_client:
      enabled: true                      # default: true
      capture_errors_as_breadcrumbs: true # default: true
```

### Doctrine Query Tracing

Requires `doctrine/dbal`:

```yaml
error_watch:
  apm:
    doctrine:
      enabled: true            # default: true
      log_queries: true        # default: true
```

### Deprecation Tracking

Captures PHP `E_DEPRECATED` / `E_USER_DEPRECATED` errors. Opt-in (can be noisy).

```yaml
error_watch:
  deprecations:
    enabled: false             # default: false (opt-in)
```

### Monolog Forwarding

Requires `monolog/monolog`:

```yaml
error_watch:
  monolog:
    enabled: true              # default: true
    level: warning             # default: warning
    excluded_channels: [event, doctrine, http_client]
    capture_context: true
    capture_extra: true
```

### User Context

Requires `symfony/security-bundle`:

```yaml
error_watch:
  user_context:
    enabled: true              # default: true
    capture_ip: true           # default: true
```

### Session Replay (Twig)

Requires `symfony/twig-bundle`:

```yaml
error_watch:
  replay:
    enabled: true
    sample_rate: 0.1           # default: 0.1
    debug: false               # default: false
```

Add the script to your base template:

```twig
{# base.html.twig #}
{{ error_watch_replay_script() }}
```

### Breadcrumbs

Automatic breadcrumbs are collected for HTTP requests, SQL queries, console commands, security events, and outgoing HTTP calls.

```yaml
error_watch:
  breadcrumbs:
    enabled: true              # default: true
    max_count: 100             # default: 100, max: 500
```

## Full Configuration Reference

```yaml
error_watch:
  enabled: true
  endpoint: 'https://api.errorwatch.io'
  api_key: 'your-api-key'
  environment: '%env(APP_ENV)%'
  release: ~                   # auto-detects from git or APP_VERSION env
  replay:
    enabled: false
    sample_rate: 0.1
    debug: false
  breadcrumbs:
    enabled: true
    max_count: 100
  user_context:
    enabled: true
    capture_ip: true
  console:
    enabled: true
    capture_exit_codes: true
  messenger:
    enabled: true
    capture_retries: false
  deprecations:
    enabled: false
  security:
    enabled: true
    capture_login_success: false
  apm:
    enabled: true
    request_tracking: true
    excluded_routes: ['_profiler', '_wdt']
    doctrine:
      enabled: true
      log_queries: true
    http_client:
      enabled: true
      capture_errors_as_breadcrumbs: true
  monolog:
    enabled: true
    level: warning
    excluded_channels: [event, doctrine, http_client]
    capture_context: true
    capture_extra: true
```

## Quality

```bash
composer test       # PHPUnit tests
composer stan       # PHPStan analysis (level 6)
composer lint       # PHP-CS-Fixer dry run
composer cs:fix     # PHP-CS-Fixer auto-fix
```

## License

MIT
