import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc.ts";

type AddMemberModalProps = {
  organizationName: string;
  onClose: () => void;
};

function AddMemberModal({ organizationName, onClose }: AddMemberModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const emailId = useId();
  const roleId = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  const trpc = useTRPC();
  const invitation = useMutation(
    trpc.organization.inviteMember.mutationOptions(),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invitation.isPending || invitation.isSuccess) return;
    invitation.mutate({ email: email.trim().toLowerCase(), role });
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (invitation.isPending) event.preventDefault();
      }}
      onClose={(event) => {
        // Strict Mode cleanup can queue a close event before reopening.
        if (!event.currentTarget.open) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-gray-900/30 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:backdrop:bg-slate-950/60 dark:[color-scheme:dark]"
    >
      <h2 id={titleId} className="text-xl font-bold">
        Add Member
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Invite someone to {organizationName}.
      </p>
      {invitation.isSuccess ? (
        <div className="mt-6">
          <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            Invitation created for {invitation.data.email}.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400"
          >
            Done
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
          aria-busy={invitation.isPending}
        >
          <div>
            <label htmlFor={emailId} className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={invitation.isPending}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label htmlFor={roleId} className="mb-2 block text-sm font-medium">
              Role
            </label>
            <select
              id={roleId}
              name="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value === "ADMIN" ? "ADMIN" : "MEMBER")
              }
              disabled={invitation.isPending}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {invitation.isError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
            >
              {invitation.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={invitation.isPending}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invitation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60 dark:focus-visible:outline-indigo-400"
            >
              {invitation.isPending ? "Inviting…" : "Send Invite"}
            </button>
          </div>
        </form>
      )}
    </dialog>,
    document.body,
  );
}

export default AddMemberModal;
