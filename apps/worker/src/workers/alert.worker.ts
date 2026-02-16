import { Worker } from "bullmq";
import { redisConnection } from "../queue/connection.js";

interface AlertJobData {
  projectId: string;
  fingerprint: string;
  isNewGroup: boolean;
  level: string;
  message: string;
}

export const alertWorker = new Worker<AlertJobData>(
  "alerts",
  async (job) => {
    console.log(`Processing alert job ${job.id}`);
    // TODO: Implement alert notification logic
    // - Send email
    // - Send Slack webhook
    // - Send custom webhooks
    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);
