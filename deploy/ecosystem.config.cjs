const ROOT = process.env.ERRORWATCH_ROOT || "/opt/errorwatch";

module.exports = {
  apps: [
    {
      name: "errorwatch-api",
      cwd: `${ROOT}/apps/monitoring-server`,
      script: "bun",
      args: "run src/index.ts",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3333",
        DATABASE_URL: "postgresql://errorwatch:CHANGE_ME@localhost:55432/errorwatch",
        REDIS_URL: "redis://localhost:56379",
        BETTER_AUTH_SECRET: "fWb3tBTQ7lpLVNyZcSTc53eYVKDXWc5kTNJOcTY7zH8=",
        BETTER_AUTH_URL: "http://51.158.55.137",
        ADMIN_API_KEY: "ew_admin_CHANGE_ME",
        API_KEY_HASH_SECRET: "up1VGPB5f9qQaFMySOGV2AOqKj01y8rC",
        DASHBOARD_URL: "http://51.158.55.137",
        LOG_LEVEL: "info",
      },
    },
    {
      name: "errorwatch-dashboard",
      cwd: `${ROOT}/apps/dashboard`,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4001",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_APP_URL: "http://51.158.55.137",
        NEXT_PUBLIC_MONITORING_API_URL: "http://51.158.55.137",
      },
    },
  ],
};
