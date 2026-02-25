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
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.PORT || "3333",
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        ADMIN_API_KEY: process.env.ADMIN_API_KEY,
        API_KEY_HASH_SECRET: process.env.API_KEY_HASH_SECRET,
        DASHBOARD_URL: process.env.DASHBOARD_URL,
        API_URL: process.env.API_URL,
        LOG_LEVEL: process.env.LOG_LEVEL || "info",
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
        NODE_ENV: process.env.NODE_ENV || "production",
        NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || "1",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_MONITORING_API_URL: process.env.NEXT_PUBLIC_MONITORING_API_URL,
      },
    },
  ],
};
