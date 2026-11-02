import { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../server/src/routers";

export const queryClient = new QueryClient();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: httpSubscriptionLink({
        url: "/trpc",
        eventSourceOptions: { withCredentials: true },
      }),
      false: httpBatchLink({
        url: "/trpc",
        fetch: (url, options) =>
          fetch(url, { ...options, credentials: "include" }),
      }),
    }),
  ],
});

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export type LoginResponse = Awaited<
  ReturnType<typeof trpcClient.auth.login.mutate>
>;
