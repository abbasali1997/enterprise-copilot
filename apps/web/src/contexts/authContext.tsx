import { TRPCClientError } from "@trpc/client";
import { createContext, useCallback, useState, type ReactNode } from "react";
import { trpcClient, useTRPC } from "@/lib/trpc.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type User = Awaited<ReturnType<typeof trpcClient.auth.me.query>>;

type AuthContextValueType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValueType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(() => ({
    active: true,
    version: 0,
  }));

  const baseQueryKey = trpc.auth.me.queryKey();
  const queryKey = [...baseQueryKey, { session: session.version }];

  const {
    data: me,
    error,
    isPending,
  } = useQuery<User>({
    queryKey,
    enabled: session.active,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      try {
        return await trpcClient.auth.me.query(undefined, { signal });
      } catch (error) {
        if (signal.aborted) throw error;
        console.error("Could not get authenticated user:", error);
        throw error;
      }
    },
  });

  const setUser = useCallback(
    (nextUser: User | null) => {
      const nextSession = {
        active: !!nextUser,
        version: session.version + 1,
      };
      const baseKey = trpc.auth.me.queryKey();
      void queryClient.cancelQueries({ queryKey: baseKey });
      // Seed a new session's cache; old requests only affect their previous key.
      queryClient.setQueryData<User | null>(
        [...baseKey, { session: nextSession.version }],
        nextUser,
      );
      setSession(nextSession);
    },
    [queryClient, trpc, session.version],
  );

  const unauthorized =
    error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED";
  const user = session.active && !unauthorized ? (me ?? null) : null;

  return (
    <AuthContext.Provider
      value={{ user, setUser, isLoading: session.active && isPending }}
    >
      {children}
    </AuthContext.Provider>
  );
};
