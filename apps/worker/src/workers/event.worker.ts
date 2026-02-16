import { Worker } from "bullmq";
import { redisConnection } from "../queue/connection.js";

interface EventJobData {
  projectId: string;
  message: string;
  file: string;
  line: number;
  column?: number;
  stack: string;
  env: string;
  url: string | null;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  statusCode: number | null;
  breadcrumbs: unknown;
  sessionId: string | null;
  release?: string;
  createdAt: string;
}

export const eventWorker = new Worker<EventJobData>(
  "events",
  async (job) => {
    console.log(`Processing event job ${job.id}`);
    // TODO: Implement event processing logic
    // - Save to database
    // - Group errors
    // - Update stats
    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);
