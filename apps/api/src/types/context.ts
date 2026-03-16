import type { Context } from "hono";
import type { AppEnv } from "./hono";

export type AuthContext = Context<AppEnv>;
export type ApiKeyContext = Context<AppEnv>;
