# Example Symfony

Minimal Symfony 7 API that exercises every ErrorWatch SDK capability so the
dashboard gets populated with realistic data: exceptions with structured
frames, HTTP client spans, cache operations, correlated logs and W3C trace
propagation.

## Quick start

Prerequisite: ErrorWatch infra + API + Web running locally (`make dev` from the repo root).

```bash
# From the repository root — single command, idempotent:
make example NAME=symfony
```

This installs deps, provisions an org+project+API key in ErrorWatch via the dev
seed endpoint, writes the key into `examples/example-symfony/.env`, starts the
Symfony server on `:8088` in background, and fires every `/trigger/*` route so
the dashboard fills up immediately. The terminal prints the dashboard URL.

Re-running `make example NAME=symfony` is safe: existing org/project are
reused, a fresh API key is issued and stored in `.env`.

```bash
make example-status NAME=symfony   # PID + port
make example-down   NAME=symfony   # stop the server
make example-reset  NAME=symfony   # wipe vendor/var/.env (destructive)
```

### Lower-level targets

The granular `example-symfony-*` targets (`-setup`, `-start`, `-trigger`,
`-cron`, `-logs`, `-stop`, `-reset`) still exist for manual workflows.

## Routes

| Route              | What it exercises                                                     |
|--------------------|-----------------------------------------------------------------------|
| `/`                | Lists all trigger routes                                              |
| `/trigger/error`   | `throw RuntimeException` → frames[] + fingerprint + trace_id/span_id  |
| `/trigger/http-call` | Outbound HTTP → http.client span + outbound traceparent header      |
| `/trigger/cache`   | `cache.get` / `cache.set` spans with `cache.hit`                      |
| `/trigger/log`     | Monolog info + warning → trace-correlated application_logs            |
| `/trigger/slow-query` | Stall 400ms → raise p95 latency                                    |
| `/trigger/db-list` | Doctrine SELECT → single `db.sql.query` span                          |
| `/trigger/db-n-plus-one` | 10 sequential SELECTs → N+1 detection                           |
| `/trigger/queue`   | Dispatch a Messenger message → `queue.publish` span                   |

### Consuming the queue

`/trigger/queue` publishes on the `async` transport (backed by Doctrine).
Start a worker to process it — the consume produces an independent
`queue.process` transaction:

```bash
bin/console messenger:consume async -vv
```


## Background server

```bash
make example-symfony-start-bg   # daemonised on :8088, PID in var/run.pid
make example-symfony-logs       # tail var/server.log
make example-symfony-stop       # kill the background server
```

## Reset

```bash
make example-symfony-reset      # wipes vendor/, var/, composer.lock
make example-symfony-setup      # reinstall from scratch
```

## Wiring note — local SDK

`composer.json` declares a path repository to `../../packages/sdk-symfony` so
the example uses the local checkout (or worktree) of the SDK. If
`packages/sdk-symfony` is missing, the setup target runs `sdk-symfony-init`
automatically.
