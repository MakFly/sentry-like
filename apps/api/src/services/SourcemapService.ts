/**
 * Sourcemap Service (Legacy wrapper)
 * @description Wraps the new sourcemaps service for controller compatibility
 */
import { ApiKeyService } from "./ApiKeyService";
import {
  uploadSourcemap,
  listSourcemaps,
  deleteSourcemap,
  parseStackTrace,
  applySourcemapsToStack,
} from "./sourcemaps";
import logger from "../logger";

// Types for deobfuscated stack frames
export interface StackFrame {
  filename: string;
  line: number;
  column?: number;
  function?: string;
}

export interface DeobfuscatedFrame {
  original: StackFrame;
  deobfuscated: {
    filename: string;
    line: number;
    column: number;
    function: string | null;
    sourceContent?: string[];
  } | null;
}

export const SourcemapService = {
  /**
   * Upload a sourcemap file (via API key authentication)
   */
  upload: async (
    apiKey: string,
    file: File,
    filename: string,
    releaseVersion?: string
  ) => {
    // Validate API key
    const validated = await ApiKeyService.validate(apiKey);
    if (!validated) {
      throw new Error("Invalid API key");
    }

    // Read file content
    const content = await file.text();

    // Use new upload function (needs a dummy userId for API key uploads)
    // For API key uploads, we bypass user verification since we already verified the key
    const result = await uploadSourcemap({
      projectId: validated.projectId,
      userId: "api-key-upload", // Special marker for API key uploads
      releaseVersion,
      filename,
      content,
    });

    return result;
  },

  /**
   * List sourcemaps for a project
   */
  list: async (projectId: string, userId: string) => {
    return listSourcemaps(projectId, userId);
  },

  /**
   * Delete a sourcemap
   */
  delete: async (sourcemapId: string, userId: string) => {
    await deleteSourcemap(sourcemapId, userId);
    return { success: true };
  },

  /**
   * Parse a stack trace string into structured frames
   */
  parseStackTrace: (stack: string): StackFrame[] => {
    const frames = parseStackTrace(stack);
    return frames.map(f => ({
      filename: f.file,
      line: f.line,
      column: f.column,
      function: f.function,
    }));
  },

  /**
   * Deobfuscate an entire stack trace
   */
  deobfuscateStackTrace: async (
    projectId: string,
    stack: string
  ): Promise<DeobfuscatedFrame[]> => {
    const originalFrames = parseStackTrace(stack);
    const deobfuscatedStack = await applySourcemapsToStack(projectId, stack);
    const deobfuscatedFrames = parseStackTrace(deobfuscatedStack);

    // Match original to deobfuscated
    return originalFrames.map((original, i) => {
      const deobfuscated = deobfuscatedFrames[i];
      const hasMapping = deobfuscated &&
        (deobfuscated.file !== original.file ||
         deobfuscated.line !== original.line);

      return {
        original: {
          filename: original.file,
          line: original.line,
          column: original.column,
          function: original.function,
        },
        deobfuscated: hasMapping ? {
          filename: deobfuscated.file,
          line: deobfuscated.line,
          column: deobfuscated.column || 0,
          function: deobfuscated.function || null,
        } : null,
      };
    });
  },
};
