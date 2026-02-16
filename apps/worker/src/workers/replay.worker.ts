import { Worker } from "bullmq";
import { redisConnection } from "../queue/connection.js";

interface ReplayJobData {
  projectId: string;
  sessionId: string;
  events: string | null;
  error: {
    message: string;
    file?: string;
    line?: number;
    stack?: string;
    level: "fatal" | "error" | "warning" | "info" | "debug";
  };
  url: string | null;
  userAgent: string | null;
  timestamp: number;
  release?: string | null;
}

export const replayWorker = new Worker<ReplayJobData>(
  "replays",
  async (job) => {
    console.log(`Processing replay job ${job.id}`);
    // TODO: Implement replay processing logic
    // - Save replay events
    // - Process with rrweb
    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);
