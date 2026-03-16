/**
 * Source Maps Service
 * @description Handles sourcemap storage and stack trace deobfuscation
 */
import { eq, and } from "drizzle-orm";
import { SourceMapConsumer, RawSourceMap } from "source-map";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../db/connection";
import { sourcemaps, releases, projects, organizationMembers } from "../db/schema";
import logger from "../logger";

// Storage configuration
const SOURCEMAPS_PATH = process.env.SOURCEMAPS_PATH || "/data/sourcemaps";

interface StackFrame {
  file: string;
  line: number;
  column?: number;
  function?: string;
}

interface MappedStackFrame extends StackFrame {
  originalFile?: string;
  originalLine?: number;
  originalColumn?: number;
  originalFunction?: string;
}

// Cache for loaded sourcemaps (LRU would be better for production)
const consumerCache = new Map<string, { consumer: SourceMapConsumer; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(projectId: string): Promise<string> {
  const dir = path.join(SOURCEMAPS_PATH, projectId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Generate unique filename for sourcemap
 */
function generateStoragePath(projectId: string, filename: string, hash: string): string {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  return path.join(SOURCEMAPS_PATH, projectId, `${name}-${hash.slice(0, 8)}${ext}.map`);
}

/**
 * Upload and store a sourcemap
 */
export async function uploadSourcemap(params: {
  projectId: string;
  userId: string;
  releaseVersion?: string;
  filename: string;
  content: string | Buffer;
}): Promise<{ id: string; filename: string; size: number }> {
  const { projectId, userId, releaseVersion, filename, content } = params;

  // Verify project exists
  const project = (await db
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId)))[0];

  if (!project) {
    throw new Error("Project not found");
  }

  // Skip user verification for API key uploads (already verified by API key middleware)
  if (userId !== "api-key-upload") {
    const membership = (await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, project.organizationId),
        eq(organizationMembers.userId, userId)
      )))[0];

    if (!membership) {
      throw new Error("Access denied");
    }
  }

  // Parse and validate sourcemap
  const contentStr = typeof content === "string" ? content : content.toString("utf-8");
  let sourcemapJson: RawSourceMap;

  try {
    sourcemapJson = JSON.parse(contentStr);
    if (sourcemapJson.version !== 3) {
      throw new Error("Only sourcemap version 3 is supported");
    }
  } catch (err) {
    throw new Error(`Invalid sourcemap format: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  // Calculate hash
  const fileHash = createHash("sha256").update(contentStr).digest("hex");
  const size = Buffer.byteLength(contentStr, "utf-8");

  // Find or create release if version specified
  let releaseId: string | null = null;
  if (releaseVersion) {
    const release = (await db
      .select({ id: releases.id })
      .from(releases)
      .where(and(
        eq(releases.projectId, projectId),
        eq(releases.version, releaseVersion)
      )))[0];

    if (release) {
      releaseId = release.id;
    }
  }

  // Store on filesystem
  await ensureStorageDir(projectId);
  const storagePath = generateStoragePath(projectId, filename, fileHash);
  await fs.writeFile(storagePath, contentStr, "utf-8");

  // Check if this sourcemap already exists
  const existing = (await db
    .select({ id: sourcemaps.id })
    .from(sourcemaps)
    .where(and(
      eq(sourcemaps.projectId, projectId),
      eq(sourcemaps.fileHash, fileHash)
    )))[0];

  if (existing) {
    // Update existing record
    await db.update(sourcemaps)
      .set({
        storagePath,
        size,
        releaseId,
        createdAt: new Date(),
      })
      .where(eq(sourcemaps.id, existing.id));

    return { id: existing.id, filename, size };
  }

  // Insert new record
  const id = crypto.randomUUID();
  await db.insert(sourcemaps).values({
    id,
    projectId,
    releaseId,
    filename,
    storagePath,
    fileHash,
    size,
    createdAt: new Date(),
  });

  logger.info("Sourcemap uploaded", { id, projectId, filename, size, releaseVersion });

  return { id, filename, size };
}

/**
 * Load sourcemap consumer with caching
 */
async function getSourceMapConsumer(projectId: string, filename: string): Promise<SourceMapConsumer | null> {
  const cacheKey = `${projectId}:${filename}`;
  const cached = consumerCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.consumer;
  }

  // Find matching sourcemap
  const sourcemap = (await db
    .select()
    .from(sourcemaps)
    .where(and(
      eq(sourcemaps.projectId, projectId),
      eq(sourcemaps.filename, filename)
    )))[0];

  if (!sourcemap) {
    return null;
  }

  try {
    const content = await fs.readFile(sourcemap.storagePath, "utf-8");
    const rawSourceMap: RawSourceMap = JSON.parse(content);
    const consumer = await new SourceMapConsumer(rawSourceMap);

    // Cache the consumer
    consumerCache.set(cacheKey, {
      consumer,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return consumer;
  } catch (err) {
    logger.error("Failed to load sourcemap", { error: err, projectId, filename });
    return null;
  }
}

/**
 * Parse a stack trace string into frames
 */
export function parseStackTrace(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  const lines = stack.split("\n");

  for (const line of lines) {
    // Chrome/Node format: "    at functionName (file.js:10:20)"
    const chromeMatch = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
    if (chromeMatch) {
      frames.push({
        function: chromeMatch[1] || undefined,
        file: chromeMatch[2],
        line: parseInt(chromeMatch[3], 10),
        column: parseInt(chromeMatch[4], 10),
      });
      continue;
    }

    // Firefox/Safari format: "functionName@file.js:10:20"
    const firefoxMatch = line.match(/(.+?)@(.+?):(\d+):(\d+)/);
    if (firefoxMatch) {
      frames.push({
        function: firefoxMatch[1] || undefined,
        file: firefoxMatch[2],
        line: parseInt(firefoxMatch[3], 10),
        column: parseInt(firefoxMatch[4], 10),
      });
      continue;
    }

    // Simple format: file:line
    const simpleMatch = line.match(/(.+?):(\d+)/);
    if (simpleMatch) {
      frames.push({
        file: simpleMatch[1].trim(),
        line: parseInt(simpleMatch[2], 10),
      });
    }
  }

  return frames;
}

/**
 * Apply sourcemap to a single stack frame
 */
async function applySourcemapToFrame(
  projectId: string,
  frame: StackFrame
): Promise<MappedStackFrame> {
  try {
    // Extract filename from path (handle URLs and paths)
    const filename = frame.file.split("/").pop()?.split("?")[0] || frame.file;

    const consumer = await getSourceMapConsumer(projectId, filename);
    if (!consumer) {
      return frame;
    }

    const original = consumer.originalPositionFor({
      line: frame.line,
      column: frame.column || 0,
    });

    if (original.source) {
      return {
        ...frame,
        originalFile: original.source,
        originalLine: original.line ?? undefined,
        originalColumn: original.column ?? undefined,
        originalFunction: original.name ?? undefined,
      };
    }

    return frame;
  } catch (err) {
    logger.error("Failed to apply sourcemap to frame", { error: err, frame });
    return frame;
  }
}

/**
 * Apply sourcemaps to an entire stack trace
 */
export async function applySourcemapsToStack(
  projectId: string,
  stack: string
): Promise<string> {
  const frames = parseStackTrace(stack);

  if (frames.length === 0) {
    return stack;
  }

  const mappedFrames = await Promise.all(
    frames.map((frame) => applySourcemapToFrame(projectId, frame))
  );

  // Reconstruct stack trace with original positions
  const lines: string[] = [];
  for (const frame of mappedFrames) {
    const file = frame.originalFile || frame.file;
    const line = frame.originalLine || frame.line;
    const column = frame.originalColumn || frame.column;
    const func = frame.originalFunction || frame.function;

    if (func) {
      lines.push(`    at ${func} (${file}:${line}${column ? `:${column}` : ""})`);
    } else {
      lines.push(`    at ${file}:${line}${column ? `:${column}` : ""}`);
    }

    // Add original location as comment if mapped
    if (frame.originalFile) {
      lines.push(`       // Mapped from ${frame.file}:${frame.line}`);
    }
  }

  return lines.join("\n");
}

/**
 * Delete sourcemap
 */
export async function deleteSourcemap(id: string, userId: string): Promise<void> {
  const sourcemap = (await db
    .select({
      id: sourcemaps.id,
      projectId: sourcemaps.projectId,
      storagePath: sourcemaps.storagePath,
    })
    .from(sourcemaps)
    .where(eq(sourcemaps.id, id)))[0];

  if (!sourcemap) {
    throw new Error("Sourcemap not found");
  }

  // Verify user has access
  const project = (await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, sourcemap.projectId)))[0];

  if (!project) {
    throw new Error("Project not found");
  }

  const membership = (await db
    .select()
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.organizationId, project.organizationId),
      eq(organizationMembers.userId, userId)
    )))[0];

  if (!membership) {
    throw new Error("Access denied");
  }

  // Delete file
  try {
    await fs.unlink(sourcemap.storagePath);
  } catch (err) {
    logger.warn("Failed to delete sourcemap file", { error: err, path: sourcemap.storagePath });
  }

  // Delete record
  await db.delete(sourcemaps).where(eq(sourcemaps.id, id));

  // Clear cache
  const filename = path.basename(sourcemap.storagePath);
  consumerCache.delete(`${sourcemap.projectId}:${filename}`);

  logger.info("Sourcemap deleted", { id });
}

/**
 * List sourcemaps for a project
 */
export async function listSourcemaps(projectId: string, userId: string) {
  // Verify user has access
  const project = (await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId)))[0];

  if (!project) {
    throw new Error("Project not found");
  }

  const membership = (await db
    .select()
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.organizationId, project.organizationId),
      eq(organizationMembers.userId, userId)
    )))[0];

  if (!membership) {
    throw new Error("Access denied");
  }

  return db
    .select({
      id: sourcemaps.id,
      filename: sourcemaps.filename,
      size: sourcemaps.size,
      releaseId: sourcemaps.releaseId,
      createdAt: sourcemaps.createdAt,
    })
    .from(sourcemaps)
    .where(eq(sourcemaps.projectId, projectId));
}

/**
 * Cleanup cache periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of consumerCache.entries()) {
    if (entry.expiresAt < now) {
      entry.consumer.destroy();
      consumerCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
