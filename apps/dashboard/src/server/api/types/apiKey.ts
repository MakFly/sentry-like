export type ApiKey = {
  id: string;
  name: string;
  keyPreview?: string;
  key?: string; // Only returned on creation
  createdAt: Date;
  lastUsedAt: Date | null;
};

