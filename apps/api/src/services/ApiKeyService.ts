import { ApiKeyRepository } from "../repositories/ApiKeyRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { MemberRepository } from "../repositories/MemberRepository";
import {
  generateApiKey,
  getKeyPreview,
  getKeyPreviewParts,
  hashApiKey,
  invalidateCachedApiKey,
  validateApiKey as validateKey,
} from "./api-keys";
import logger from "../logger";

export const ApiKeyService = {
  list: async (projectId: string, userId: string) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    const keys = await ApiKeyRepository.findByProjectId(projectId);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      keyPreview: getKeyPreview({
        key: k.key,
        keyPrefix: k.keyPrefix,
        keyLast4: k.keyLast4,
      }),
    }));
  },

  create: async (projectId: string, name: string, userId: string) => {
    const project = await ProjectRepository.findByIdWithOrg(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    const key = generateApiKey("live");
    const keyHash = hashApiKey(key);
    const { keyPrefix, keyLast4 } = getKeyPreviewParts(key);
    const result = await ApiKeyRepository.create({
      id: crypto.randomUUID(),
      projectId,
      key: keyHash,
      keyPrefix,
      keyLast4,
      name,
      createdAt: new Date(),
    });

    logger.info("API key created", {
      keyId: result.id,
      projectId,
      userId,
    });

    return {
      id: result.id,
      key,
      name: result.name,
      createdAt: result.createdAt,
    };
  },

  delete: async (keyId: string, userId: string) => {
    const key = await ApiKeyRepository.findById(keyId);
    if (!key) {
      throw new Error("API key not found");
    }

    const project = await ProjectRepository.findByIdWithOrg(key.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    await ApiKeyRepository.delete(keyId);
    invalidateCachedApiKey(key.key);
    logger.info("API key deleted", { keyId, userId });
    return { success: true };
  },

  validate: validateKey,
};
