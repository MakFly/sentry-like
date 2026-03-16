import { AlertRepository } from "../repositories/AlertRepository";
import {
  createAlertRule as createRule,
  listAlertRules as listRules,
  updateAlertRule as updateRule,
  deleteAlertRule as deleteRule,
  getNotificationHistory as getHistory,
} from "./alerts";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { MemberRepository } from "../repositories/MemberRepository";
import logger from "../logger";
import type { AlertRuleType, AlertChannel, AlertRuleConfig, CreateAlertRuleInput } from "../types/services";

export const AlertService = {
  list: async (projectId: string, userId: string) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    const rules = await listRules(projectId);
    return rules.map((rule) => ({
      ...rule,
      config: rule.config ?? {},
    }));
  },

  create: async (userId: string, data: CreateAlertRuleInput) => {
    const project = await ProjectRepository.findByIdWithOrg(data.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    if (data.type === "threshold") {
      if (!data.threshold || !data.windowMinutes) {
        throw new Error("Threshold rules require threshold and windowMinutes");
      }
    }

    if (data.channel === "email" && !data.config.email) {
      throw new Error("Email channel requires email address");
    }
    if (data.channel === "slack" && !data.config.slackWebhook) {
      throw new Error("Slack channel requires webhook URL");
    }
    if (data.channel === "webhook" && !data.config.webhookUrl) {
      throw new Error("Webhook channel requires webhook URL");
    }

    const rule = await createRule({
      projectId: data.projectId,
      name: data.name,
      type: data.type,
      threshold: data.threshold,
      windowMinutes: data.windowMinutes,
      channel: data.channel,
      config: data.config,
    });

    logger.info("Alert rule created via API", { ruleId: rule.id, userId });
    return {
      ...rule,
      config: data.config,
    };
  },

  update: async (userId: string, ruleId: string, data: Partial<Omit<CreateAlertRuleInput, "projectId"> & { enabled?: boolean }>) => {
    const rule = await AlertRepository.findById(ruleId);
    if (!rule) {
      throw new Error("Alert rule not found");
    }

    const project = await ProjectRepository.findByIdWithOrg(rule.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    await updateRule(ruleId, data);
    logger.info("Alert rule updated via API", { ruleId, userId });
    return { success: true };
  },

  delete: async (userId: string, ruleId: string) => {
    const rule = await AlertRepository.findById(ruleId);
    if (!rule) {
      throw new Error("Alert rule not found");
    }

    const project = await ProjectRepository.findByIdWithOrg(rule.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    await deleteRule(ruleId);
    logger.info("Alert rule deleted via API", { ruleId, userId });
    return { success: true };
  },

  getNotifications: async (projectId: string, userId: string) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    return getHistory(projectId);
  },
};
