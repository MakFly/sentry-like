import type { AuthContext } from "../../types/context";
import { GroupService } from "../../services/GroupService";
import type { IssueStatus } from "../../types/services";
import { verifyProjectAccess } from "../../services/project-access";
import logger from "../../logger";

export const getAll = async (c: AuthContext) => {
  const userId = c.get("userId");
  const env = c.req.query("env");
  const dateRange = c.req.query("dateRange") as "24h" | "7d" | "30d" | "90d" | "all" | undefined;
  const projectId = c.req.query("projectId") as string | undefined;

  if (projectId) {
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access groups without project permission", { userId, projectId });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/groups", { env, dateRange, projectId });
  const groups = await GroupService.getAll({ env, dateRange }, projectId);
  return c.json(groups);
};

export const getById = async (c: AuthContext) => {
  const userId = c.get("userId");
  const fingerprint = c.req.param("fingerprint");

  logger.debug("GET /api/v1/groups/:fingerprint", { fingerprint });
  const group = await GroupService.getById(fingerprint);

  if (!group) {
    logger.warn("Group not found", { fingerprint });
    return c.json({ error: "Group not found" }, 404);
  }

  if (group.projectId) {
    const hasAccess = await verifyProjectAccess(group.projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access group without project permission", {
        userId,
        fingerprint,
        projectId: group.projectId,
      });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  return c.json(group);
};

export const getEvents = async (c: AuthContext) => {
  const userId = c.get("userId");
  const fingerprint = c.req.param("fingerprint");
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);

  const group = await GroupService.getById(fingerprint);
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  if (group.projectId) {
    const hasAccess = await verifyProjectAccess(group.projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access group events without project permission", {
        userId,
        fingerprint,
        projectId: group.projectId,
      });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/groups/:fingerprint/events", { fingerprint, page, limit });
  const result = await GroupService.getEvents(fingerprint, page, limit);
  return c.json(result);
};

export const getTimeline = async (c: AuthContext) => {
  const userId = c.get("userId");
  const fingerprint = c.req.param("fingerprint");

  const group = await GroupService.getById(fingerprint);
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  if (group.projectId) {
    const hasAccess = await verifyProjectAccess(group.projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access group timeline without project permission", {
        userId,
        fingerprint,
        projectId: group.projectId,
      });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/groups/:fingerprint/timeline", { fingerprint });
  const timeline = await GroupService.getTimeline(fingerprint);
  return c.json(timeline);
};

export const updateStatus = async (c: AuthContext) => {
  const userId = c.get("userId");
  const fingerprint = c.req.param("fingerprint");
  const { status } = await c.req.json() as { status: IssueStatus };

  logger.info("PATCH /api/v1/groups/:fingerprint/status", { fingerprint, status, userId });

  if (!["open", "resolved", "ignored"].includes(status)) {
    return c.json({ error: "Invalid status. Must be: open, resolved, or ignored" }, 400);
  }

  const group = await GroupService.getById(fingerprint);
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  if (group.projectId) {
    const hasAccess = await verifyProjectAccess(group.projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to update group status without project permission", {
        userId,
        fingerprint,
        projectId: group.projectId,
      });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  const result = await GroupService.updateStatus(fingerprint, status, userId);
  if (!result) {
    return c.json({ error: "Group not found" }, 404);
  }

  return c.json(result);
};

export const updateAssignment = async (c: AuthContext) => {
  const userId = c.get("userId");
  const fingerprint = c.req.param("fingerprint");
  const { assignedTo } = await c.req.json() as { assignedTo: string | null };

  logger.info("PATCH /api/v1/groups/:fingerprint/assign", { fingerprint, assignedTo, userId });

  const group = await GroupService.getById(fingerprint);
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  if (group.projectId) {
    const hasAccess = await verifyProjectAccess(group.projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to assign group without project permission", {
        userId,
        fingerprint,
        projectId: group.projectId,
      });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  const result = await GroupService.updateAssignment(fingerprint, assignedTo);
  if (!result) {
    return c.json({ error: "Group not found" }, 404);
  }

  return c.json(result);
};

export const getReleases = async (c: AuthContext) => {
  const userId = c.get("userId");
  const fingerprint = c.req.param("fingerprint");

  const group = await GroupService.getById(fingerprint);
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  if (group.projectId) {
    const hasAccess = await verifyProjectAccess(group.projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access group releases without project permission", {
        userId,
        fingerprint,
        projectId: group.projectId,
      });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/groups/:fingerprint/releases", { fingerprint });
  const releases = await GroupService.getReleases(fingerprint);
  return c.json(releases);
};

