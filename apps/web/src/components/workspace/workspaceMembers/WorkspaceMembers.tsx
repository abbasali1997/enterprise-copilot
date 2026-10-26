import { memo, useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faPen,
  faTrash,
  faUserCheck,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import AddMemberModal from "@/components/workspace/workspaceMembers/AddMemberModal.tsx";

type WorkspaceMembersPropType = {
  organizationName: string;
  members: {
    organizationId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    userId: string;
    user: {
      name: string;
      email: string;
    };
    status: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
    id: string;
    createdAt: string;
    updatedAt: string;
    joinedAt: string;
  }[];
  onEdit?: (member: WorkspaceMembersPropType["members"][number]) => void;
  onActivate?: (member: WorkspaceMembersPropType["members"][number]) => void;
  onManageAccess?: (
    member: WorkspaceMembersPropType["members"][number],
  ) => void;
};

const rolesStyles = {
  OWNER: "bg-purple-200 text-purple-700",
  ADMIN: "bg-indigo-200 text-indigo-700",
  MEMBER: "bg-gray-200 text-gray-700",
};

const statusStyles = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INVITED: "bg-indigo-50 text-indigo-700",
  SUSPENDED: "bg-amber-50 text-amber-700",
  REMOVED: "bg-gray-100 text-gray-500",
};

function WorkspaceMembers({
  organizationName,
  members,
  onEdit,
  onActivate,
  onManageAccess,
}: WorkspaceMembersPropType) {
  const auth = useContext(AuthContext);
  const signedInMember = members.find(
    (member) => member.userId === auth?.user?.id,
  );
  const canInvite =
    !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_INVITE);
  const canUpdate =
    !!signedInMember &&
    can(signedInMember.role, PERMISSIONS.MEMBER_ROLE_UPDATE);
  const canSuspend =
    !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_SUSPEND);
  const canRemove =
    !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_REMOVE);
  const canActivate =
    !!signedInMember && can(signedInMember.role, PERMISSIONS.MEMBER_REACTIVATE);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section
      aria-label="Workspace members"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white p-5 dark:bg-slate-800 dark:text-slate-100"
    >
      {isAddMemberOpen ? (
        <AddMemberModal
          organizationName={organizationName}
          onClose={() => setIsAddMemberOpen(false)}
        />
      ) : null}

      <div className="mb-10 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Members ({members.length})</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Manage who can access this workspace and their roles
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddMemberOpen(true)}
          disabled={!canInvite}
          className="rainbow-btn inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          Add Member
        </button>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1100px] table-auto text-left text-sm shadow-lg rounded-lg">
          <caption className="sr-only">
            Workspace members and their roles, status, and join dates
          </caption>
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-slate-100">
            <tr>
              {["Name", "Email", "Role", "Status", "Joined At", "Actions"].map(
                (column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap border-b border-gray-200 px-5 py-4 font-semibold"
                  >
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:bg-slate-900 dark:divide-slate-700">
            {members.map((member) => {
              const joinedAt = new Date(member.joinedAt);
              return (
                <tr
                  key={member.id}
                  className="transition hover:bg-gray-50/70 dark:hover:bg-slate-800"
                >
                  <th
                    scope="row"
                    className="min-w-[180px] px-5 py-4 font-medium text-gray-900 dark:text-slate-100"
                  >
                    {member.user.name}{" "}
                    {member.role === "OWNER" ? (
                      <FontAwesomeIcon
                        icon={faCrown}
                        className="text-yellow-500"
                      />
                    ) : null}
                  </th>
                  <td className="min-w-[260px] whitespace-nowrap px-5 py-4 text-gray-600 dark:text-slate-100">
                    {member.user.email}
                  </td>
                  <td className="min-w-[130px] whitespace-nowrap px-5 py-4">
                    <span
                      className={`rounded-4xl px-2.5 py-1 text-xs font-medium capitalize ${rolesStyles[member.role]}`}
                    >
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="min-w-[130px] whitespace-nowrap px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[member.status]}`}
                    >
                      {member.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="min-w-[160px] whitespace-nowrap px-5 py-4 text-gray-600 dark:text-slate-100">
                    {Number.isNaN(joinedAt.getTime()) ? (
                      "—"
                    ) : (
                      <time dateTime={joinedAt.toISOString()}>
                        {dateFormatter.format(joinedAt)}
                      </time>
                    )}
                  </td>
                  <td className="min-w-[130px] whitespace-nowrap px-5 py-4">
                    <div className="flex min-w-[240px] flex-nowrap gap-2 [&>button]:shrink-0 [&>button]:whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit?.(member)}
                        disabled={!canUpdate || member.status === "REMOVED"}
                        aria-label={`Edit ${member.user.name}`}
                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-200"
                      >
                        <FontAwesomeIcon icon={faPen} className="mr-2" />
                        Edit
                      </button>
                      {member.userId !== auth?.user?.id &&
                        (member.status === "SUSPENDED" ? (
                          <button
                            type="button"
                            onClick={() => onActivate?.(member)}
                            disabled={!canActivate}
                            aria-label={`Activate access for ${member.user.name}`}
                            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-green-200"
                          >
                            <FontAwesomeIcon
                              icon={faUserCheck}
                              className="mr-2"
                            />
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onManageAccess?.(member)}
                            disabled={
                              (!canSuspend && !canRemove) ||
                              member.status === "REMOVED"
                            }
                            aria-label={`Manage access for ${member.user.name}`}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-200"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-2" />
                            Manage Access
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!members.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(WorkspaceMembers);
