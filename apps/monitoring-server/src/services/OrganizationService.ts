import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { canCreateOrganization } from "./subscriptions";

export const OrganizationService = {
  getAll: async (userId: string) => {
    return await OrganizationRepository.findByUserId(userId);
  },

  create: async (userId: string, name: string) => {
    const subscriptionCheck = await canCreateOrganization(userId);
    if (!subscriptionCheck.allowed) {
      throw new Error(`Subscription limit reached: ${subscriptionCheck.reason}`);
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const org = await OrganizationRepository.create({
      id: crypto.randomUUID(),
      name,
      slug,
      createdAt: new Date(),
    });

    await OrganizationRepository.createMembership({
      id: crypto.randomUUID(),
      organizationId: org.id,
      userId,
      role: "owner",
      createdAt: new Date(),
    });

    return org;
  },

  findById: async (id: string) => {
    const org = await OrganizationRepository.findById(id);
    if (!org) {
      throw new Error("Organization not found");
    }
    return org;
  },

  delete: async (userId: string, id: string) => {
    const member = await OrganizationRepository.findOwnerByOrgId(id, userId);
    if (!member) {
      throw new Error("Unauthorized");
    }

    await OrganizationRepository.delete(id);
    return { success: true };
  },
};
