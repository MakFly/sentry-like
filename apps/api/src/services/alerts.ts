import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "../db/connection";
import { alertRules, notifications, errorGroups, errorEvents, projects } from "../db/schema";
import { sendErrorAlertEmail, sendThresholdAlertEmail, sendRegressionAlertEmail } from "./email";
import logger from "../logger";
import type { AlertRuleType, AlertChannel, AlertRuleConfig, CreateAlertRuleInput } from "../types/services";

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

export async function createAlertRule(input: CreateAlertRuleInput) {
  const now = new Date();

  const result = await db
    .insert(alertRules)
    .values({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      name: input.name,
      type: input.type,
      threshold: input.threshold,
      windowMinutes: input.windowMinutes,
      channel: input.channel,
      config: JSON.stringify(input.config),
      enabled: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  logger.info("Alert rule created", { ruleId: result[0].id, type: input.type });
  return result[0];
}

export async function listAlertRules(projectId: string) {
  return db
    .select()
    .from(alertRules)
    .where(eq(alertRules.projectId, projectId))
    .orderBy(desc(alertRules.createdAt));
}

export async function updateAlertRule(
  ruleId: string,
  updates: Partial<Omit<CreateAlertRuleInput, "projectId">> & { enabled?: boolean }
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.threshold !== undefined) updateData.threshold = updates.threshold;
  if (updates.windowMinutes !== undefined) updateData.windowMinutes = updates.windowMinutes;
  if (updates.channel !== undefined) updateData.channel = updates.channel;
  if (updates.config !== undefined) updateData.config = JSON.stringify(updates.config);
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

  await db
    .update(alertRules)
    .set(updateData)
    .where(eq(alertRules.id, ruleId));

  logger.info("Alert rule updated", { ruleId });
}

export async function deleteAlertRule(ruleId: string) {
  await db.delete(alertRules).where(eq(alertRules.id, ruleId));
  logger.info("Alert rule deleted", { ruleId });
}

// Trigger alerts for a new error event
export async function triggerAlertsForNewError(
  projectId: string,
  fingerprint: string,
  isNewGroup: boolean,
  isRegression?: boolean
) {
  logger.debug("Checking alerts for error", { projectId, fingerprint, isNewGroup });

  // Get enabled rules for this project
  const rules = await db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.projectId, projectId), eq(alertRules.enabled, true)));

  if (rules.length === 0) {
    return;
  }

  // Get error group details
  const group = (await db
    .select()
    .from(errorGroups)
    .where(eq(errorGroups.fingerprint, fingerprint)))[0];

  if (!group) {
    return;
  }

  // Get project name
  const project = (await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId)))[0];

  const projectName = project?.name || "Unknown Project";

  for (const rule of rules) {
    try {
      const config: AlertRuleConfig = rule.config ?? {};

      // Check if rule should trigger
      let shouldTrigger = false;

      if (rule.type === "new_error" && isNewGroup) {
        // Trigger for new error groups only
        shouldTrigger = true;
      } else if (rule.type === "threshold" && rule.threshold && rule.windowMinutes) {
        // Check if threshold exceeded in time window
        const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
        const recentEvents = await db
          .select()
          .from(errorEvents)
          .where(
            and(
              eq(errorEvents.projectId, projectId),
              gt(errorEvents.createdAt, windowStart)
            )
          );

        if (recentEvents.length >= rule.threshold) {
          // Check if we already sent a notification recently (avoid spam)
          const recentNotification = (await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.ruleId, rule.id),
                gt(notifications.createdAt, windowStart)
              )
            ))[0];

          if (!recentNotification) {
            shouldTrigger = true;
          }
        }
      } else if (rule.type === "regression" && isRegression) {
        shouldTrigger = true;
      }

      if (!shouldTrigger) {
        continue;
      }

      // Send notification based on channel
      let result: { success: boolean; error?: string };

      if (rule.channel === "email" && config.email) {
        if (rule.type === "threshold") {
          result = await sendThresholdAlertEmail({
            to: config.email,
            projectName,
            eventCount: group.count,
            threshold: rule.threshold!,
            windowMinutes: rule.windowMinutes!,
            dashboardUrl: DASHBOARD_URL,
          });
        } else if (rule.type === "regression") {
          // Get latest event for environment info
          const latestEvent = (await db
            .select({ env: errorEvents.env })
            .from(errorEvents)
            .where(eq(errorEvents.fingerprint, fingerprint))
            .orderBy(desc(errorEvents.createdAt))
            .limit(1))[0];

          result = await sendRegressionAlertEmail({
            to: config.email,
            projectName,
            errorMessage: group.message,
            errorFile: group.file,
            errorLine: group.line,
            eventCount: group.count,
            fingerprint,
            environment: latestEvent?.env,
            resolvedAt: group.resolvedAt?.toISOString(),
            dashboardUrl: DASHBOARD_URL,
          });
        } else {
          // Get latest event for environment info
          const latestEvent = (await db
            .select({ env: errorEvents.env })
            .from(errorEvents)
            .where(eq(errorEvents.fingerprint, fingerprint))
            .orderBy(desc(errorEvents.createdAt))
            .limit(1))[0];

          result = await sendErrorAlertEmail({
            to: config.email,
            projectName,
            errorMessage: group.message,
            errorFile: group.file,
            errorLine: group.line,
            eventCount: group.count,
            fingerprint,
            environment: latestEvent?.env,
            dashboardUrl: DASHBOARD_URL,
          });
        }
      } else if (rule.channel === "webhook" && config.webhookUrl) {
        result = await sendWebhook(config.webhookUrl, {
          type: rule.type,
          projectName,
          error: {
            message: group.message,
            file: group.file,
            line: group.line,
            count: group.count,
            fingerprint,
          },
        });
      } else if (rule.channel === "slack" && config.slackWebhook) {
        result = await sendSlackNotification(config.slackWebhook, {
          projectName,
          errorMessage: group.message,
          errorFile: group.file,
          errorLine: group.line,
          eventCount: group.count,
          fingerprint,
          dashboardUrl: DASHBOARD_URL,
        });
      } else {
        logger.warn("No valid config for alert channel", { ruleId: rule.id, channel: rule.channel });
        continue;
      }

      // Log notification
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        ruleId: rule.id,
        projectId,
        fingerprint,
        channel: rule.channel,
        status: result.success ? "sent" : "failed",
        error: result.error,
        sentAt: result.success ? new Date() : null,
        createdAt: new Date(),
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error("Failed to process alert rule", { ruleId: rule.id, error });

      // Log failed notification
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        ruleId: rule.id,
        projectId,
        fingerprint,
        channel: rule.channel,
        status: "failed",
        error,
        createdAt: new Date(),
      });
    }
  }
}

// Webhook sender
async function sendWebhook(
  url: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    logger.info("Webhook sent", { url });
    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    logger.error("Webhook failed", { url, error });
    return { success: false, error };
  }
}

// Slack notification sender
async function sendSlackNotification(
  webhookUrl: string,
  data: {
    projectName: string;
    errorMessage: string;
    errorFile: string;
    errorLine: number;
    eventCount: number;
    fingerprint: string;
    dashboardUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `New Error in ${data.projectName}`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Error:* \`${data.errorMessage}\`\n*Location:* \`${data.errorFile}:${data.errorLine}\`\n*Events:* ${data.eventCount}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Details",
                  emoji: true,
                },
                url: `${data.dashboardUrl}/dashboard/issues/${data.fingerprint}`,
                style: "primary",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    logger.info("Slack notification sent");
    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    logger.error("Slack notification failed", { error });
    return { success: false, error };
  }
}

// Get notification history
export async function getNotificationHistory(projectId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.projectId, projectId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
