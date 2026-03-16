/**
 * tRPC React client
 * @see https://trpc.io/docs/client/react
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();
