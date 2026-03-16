/**
 * Sourcemap Controller
 * @description Handles sourcemap file uploads with validation
 */
import type { AuthContext } from "../../types/context";
import type { Context } from "hono";
import { SourcemapService } from "../../services/SourcemapService";
import logger from "../../logger";

// === Constants ===
const ALLOWED_MIME_TYPES = [
  "application/json",
  "text/plain",
  "application/octet-stream",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_SOURCEMAP_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB for actual content

/**
 * Validate file type and size
 */
function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check MIME type
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `Invalid file type '${mimeType}'. Expected: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Validate sourcemap JSON structure
 */
function validateSourcemapContent(content: string): { isValid: boolean; error?: string } {
  // Check content size
  if (content.length > MAX_SOURCEMAP_CONTENT_SIZE) {
    return {
      isValid: false,
      error: `Sourcemap content too large. Maximum: ${MAX_SOURCEMAP_CONTENT_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    const parsed = JSON.parse(content);

    // Check required fields for sourcemap v3
    if (typeof parsed.version !== "number") {
      return { isValid: false, error: "Invalid sourcemap: missing 'version' field" };
    }

    if (parsed.version !== 3) {
      logger.warn("Non-standard sourcemap version", { version: parsed.version });
      // Still allow, just warn
    }

    if (!Array.isArray(parsed.sources) && typeof parsed.sources !== "undefined") {
      return { isValid: false, error: "Invalid sourcemap: 'sources' must be an array" };
    }

    if (typeof parsed.mappings !== "string" && typeof parsed.mappings !== "undefined") {
      return { isValid: false, error: "Invalid sourcemap: 'mappings' must be a string" };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid JSON format: ${error instanceof Error ? error.message : "Parse error"}`,
    };
  }
}

/**
 * Validate filename
 */
function validateFilename(filename: string): { isValid: boolean; error?: string } {
  // Check for path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return { isValid: false, error: "Invalid filename: path traversal not allowed" };
  }

  // Check extension
  const validExtensions = [".map", ".js.map", ".css.map", ".json"];
  const hasValidExtension = validExtensions.some((ext) => filename.toLowerCase().endsWith(ext));

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Invalid filename extension. Expected: ${validExtensions.join(", ")}`,
    };
  }

  // Check length
  if (filename.length > 255) {
    return { isValid: false, error: "Filename too long. Maximum: 255 characters" };
  }

  return { isValid: true };
}

export const upload = async (c: Context) => {
  const apiKeyHeader = c.req.header("X-API-Key");

  if (!apiKeyHeader) {
    return c.json({ error: "API key required", code: "MISSING_API_KEY" }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const filename = formData.get("filename") as string;
    const releaseVersion = formData.get("release") as string;

    // Validate required fields
    if (!file || !filename) {
      logger.warn("Missing file or filename in sourcemap upload");
      return c.json(
        { error: "file and filename are required", code: "MISSING_FIELDS" },
        400
      );
    }

    // Validate filename
    const filenameValidation = validateFilename(filename);
    if (!filenameValidation.isValid) {
      logger.warn("Invalid filename in sourcemap upload", { filename, error: filenameValidation.error });
      return c.json(
        { error: filenameValidation.error, code: "INVALID_FILENAME" },
        400
      );
    }

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      logger.warn("Invalid file in sourcemap upload", { filename, error: fileValidation.error });
      return c.json(
        { error: fileValidation.error, code: "INVALID_FILE" },
        400
      );
    }

    // Read and validate content
    const content = await file.text();
    const contentValidation = validateSourcemapContent(content);
    if (!contentValidation.isValid) {
      logger.warn("Invalid sourcemap content", { filename, error: contentValidation.error });
      return c.json(
        { error: contentValidation.error, code: "INVALID_SOURCEMAP" },
        400
      );
    }

    // Upload validated file
    const result = await SourcemapService.upload(
      apiKeyHeader,
      file,
      filename,
      releaseVersion || undefined
    );

    logger.info("Sourcemap uploaded successfully", {
      id: result.id,
      filename,
      size: Math.round(content.length / 1024),
    });

    return c.json(result);
  } catch (error: any) {
    if (error.message === "Invalid API key") {
      return c.json({ error: error.message, code: "INVALID_API_KEY" }, 401);
    }

    logger.error("Failed to upload sourcemap", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    return c.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      500
    );
  }
};

export const list = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");

  if (!projectId) {
    return c.json(
      { error: "projectId query parameter required", code: "MISSING_PROJECT_ID" },
      400
    );
  }

  try {
    const sourcemaps = await SourcemapService.list(projectId as string, userId);
    return c.json(sourcemaps);
  } catch (error: any) {
    if (error.message === "Project not found" || error.message === "Access denied") {
      return c.json({ error: error.message, code: "FORBIDDEN" }, 403);
    }

    logger.error("Failed to list sourcemaps", {
      error: error.message,
      projectId,
    });

    return c.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      500
    );
  }
};

export const remove = async (c: AuthContext) => {
  const userId = c.get("userId");
  const sourcemapId = c.req.param("id");

  try {
    const result = await SourcemapService.delete(sourcemapId, userId);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Sourcemap not found") {
      return c.json({ error: error.message, code: "NOT_FOUND" }, 404);
    }
    if (error.message === "Access denied") {
      return c.json({ error: error.message, code: "FORBIDDEN" }, 403);
    }

    logger.error("Failed to delete sourcemap", {
      error: error.message,
      sourcemapId,
    });

    return c.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      500
    );
  }
};

/**
 * Deobfuscate a stack trace using uploaded sourcemaps
 */
export const deobfuscate = async (c: AuthContext) => {
  const userId = c.get("userId");

  try {
    const { projectId, stack } = await c.req.json();

    if (!projectId || !stack) {
      return c.json(
        { error: "projectId and stack are required", code: "MISSING_FIELDS" },
        400
      );
    }

    // Verify access to project
    const project = await import("../../repositories/ProjectRepository").then(
      m => m.ProjectRepository.findByIdWithOrg(projectId)
    );
    if (!project) {
      return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
    }

    const membership = await import("../../repositories/MemberRepository").then(
      m => m.MemberRepository.findMemberByOrgAndUser(project.organizationId, userId)
    );
    if (!membership) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    // Deobfuscate the stack trace
    const frames = await SourcemapService.deobfuscateStackTrace(projectId, stack);

    return c.json({ frames });
  } catch (error: any) {
    logger.error("Failed to deobfuscate stack trace", {
      error: error.message,
    });

    return c.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      500
    );
  }
};
