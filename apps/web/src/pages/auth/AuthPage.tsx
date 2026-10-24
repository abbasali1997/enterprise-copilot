import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { useNavigate } from "react-router-dom";
import { useTRPC, type LoginResponse } from "@/lib/trpc.ts";
import { useMutation } from "@tanstack/react-query";
import Login from "@/components/auth/Login.tsx";
import WorkplaceSelection from "@/components/auth/WorkplaceSelection.tsx";

type WorkspaceSelection = Extract<
  LoginResponse,
  { status: "workspace_selection_required" }
>;
type AuthenticatedResponse = Extract<
  LoginResponse,
  { status: "authenticated" }
>;

const AuthPage = () => {
  const trpc = useTRPC();
  const value = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [workspaceSelection, setWorkspaceSelection] =
    useState<WorkspaceSelection | null>(null);
  const navigate = useNavigate();

  const completeAuthentication = (data: AuthenticatedResponse) => {
    setIsRedirecting(true);
    localStorage.setItem("token", data.accessToken);
    value?.setUser({ ...data.user, organization: data.workspace });
    setTimeout(() => navigate("/home", { replace: true }), 2000);
  };

  const selectOrganization = useMutation(
    trpc.organization.selectOrganization.mutationOptions({
      onSuccess: completeAuthentication,
    }),
  );

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: (data) => {
        if (data.status === "workspace_selection_required") {
          localStorage.removeItem("token");
          value?.setUser(null);
          setPassword("");
          selectOrganization.reset();
          setWorkspaceSelection(data);
          return;
        }
        completeAuthentication(data);
      },
      onError: (error) => console.error(error),
    }),
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (login.isPending || isRedirecting) return;
    login.mutate({ email, password });
  };

  const handleWorkspaceProceed = (organizationId: string) => {
    if (!workspaceSelection || selectOrganization.isPending || isRedirecting)
      return;
    selectOrganization.mutate({
      organizationId,
      selectionToken: workspaceSelection.selectionToken,
    });
  };

  return (
    <div
      id="bg-area"
      className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-20 text-gray-900 dark:bg-slate-950 dark:text-slate-100"
    >
      {workspaceSelection ? (
        <WorkplaceSelection
          workspaceList={workspaceSelection.workspaces}
          onBack={() => {
            setWorkspaceSelection(null);
            selectOrganization.reset();
          }}
          onProceed={handleWorkspaceProceed}
          isPending={selectOrganization.isPending}
          isRedirecting={isRedirecting}
          error={selectOrganization.error?.message}
        />
      ) : (
        <Login
          handleSubmit={handleSubmit}
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          isRedirecting={isRedirecting}
          isPending={login.isPending}
        />
      )}
    </div>
  );
};

export default AuthPage;
