import { ProjectSettingsRepository } from "../repositories/ProjectSettingsRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { MemberRepository } from "../repositories/MemberRepository";
import logger from "../logger";

export const ProjectSettingsService = {
  get: async (projectId: string, userId: string) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    let settings = await ProjectSettingsRepository.findByProjectId(projectId);
    if (!settings) {
      settings = await ProjectSettingsRepository.create({
        id: crypto.randomUUID(),
        projectId,
        timezone: "UTC",
        retentionDays: 30,
        autoResolve: true,
        autoResolveDays: 14,
        eventsEnabled: true,
        updatedAt: new Date(),
      });
      logger.info("Created default project settings", { projectId });
    }

    return settings;
  },

  update: async (
    projectId: string,
    userId: string,
    data: {
      timezone?: string;
      retentionDays?: number;
      autoResolve?: boolean;
      autoResolveDays?: number;
      eventsEnabled?: boolean;
    }
  ) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    let settings = await ProjectSettingsRepository.findByProjectId(projectId);
    if (!settings) {
      settings = await ProjectSettingsRepository.create({
        id: crypto.randomUUID(),
        projectId,
        timezone: data.timezone || "UTC",
        retentionDays: data.retentionDays ?? 30,
        autoResolve: data.autoResolve ?? true,
        autoResolveDays: data.autoResolveDays ?? 14,
        eventsEnabled: data.eventsEnabled ?? true,
        updatedAt: new Date(),
      });
      logger.info("Created project settings", { projectId, userId });
    } else {
      await ProjectSettingsRepository.update(projectId, {
        ...data,
        updatedAt: new Date(),
      });
      settings = await ProjectSettingsRepository.findByProjectId(projectId);
      logger.info("Updated project settings", {
        projectId,
        userId,
        updates: Object.keys(data),
      });
    }

    return settings!;
  },
};

