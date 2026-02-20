#!/usr/bin/env bun
/**
 * Backfill Aggregation Tables
 * @description One-shot script to populate hourly and daily aggregation tables
 * from existing raw performance data (last 30 days).
 *
 * Usage: bun run apps/monitoring-server/src/scripts/backfill-aggregates.ts
 */
import {
  aggregateHourlyMetrics,
  aggregateHourlyTransactions,
  aggregateDailyFromHourly,
} from "../services/aggregation";

const BACKFILL_DAYS = 30;

async function backfill() {
  const startTime = Date.now();
  console.log(`Starting backfill for the last ${BACKFILL_DAYS} days...`);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let totalMetrics = 0;
  let totalTransactions = 0;
  let totalDailyMetrics = 0;
  let totalDailyTransactions = 0;

  for (let daysAgo = BACKFILL_DAYS; daysAgo >= 1; daysAgo--) {
    const targetDate = new Date(today);
    targetDate.setUTCDate(targetDate.getUTCDate() - daysAgo);
    const dateStr = targetDate.toISOString().split("T")[0];

    console.log(`\n[${BACKFILL_DAYS - daysAgo + 1}/${BACKFILL_DAYS}] Processing ${dateStr}...`);

    // Hourly aggregation
    const metrics = await aggregateHourlyMetrics(targetDate);
    const transactions = await aggregateHourlyTransactions(targetDate);
    totalMetrics += metrics;
    totalTransactions += transactions;
    console.log(`  Hourly: ${metrics} metric rows, ${transactions} transaction rows`);

    // Daily rollup from hourly
    const daily = await aggregateDailyFromHourly(targetDate);
    totalDailyMetrics += daily.metrics;
    totalDailyTransactions += daily.transactions;
    console.log(`  Daily: ${daily.metrics} metric rows, ${daily.transactions} transaction rows`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nBackfill complete in ${elapsed}s`);
  console.log(`  Hourly metrics: ${totalMetrics} rows`);
  console.log(`  Hourly transactions: ${totalTransactions} rows`);
  console.log(`  Daily metrics: ${totalDailyMetrics} rows`);
  console.log(`  Daily transactions: ${totalDailyTransactions} rows`);

  process.exit(0);
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
