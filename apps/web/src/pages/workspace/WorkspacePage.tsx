import { AuthContext } from "@/contexts/authContext.tsx";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import AppSidebar from "@/components/sidebar/Sidebar.tsx";
import WorkspaceHeader, {
  type WorkspaceTab,
} from "@/components/workspace/WorkspaceHeader.tsx";
import { useCallback, useContext, useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers.tsx";
import AddMemberModal from "@/components/workspace/AddMemberModal.tsx";
import MemberAccessModal from "@/components/workspace/MemberAccessModal.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("members");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const openAddMember = useCallback(() => setIsAddMemberOpen(true), []);
  const closeAddMember = useCallback(() => setIsAddMemberOpen(false), []);

  const [accessMember, setAccessMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext);
  const trpc = useTRPC();
  const organizationId = useParams().organizationId;

  const {
    data: organization,
    // isPending,
    // error,
  } = useQuery({
    ...trpc.organization.getById.queryOptions({
      organizationId: organizationId ?? "",
    }),
    enabled: !!organizationId,
  });

  const signedInMember = organization?.members.find((member) => member.userId === auth?.user?.id);
  const canSuspend = !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_SUSPEND);
  const canRemove = !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_REMOVE);

  const updateMember = useMutation(
    trpc.organization.updateMember.mutationOptions({
      onSuccess: () => {
        setAccessMember(null);
        return queryClient.invalidateQueries({
          queryKey: trpc.organization.getById.queryKey({
            organizationId: organizationId ?? "",
          }),
        });
      },
    }),
  );

  const onActivate = (member: { id: string }) => {
    if (!organizationId || updateMember.isPending) return;
    updateMember.reset();
    updateMember.mutate({
      organizationId,
      memberId: member.id,
      membershipStatus: "ACTIVE",
    });
  };

  const onManageAccess = (membershipStatus: "REMOVED" | "SUSPENDED") => {
    if (!organizationId || !accessMember || updateMember.isPending) return;
    updateMember.reset();
    updateMember.mutate({
      organizationId,
      memberId: accessMember.id,
      membershipStatus,
    });
  };

  return (
    <div className="w-full h-screen grid grid-cols-9 overflow-hidden">
      {organization && isAddMemberOpen ? (
        <AddMemberModal
          organizationName={organization.name}
          onClose={closeAddMember}
        />
      ) : null}

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
        <main id="bg-area" className="col-span-7 min-h-0 min-w-0 w-full h-full">
          <div
            id="bg-container"
            className="w-full h-full grid grid-rows-[auto_minmax(0,3fr)_minmax(0,7fr)] p-6 gap-6"
          >
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-3 text-lg text-gray-600">
                <li>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                    Workspace Dashboard
                  </Link>
                </li>
                <li aria-hidden="true">
                  <FontAwesomeIcon icon={faChevronRight} />
                </li>
                <li
                  aria-current="page"
                  className="font-medium capitalize text-gray-900"
                >
                  {activeTab}
                </li>
              </ol>
            </nav>
            <div className="min-h-0">
              <WorkspaceHeader
                name={organization?.name}
                logo={organization.logoUrl ?? undefined}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            <div className="min-h-0 min-w-0">
              {activeTab === "overview" && (
                <section aria-label="Workspace overview">
                  {/* Add the Overview component here. */}
                </section>
              )}
              {activeTab === "members" && (
                <WorkspaceMembers
                  members={organization.members}
                  onAddMember={openAddMember}
                  onActivate={onActivate}
                  onManageAccess={(member) => {
                    if (updateMember.isPending) return;
                    updateMember.reset();
                    setAccessMember({ id: member.id, name: member.user.name });
                  }}
                />
              )}
              {activeTab === "settings" && (
                <section aria-label="Workspace settings">
                  {/* Add the Settings component here. */}
                </section>
              )}
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
