import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faUserPlus } from "@fortawesome/free-solid-svg-icons";

type WorkspaceMembersPropType = {
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
  onAddMember?: () => void;
  onEdit?: (member: WorkspaceMembersPropType["members"][number]) => void;
  onRemove?: (member: WorkspaceMembersPropType["members"][number]) => void;
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
  members,
  onAddMember,
  onEdit,
  onRemove,
}: WorkspaceMembersPropType) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section
      aria-label="Workspace members"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-10 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Members ({members.length})</h3>
          <p className="text-gray-600">
            Manage who can access this workspace and their roles
          </p>
        </div>

        <button
          type="button"
          onClick={onAddMember}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          Add Member
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[760px] text-left text-sm shadow-lg rounded-lg">
          <caption className="sr-only">
            Workspace members and their roles, status, and join dates
          </caption>
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {["Name", "Email", "Role", "Status", "Joined At", "Actions"].map(
                (column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-b border-gray-200 px-5 py-4 font-semibold"
                  >
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => {
              const joinedAt = new Date(member.joinedAt);
              return (
                <tr key={member.id} className="transition hover:bg-gray-50/70">
                  <th
                    scope="row"
                    className="px-5 py-4 font-medium text-gray-900"
                  >
                    {member.user.name}{" "}
                    {member.role === "OWNER" ? (
                      <FontAwesomeIcon
                        icon={faCrown}
                        className="text-yellow-500"
                      />
                    ) : null}
                  </th>
                  <td className="px-5 py-4 text-gray-600">
                    {member.user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-4xl px-2.5 py-1 text-xs font-medium capitalize ${rolesStyles[member.role]}`}
                    >
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[member.status]}`}
                    >
                      {member.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {Number.isNaN(joinedAt.getTime()) ? (
                      "—"
                    ) : (
                      <time dateTime={joinedAt.toISOString()}>
                        {dateFormatter.format(joinedAt)}
                      </time>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(member)}
                        disabled={!onEdit}
                        aria-label={`Edit ${member.user.name}`}
                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove?.(member)}
                        disabled={!onRemove}
                        aria-label={`Remove ${member.user.name}`}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
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
