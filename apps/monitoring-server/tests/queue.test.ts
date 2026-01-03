/**
 * BullMQ Queue Integration Tests
 * Tests Redis connection and queue functionality
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Redis } from "ioredis";
import { Queue, Worker, Job } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

describe("BullMQ Queue Integration", () => {
  let redis: Redis;
  let testQueue: Queue;
  let testWorker: Worker;

  beforeAll(async () => {
    // Connect to Redis
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testWorker) await testWorker.close();
    if (testQueue) await testQueue.close();
    if (redis) await redis.quit();
  });

  test("Redis connection is available", async () => {
    const pong = await redis.ping();
    expect(pong).toBe("PONG");
  });

  test("Can create a queue and add a job", async () => {
    testQueue = new Queue("test-queue", {
      connection: redis,
    });

    const job = await testQueue.add("test-job", {
      message: "Hello from test",
      timestamp: Date.now(),
    });

    expect(job.id).toBeDefined();
    expect(job.name).toBe("test-job");

    // Cleanup
    await job.remove();
  });

  test("Worker processes jobs correctly", async () => {
    const queueName = `test-worker-${Date.now()}`;
    const workerQueue = new Queue(queueName, { connection: redis });

    let processedData: any = null;

    testWorker = new Worker(
      queueName,
      async (job: Job) => {
        processedData = job.data;
        return { success: true };
      },
      { connection: redis }
    );

    // Add a job
    const testData = { message: "Process me", value: 42 };
    await workerQueue.add("process-test", testData);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(processedData).not.toBeNull();
    expect(processedData.message).toBe("Process me");
    expect(processedData.value).toBe(42);

    // Cleanup
    await workerQueue.close();
  });

  test("Event queue is accessible", async () => {
    const { eventQueue } = await import("../src/queue/queues");

    // Check queue exists
    expect(eventQueue).toBeDefined();
    expect(eventQueue.name).toBe("events");

    // Check we can get queue info
    const jobCounts = await eventQueue.getJobCounts();
    expect(jobCounts).toHaveProperty("waiting");
    expect(jobCounts).toHaveProperty("active");
    expect(jobCounts).toHaveProperty("completed");
    expect(jobCounts).toHaveProperty("failed");
  });

  test("Replay queue is accessible", async () => {
    const { replayQueue } = await import("../src/queue/queues");

    expect(replayQueue).toBeDefined();
    expect(replayQueue.name).toBe("replays");
  });

  test("Alert queue is accessible", async () => {
    const { alertQueue } = await import("../src/queue/queues");

    expect(alertQueue).toBeDefined();
    expect(alertQueue.name).toBe("alerts");
  });

  test("isRedisAvailable returns true", async () => {
    const { isRedisAvailable } = await import("../src/queue/connection");

    const available = await isRedisAvailable();
    expect(available).toBe(true);
  });
});
