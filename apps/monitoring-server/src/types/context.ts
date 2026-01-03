import type { Context } from "hono";

export type AuthContext = Context & {
  var: {
    userId: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  };
};

export type ApiKeyContext = Context & {
  var: {
    apiKey: {
      id: string;
      projectId: string;
    };
  };
};

