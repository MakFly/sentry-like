import { ReleaseRepository } from "../repositories/ReleaseRepository";
import { ApiKeyService } from "./ApiKeyService";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { MemberRepository } from "../repositories/MemberRepository";
import logger from "../logger";

export const ReleaseService = {
  create: async (
    data: {
      projectId?: string;
      version: string;
      environment?: string;
      url?: string;
      commitSha?: string;
      commitMessage?: string;
      commitAuthor?: string;
      deployedBy?: string;
    },
    apiKey?: string
  ) => {
    let finalProjectId = data.projectId;

    if (apiKey) {
      const validated = await ApiKeyService.validate(apiKey);
      if (!validated) {
        throw new Error("Invalid API key");
      }
      finalProjectId = validated.projectId;
    }

    if (!finalProjectId) {
      throw new Error("projectId is required");
    }

    const now = new Date();
    const release = await ReleaseRepository.create({
      id: crypto.randomUUID(),
      projectId: finalProjectId,
      version: data.version,
      environment: data.environment || "production",
      url: data.url || null,
      commitSha: data.commitSha || null,
      commitMessage: data.commitMessage || null,
      commitAuthor: data.commitAuthor || null,
      deployedBy: data.deployedBy || null,
      deployedAt: now,
      createdAt: now,
    });

    logger.info("Release created", {
      releaseId: release.id,
      version: data.version,
      projectId: finalProjectId,
    });

    return release;
  },

  list: async (projectId: string, userId: string, limit: number = 20) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    return await ReleaseRepository.findByProjectId(projectId, limit);
  },

  findById: async (releaseId: string, userId: string) => {
    const release = await ReleaseRepository.findById(releaseId);
    if (!release) {
      throw new Error("Release not found");
    }

    const project = await ProjectRepository.findByIdWithOrg(release.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    return release;
  },

  delete: async (releaseId: string, userId: string) => {
    const release = await ReleaseRepository.findById(releaseId);
    if (!release) {
      throw new Error("Release not found");
    }

    const project = await ProjectRepository.findByIdWithOrg(release.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    await ReleaseRepository.delete(releaseId);
    logger.info("Release deleted", { releaseId });
    return { success: true };
  },
};

