import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import { useTRPC } from "@/lib/trpc.ts";

type Props = { role: "OWNER" | "ADMIN" | "MEMBER"; organizationId: string };

export default function WorkspaceInvitations({ role, organizationId }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const options = trpc.organization.getInvitations.queryOptions();
  const invitations = useQuery({
    ...options,
    queryKey: [
      options.queryKey[0],
      { input: { organizationId }, type: "query" },
    ],
  });
  const manage = useMutation(
    trpc.organization.manageInvitation.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: options.queryKey }),
    }),
  );

  return (
    <section
      aria-label="Pending invitations"
      className="mt-8 border-t border-gray-200 pt-5 dark:border-slate-700"
    >
      <h3 className="font-bold">Pending invitations</h3>
      {invitations.isPending && <p role="status">Loading invitations...</p>}
      {invitations.isError && <p role="alert">{invitations.error.message}</p>}
      {manage.isError && <p role="alert">{manage.error.message}</p>}
      {manage.isSuccess && (
        <p role="status">
          {manage.variables.action === "resend"
            ? "Invitation email queued."
            : "Invitation revoked."}
        </p>
      )}
      {invitations.data?.length === 0 && (
        <p className="mt-2 text-sm">No pending invitations.</p>
      )}
      <ul className="divide-y divide-gray-100 dark:divide-slate-700">
        {invitations.data?.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          >
            <span>
              {invitation.email} ? {invitation.role}
            </span>
            <div className="flex gap-3">
              {can(role, PERMISSIONS.MEMBER_INVITATION_RESEND) && (
                <button
                  type="button"
                  disabled={manage.isPending}
                  className="rounded-md border border-indigo-300 px-3 py-1.5 font-medium disabled:opacity-50"
                  aria-label={`Resend invitation to ${invitation.email}`}
                  onClick={() =>
                    manage.mutate({
                      invitationId: invitation.id,
                      action: "resend",
                    })
                  }
                >
                  Resend
                </button>
              )}
              {can(role, PERMISSIONS.MEMBER_INVITATION_REVOKE) && (
                <button
                  type="button"
                  disabled={manage.isPending}
                  className="rounded-md border border-red-300 px-3 py-1.5 font-medium disabled:opacity-50"
                  aria-label={`Revoke invitation to ${invitation.email}`}
                  onClick={() =>
                    manage.mutate({
                      invitationId: invitation.id,
                      action: "revoke",
                    })
                  }
                >
                  Revoke
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
