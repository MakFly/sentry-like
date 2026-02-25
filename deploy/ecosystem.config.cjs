const ROOT = process.env.ERRORWATCH_ROOT || "/opt/errorwatch";

module.exports = {
  apps: [
    {
      name: "errorwatch-api",
      cwd: `${ROOT}/apps/monitoring-server`,
      script: "dist/index.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3333",
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
      },
    },
  ],
};
