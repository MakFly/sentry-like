import { Worker, Queue } from "bullmq";
import { redisConnection } from "./queue/connection.js";
import { eventWorker } from "./workers/event.worker.js";
import { alertWorker } from "./workers/alert.worker.js";
import { replayWorker } from "./workers/replay.worker.js";

const eventQueue = new Queue("events", { connection: redisConnection });
const alertQueue = new Queue("alerts", { connection: redisConnection });
const replayQueue = new Queue("replays", { connection: redisConnection });

async function start() {
  console.log("Starting worker...");

  const workers = [
    eventWorker,
    alertWorker,
    replayWorker,
  ];

  for (const worker of workers) {
    worker.on("completed", (job) => {
      console.log(`${job.queueName}:${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`${job?.queueName}:${job?.id} failed:`, err.message);
    });
  }

  console.log("Workers started successfully");
}

start().catch(console.error);
