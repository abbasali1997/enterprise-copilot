import { AuthContext } from "@/contexts/authContext.tsx";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import AppSidebar from "@/components/sidebar/Sidebar.tsx";
import WorkspaceHeader, {
  type WorkspaceTab,
} from "@/components/workspace/WorkspaceHeader.tsx";
import { useContext, useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import WorkspaceMembers from "@/components/workspace/workspaceMembers/WorkspaceMembers.tsx";
import MemberAccessModal from "@/components/workspace/workspaceMembers/MemberAccessModal.tsx";
import WorkspaceSettings from "@/components/workspace/workspaceSettings/WorkspaceSettings.tsx";
import WorkspaceDocuments from "@/components/workspace/workspaceDocuments/WorkspaceDocuments.tsx";

function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("members");

  const [accessMember, setAccessMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext);
  const trpc = useTRPC();

  const organizationId = auth?.user?.organization.id;

  const workspaceQueryKey: [string[], { input: unknown; type: "query" }] = [
    trpc.organization.getActive.queryKey()[0],
    {
      input: {
        userId: auth?.user?.id,
        organizationId: auth?.user?.organization.id,
      },
      type: "query",
    },
  ];

  const { data: organization } = useQuery({
    ...trpc.organization.getActive.queryOptions(),
    queryKey: workspaceQueryKey,
    enabled: !!auth?.user && organizationId === auth.user.organization.id,
  });

  const membersQueryKey: [string[], { input: unknown; type: "query" }] = [
    trpc.organization.getMembers.queryKey()[0],
    workspaceQueryKey[1],
  ];

  const documetsQueryKey: [string[], { input: unknown; type: "query" }] = [
    trpc.documents.getDocuments.queryKey()[0],
    workspaceQueryKey[1],
  ];

  const canViewMembers =
    !!auth?.user && can(auth.user.organization.role, PERMISSIONS.MEMBER_VIEW);
  const membersQuery = useQuery({
    ...trpc.organization.getMembers.queryOptions(),
    queryKey: membersQueryKey,
    enabled: !!organizationId && canViewMembers && activeTab === "members",
  });

  const canViewDocuments =
    !!auth?.user && can(auth.user.organization.role, PERMISSIONS.DOCUMENT_VIEW);
  const documentsQuery = useQuery({
    ...trpc.documents.getDocuments.queryOptions(),
    queryKey: documetsQueryKey,
    enabled: !!organizationId && canViewDocuments && activeTab === "documents",
  });

  const signedInMember = membersQuery.data?.find(
    (member) => member.userId === auth?.user?.id,
  );
  const canSuspend =
    !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_SUSPEND);
  const canRemove =
    !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_REMOVE);

  const updateMember = useMutation(
    trpc.organization.updateMember.mutationOptions({
      onSuccess: () => {
        setAccessMember(null);
        return queryClient.invalidateQueries({
          queryKey: membersQueryKey,
        });
      },
    }),
  );

  const onActivate = (member: { id: string }) => {
    if (!organizationId || updateMember.isPending) return;
    updateMember.reset();
    updateMember.mutate({
      memberId: member.id,
      membershipStatus: "ACTIVE",
    });
  };

  const onManageAccess = (membershipStatus: "REMOVED" | "SUSPENDED") => {
    if (!organizationId || !accessMember || updateMember.isPending) return;
    updateMember.reset();
    updateMember.mutate({
      memberId: accessMember.id,
      membershipStatus,
    });
  };

  return (
    <div className="w-full h-screen grid grid-cols-10 overflow-hidden">
      {accessMember && (
        <MemberAccessModal
          memberName={accessMember.name}
          canSuspend={canSuspend}
          canRemove={canRemove}
          isPending={updateMember.isPending}
          error={updateMember.error?.message}
          onConfirm={onManageAccess}
          onClose={() => {
            if (!updateMember.isPending) setAccessMember(null);
          }}
        />
      )}
      {!accessMember && updateMember.isError && (
        <div
          role="alert"
          className="fixed right-6 top-6 z-50 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg"
        >
          {updateMember.error.message}
          <button
            type="button"
            onClick={() => updateMember.reset()}
            className="ml-4 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="col-span-2 min-h-0 min-w-0">
        <AppSidebar />
      </div>
      {organization ? (
        <main id="bg-area" className="col-span-8 min-h-0 min-w-0 w-full h-full">
          <div id="bg-container" className="w-full h-full">
            <div className="w-full h-full grid grid-rows-15 p-5 gap-5">
              <div className="min-h-0 row-span-4">
                <WorkspaceHeader
                  name={organization?.name}
                  logo={organization.logoUrl ?? undefined}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>

              <div className="min-h-0 min-w-0 row-span-11">
                {activeTab === "overview" && (
                  <section aria-label="Workspace overview">
                    {/* Add the Overview component here. */}
                  </section>
                )}
                {activeTab === "members" &&
                  canViewMembers &&
                  membersQuery.isSuccess && (
                    <WorkspaceMembers
                      organizationName={organization.name}
                      members={membersQuery.data ?? []}
                      onActivate={onActivate}
                      onManageAccess={(member) => {
                        if (updateMember.isPending) return;
                        updateMember.reset();
                        setAccessMember({
                          id: member.id,
                          name: member.user.name,
                        });
                      }}
                    />
                  )}
                {activeTab === "members" && !canViewMembers && (
                  <p role="alert">
                    You do not have permission to view members.
                  </p>
                )}
                {activeTab === "members" &&
                  canViewMembers &&
                  membersQuery.isPending && (
                    <p role="status">Loading members...</p>
                  )}
                {activeTab === "members" &&
                  canViewMembers &&
                  membersQuery.isError && (
                    <p role="alert">{membersQuery.error.message}</p>
                  )}
                {activeTab === "documents" &&
                  canViewDocuments &&
                  documentsQuery.isSuccess && (
                    <WorkspaceDocuments
                      documents={documentsQuery.data ?? []}
                      onAddToDocumentList={() => {}}
                      organizationName={organization.name}
                    />
                  )}
                {activeTab === "settings" && (
                  <WorkspaceSettings
                    key={organization.id}
                    organizationName={organization.name}
                    logoUrl={organization.logoUrl}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <></>
      )}
    </div>
  );
}

export default WorkspacePage;
