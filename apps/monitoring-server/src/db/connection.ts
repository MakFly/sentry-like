import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment
const connectionString = process.env.DATABASE_URL || "postgresql://errorwatch:errorwatch_dev_password@localhost:5432/errorwatch";

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: parseInt(process.env.DATABASE_POOL_SIZE || "20"),
  idle_timeout: 20,
  connect_timeout: 10,
  // SSL configuration for production
  ssl: process.env.DATABASE_SSL === "true" ? "require" : false,
});

// Export drizzle instance
export const db = drizzle(client, { schema });

// Export client for raw queries if needed
export { client as pgClient };

// Graceful shutdown helper
export async function closeDatabase(): Promise<void> {
  await client.end();
}

// Health check helper
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
