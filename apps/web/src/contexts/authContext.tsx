import { createContext, useCallback, useEffect, type ReactNode } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type User = { email: string; id: string; name: string };

type AuthContextValueType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValueType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const hasToken = !!localStorage.getItem("token");

  const { data: me, error } = useQuery({
    ...trpc.auth.me.queryOptions(),
    enabled: hasToken,
    retry: false,
  });

  const unauthorized = error?.data?.code === "UNAUTHORIZED";
  const user = hasToken && !unauthorized ? (me ?? null) : null;

  const setUser = useCallback(
    (nextUser: User | null) => {
      if (!nextUser) {
        localStorage.removeItem("token");
      }
      const queryKey = trpc.auth.me.queryKey();
      // Prevent an older in-flight response from undoing login or logout.
      void queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<User | null>(queryKey, nextUser);
    },
    [queryClient, trpc],
  );

  useEffect(() => {
    if (!error) return;
    console.error("Could not get authenticated user:", error);

    if (error.data?.code === "UNAUTHORIZED") {
      localStorage.removeItem("token");
    }
  }, [error]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
