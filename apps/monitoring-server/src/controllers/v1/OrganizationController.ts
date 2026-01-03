import type { AuthContext } from "../../types/context";
import { OrganizationService } from "../../services/OrganizationService";
import { canCreateOrganization } from "../../services/subscriptions";

export const canCreate = async (c: AuthContext) => {
  const userId = c.get("userId");
  const result = await canCreateOrganization(userId);
  return c.json(result);
};

export const getAll = async (c: AuthContext) => {
  const userId = c.get("userId");
  const orgs = await OrganizationService.getAll(userId);
  return c.json(orgs);
};

export const create = async (c: AuthContext) => {
  const userId = c.get("userId");
  const { name } = await c.req.json();

  try {
    const org = await OrganizationService.create(userId, name);
    return c.json(org);
  } catch (error: any) {
    if (error.message === "User already has an organization") {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: error.message || "Failed to create organization" }, 500);
  }
};

export const findById = async (c: AuthContext) => {
  const id = c.req.param("id");

  try {
    const org = await OrganizationService.findById(id);
    return c.json(org);
  } catch (error: any) {
    if (error.message === "Organization not found") {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: error.message || "Failed to get organization" }, 500);
  }
};

export const remove = async (c: AuthContext) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  try {
    const result = await OrganizationService.delete(userId, id);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return c.json({ error: error.message }, 403);
    }
    return c.json({ error: error.message || "Failed to delete organization" }, 500);
  }
};

