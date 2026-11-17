import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import { AuthContext } from "@/contexts/authContext.tsx";
import { useTRPC } from "@/lib/trpc.ts";
import CreateGroupModal from "./CreateGroupModal.tsx";

export default function WorkspaceGroups() {
  const auth = useContext(AuthContext);
  const trpc = useTRPC();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canView =
    !!auth?.user && can(auth.user.organization.role, PERMISSIONS.GROUP_VIEW);
  const canCreate =
    !!auth?.user && can(auth.user.organization.role, PERMISSIONS.GROUP_CREATE);

  const groups = useQuery({
    ...trpc.organization.getGroups.queryOptions(),
    queryKey: [
      trpc.organization.getGroups.queryKey()[0],
      {
        input: {
          userId: auth?.user?.id,
          organizationId: auth?.user?.organization.id,
        },
        type: "query",
      },
    ],
    enabled: canView,
  });

  if (!canView)
    return (
      <p role="alert">You do not have permission to view workspace groups.</p>
    );

  return (
    <section
      aria-label="Workspace groups"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white p-5 dark:bg-slate-800 dark:text-slate-100"
    >
      {isCreateOpen && canCreate && (
        <CreateGroupModal onClose={() => setIsCreateOpen(false)} />
      )}
      <div className="mb-10 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">
            Groups{groups.data ? " (" + groups.data.length + ")" : ""}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your workspace groups and their members.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rainbow-btn inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FontAwesomeIcon icon={faPlus} />
            Create group
          </button>
        )}
      </div>
      {groups.isPending && <p role="status">Loading groups...</p>}
      {groups.isError && (
        <div role="alert" className="text-sm text-red-700 dark:text-red-300">
          {groups.error.message}{" "}
          <button
            type="button"
            onClick={() => void groups.refetch()}
            disabled={groups.isFetching}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}
      {groups.isSuccess && (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm shadow-lg">
            <caption className="sr-only">
              Workspace groups and member counts
            </caption>
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-slate-100">
              <tr>
                <th
                  scope="col"
                  className="border-b border-gray-200 px-5 py-4 font-semibold"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="border-b border-gray-200 px-5 py-4 text-right font-semibold"
                >
                  Members
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:bg-slate-900">
              {groups.data.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-slate-900"
                >
                  <th
                    scope="row"
                    className="px-5 py-4 font-medium wrap-anywhere"
                  >
                    {group.name}
                  </th>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {group._count.members}
                  </td>
                </tr>
              ))}
              {!groups.data.length && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-12 text-center text-gray-500 dark:text-gray-300"
                  >
                    No groups yet.
                    {canCreate
                      ? " Create a group to organize your members."
                      : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
