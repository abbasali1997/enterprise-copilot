import AppSidebar from "@/components/sidebar/Sidebar.tsx";
import WorkspaceHeader, {
  type WorkspaceTab,
} from "@/components/workspace/WorkspaceHeader.tsx";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers.tsx";

function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("members");
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

  return (
    <div className="w-full h-screen grid grid-cols-9 overflow-hidden">
      <div className="col-span-2 min-h-0 min-w-0">
        <AppSidebar />
      </div>
      {organization ? (
        <main id="bg-area" className="col-span-7 min-h-0 min-w-0 w-full h-full">
          <div
            id="bg-container"
            className="w-full h-full grid grid-rows-10 p-8 gap-5"
          >
            <div className="row-span-3">
              <WorkspaceHeader
                name={organization?.name}
                logo={organization.logoUrl ?? undefined}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            <div className="row-span-7 min-h-0 min-w-0">
              {activeTab === "overview" && (
                <section aria-label="Workspace overview">
                  {/* Add the Overview component here. */}
                </section>
              )}
              {activeTab === "members" && (
                <WorkspaceMembers members={organization.members} />
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
