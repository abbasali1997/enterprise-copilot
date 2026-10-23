import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/authContext.tsx";
import { useTRPC } from "@/lib/trpc.ts";
import WorkplaceSelection from "@/components/auth/WorkplaceSelection.tsx";

function ChangeWorkspacePage() {
  const auth = useContext(AuthContext);
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const workspaces = useQuery({
    ...trpc.organization.list.queryOptions(),
    enabled: !!auth?.user,
  });

  const change = useMutation(
    trpc.organization.changeOrganization.mutationOptions({
      onSuccess: async (data) => {
        setIsRedirecting(true);
        await queryClient.cancelQueries();
        queryClient.removeQueries({
          predicate: (query) =>
            !(
              Array.isArray(query.queryKey[0]) &&
              query.queryKey[0].join(".") === "organization.list"
            ),
        });
        localStorage.setItem("token", data.accessToken);
        auth?.setUser({ ...data.user, organization: data.workspace });
        setTimeout(() => navigate("/", { replace: true }), 2000);
      },
    }),
  );

  if (auth?.isLoading)
    return (
      <p role="status" className="p-8">
        Checking your session...
      </p>
    );
  if (!auth?.user) return <Navigate to="/login" replace />;
  return (
    <div
      id="bg-area"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
    >
      {workspaces.isPending ? (
        <p role="status">Loading workspaces...</p>
      ) : workspaces.isError ? (
        <div role="alert" className="rounded-xl bg-white p-6">
          <p>{workspaces.error.message}</p>
          <button
            type="button"
            onClick={() => void workspaces.refetch()}
            className="mt-4 text-indigo-600"
          >
            Try again
          </button>
        </div>
      ) : (
        <WorkplaceSelection
          workspaceList={workspaces.data}
          initialWorkspaceId={auth.user.organization.id}
          backLabel="Back to chat"
          onBack={() => navigate("/")}
          onProceed={(organizationId) => {
            if (!change.isPending && !isRedirecting)
              change.mutate({ organizationId });
          }}
          isPending={change.isPending}
          isRedirecting={isRedirecting}
          error={change.error?.message}
        />
      )}
    </div>
  );
}
export default ChangeWorkspacePage;
