# ErrorWatch SDKs

Official SDKs for ErrorWatch error monitoring platform.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@errorwatch/sdk`](./packages/sdk/) | ![npm](https://img.shields.io/npm/v/@errorwatch/sdk) | Universal SDK (Browser + React + Vue) |
| [`@errorwatch/sdk-symfony`](./packages/sdk-symfony/) | ![packagist](https://img.shields.io/packagist/v/errorwatch/sdk-symfony) | PHP Symfony Bundle |

## Installation

### JavaScript/TypeScript

```bash
# Browser / Vanilla
npm install @errorwatch/sdk

# React
npm install @errorwatch/sdk

# Vue
npm install @errorwatch/sdk
```

### PHP/Symfony

```bash
composer require errorwatch/sdk-symfony
```

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Browser SDK](./packages/sdk/README.md)
- [React Integration](./docs/react.md)
- [Vue Integration](./docs/vue.md)
- [Symfony Bundle](./packages/sdk-symfony/README.md)

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Watch mode
bun run dev

# Run tests
bun run test
```

## Publishing

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

```bash
# Create a changeset
bun run changeset

# Version packages
bun run version-packages

# Publish to npm
bun run release
```

## License

MIT
