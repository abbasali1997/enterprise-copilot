import {
  type FormEvent,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { WorkspaceMembersPropType } from "@/components/workspace/workspaceMembers/WorkspaceMembers.tsx";
import { AuthContext } from "@/contexts/authContext.tsx";
import { useTRPC } from "@/lib/trpc.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type EditMemberProps = {
  member: WorkspaceMembersPropType["members"][number];
  onClose: () => void;
};

function EditMemberModal({ member, onClose }: EditMemberProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const auth = useContext(AuthContext);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState(member.groupId);
  const [role, setRole] = useState<"ADMIN" | "MEMBER">(
    member.role === "ADMIN" ? "ADMIN" : "MEMBER",
  );

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
  });

  const updateMember = useMutation(
    trpc.organization.updateMember.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.organization.getMembers.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.organization.getGroups.queryKey(),
          }),
        ]);
        onClose();
      },
    }),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const validGroup = groups.data?.some((group) => group.id === groupId);
  const changed = groupId !== member.groupId || role !== member.role;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateMember.isPending || !validGroup || !changed) return;
    updateMember.mutate({
      memberId: member.id,
      groupId,
      role,
    });
  }

  const fieldClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={id + "-title"}
      aria-busy={updateMember.isPending}
      onCancel={(event) => {
        if (updateMember.isPending) event.preventDefault();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-gray-900/30 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]"
    >
      <h2 id={id + "-title"} className="text-xl font-bold">
        Edit member
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Update {member.user.name}'s group, and role.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor={id + "-group"}
            className="mb-2 block text-sm font-medium"
          >
            Group
          </label>
          <select
            id={id + "-group"}
            name="groupId"
            required
            value={validGroup ? groupId : ""}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={updateMember.isPending || !groups.isSuccess}
            className={fieldClass}
          >
            <option value="" disabled>
              {groups.isPending ? "Loading groups..." : "Select a group"}
            </option>
            {groups.data?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {groups.isError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {groups.error.message}{" "}
              <button
                type="button"
                onClick={() => void groups.refetch()}
                className="underline"
              >
                Retry
              </button>
            </p>
          )}
          {groups.isSuccess && !groups.data.length && (
            <p role="status" className="mt-2 text-sm">
              Create a workspace group before updating this member.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={id + "-role"}
            className="mb-2 block text-sm font-medium"
          >
            Role
          </label>
          <select
            id={id + "-role"}
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
            disabled={updateMember.isPending}
            className={fieldClass}
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {updateMember.isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            {updateMember.error.message}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMember.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMember.isPending || !validGroup || !changed}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {updateMember.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

export default EditMemberModal;
