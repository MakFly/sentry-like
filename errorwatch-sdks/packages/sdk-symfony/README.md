# ErrorWatch Symfony SDK

Symfony bundle for error monitoring with ErrorWatch.

## Installation

```bash
composer require errorwatch/sdk-symfony
```

## Configuration

```yaml
# config/packages/errorwatch.yaml
errorwatch:
  enabled: true
  endpoint: 'https://api.errorwatch.io'
  api_key: 'your-api-key'
  environment: '%env(APP_ENV)%'
```

`api_key` is required when `enabled: true` or `replay.enabled: true`.

## Advanced Configuration

```yaml
# config/packages/errorwatch.yaml
errorwatch:
  release: '%env(APP_VERSION)%'
  replay:
    enabled: true
    sample_rate: 0.1
```

## Session Replay (Twig only)

The bundle is compatible with API-only Symfony apps without Twig.

If Twig is installed, add the script to your main layout:

```twig
{# base.html.twig #}
{{ errorwatch_replay_script() }}
```

## Usage

Once installed and configured, the bundle automatically captures all Symfony exceptions and sends them to the ErrorWatch server in best-effort mode (1s timeout, silent errors).

No additional code required.

## Quality

```bash
composer test
composer stan
composer lint
composer cs:fix
```

## License

MIT
