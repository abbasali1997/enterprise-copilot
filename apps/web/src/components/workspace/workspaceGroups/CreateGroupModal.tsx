import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc.ts";

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const nameId = useId();
  const [name, setName] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createGroup = useMutation(
    trpc.organization.createGroup.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.organization.getGroups.queryKey(),
        });
        onClose();
      },
    }),
  );
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || createGroup.isPending) return;
    createGroup.mutate({ name: name.trim() });
  }
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (createGroup.isPending) event.preventDefault();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-gray-900/30 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]"
    >
      <h2 id={titleId} className="text-xl font-bold">
        Create group
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Organize members into a workspace group.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
        aria-busy={createGroup.isPending}
      >
        <div>
          <label htmlFor={nameId} className="mb-2 block text-sm font-medium">
            Group name
          </label>
          <input
            id={nameId}
            name="name"
            autoFocus
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={createGroup.isPending}
            placeholder="e.g. Engineering"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
        {createGroup.isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            {createGroup.error.message}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={createGroup.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-60 dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || createGroup.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {createGroup.isPending ? "Creating..." : "Create group"}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
