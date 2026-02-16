# @errorwatch/sdk

Universal error monitoring SDK for ErrorWatch. Works with browser, React, and Vue applications.

## Features

- 🎯 **Universal** - Works in browser, React, and Vue environments
- 📹 **Session Replay** - Built-in rrweb integration for replaying user sessions
- 🔒 **TypeScript** - Fully typed for great DX
- 🎨 **Framework Integrations** - Ready-to-use React ErrorBoundary and Vue plugin
- 📦 **Lightweight** - Minimal bundle size impact

## Installation

```bash
npm install @errorwatch/sdk
```

## Quick Start

### Browser (Vanilla)

```typescript
import { ErrorWatch } from '@errorwatch/sdk';

const client = new ErrorWatch({
  dsn: 'https://your-dsn@api.errorwatch.io/project-id',
  environment: 'production'
});

client.captureException(new Error('Something went wrong'));
```

### React

```tsx
import { ErrorWatchProvider, useErrorWatch } from '@errorwatch/sdk/react';

function App() {
  return (
    <ErrorWatchProvider dsn="your-dsn">
      <YourComponent />
    </ErrorWatchProvider>
  );
}

function YourComponent() {
  const client = useErrorWatch();

  const handleClick = () => {
    client.captureMessage('User clicked button');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Vue

```vue
<script setup>
import { ErrorWatchPlugin } from '@errorwatch/sdk/vue';
import { createApp } from 'vue';

const app = createApp(App);
app.use(ErrorWatchPlugin, {
  dsn: 'your-dsn',
  environment: 'production'
});
</script>
```

## API Reference

### ErrorWatch

Main client class for error monitoring.

#### Constructor Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `dsn` | `string` | Yes | Your ErrorWatch DSN |
| `environment` | `string` | No | Environment name (e.g., `production`, `development`) |
| `release` | `string` | No | Release version |
| `sessionReplay` | `boolean` | No | Enable session replay (default: `true`) |
| `tracesSampleRate` | `number` | No | Percentage of transactions to sample (0-1) |

#### Methods

- `captureException(error, context?)` - Capture an error
- `captureMessage(message, level?)` - Capture a message
- `setUser(user)` - Set user context
- `setTag(key, value)` - Set a tag
- `configure(options)` - Update client configuration

## License

MIT
