import type { AuthContext } from "../../types/context";
import { UserProfileService } from "../../services/UserProfileService";

export const getProfile = async (c: AuthContext) => {
  const userId = c.get("userId");

  try {
    const profile = await UserProfileService.getProfile(userId);
    return c.json(profile);
  } catch (error: any) {
    if (error.message === "User not found") {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: error.message || "Failed to get profile" }, 500);
  }
};

export const updateProfile = async (c: AuthContext) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  try {
    const result = await UserProfileService.updateProfile(userId, {
      name: body.name,
      image: body.image,
    });
    return c.json(result);
  } catch (error: any) {
    if (error.message === "User not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "No valid fields to update") {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: error.message || "Failed to update profile" }, 500);
  }
};

export const getSessions = async (c: AuthContext) => {
  const userId = c.get("userId");

  try {
    const sessions = await UserProfileService.getSessions(userId);
    return c.json(sessions);
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to get sessions" }, 500);
  }
};

export const revokeSession = async (c: AuthContext) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");

  try {
    const result = await UserProfileService.revokeSession(userId, sessionId);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Session not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Unauthorized") {
      return c.json({ error: error.message }, 403);
    }
    return c.json({ error: error.message || "Failed to revoke session" }, 500);
  }
};

export const revokeAllSessions = async (c: AuthContext) => {
  const userId = c.get("userId");
  // Get current session token from the request to exclude it
  const session = (c as any).get("session");
  const currentToken = session?.session?.token;

  try {
    const result = await UserProfileService.revokeAllSessions(userId, currentToken);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to revoke sessions" }, 500);
  }
};

export const canChangePassword = async (c: AuthContext) => {
  const userId = c.get("userId");

  try {
    const result = await UserProfileService.canChangePassword(userId);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to check password status" }, 500);
  }
};
