import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RevokeMemberModalProps = {
  memberName: string;
  isPending: boolean;
  error?: string;
  onConfirm: (status: "SUSPENDED" | "REMOVED") => void;
  onClose: () => void;
};

export default function RevokeMemberModal({
  memberName,
  isPending,
  error,
  onConfirm,
  onClose,
}: RevokeMemberModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    titleRef.current?.focus();
  }, [confirmRemoval]);

  return createPortal(
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isPending}
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-gray-900/30 backdrop:backdrop-blur-sm"
    >
      <h2 ref={titleRef} id={titleId} tabIndex={-1} className="text-xl font-bold focus:outline-none">
        {confirmRemoval ? "Confirm member removal" : "Revoke member access"}
      </h2>
      <p id={descriptionId} className="mt-3 text-sm text-gray-600">
        {confirmRemoval ? (
          <>
            You are about to remove <strong>{memberName}</strong> from this
            workspace. They will lose access to its documents, assistants, and
            chats. Their account and membership record will remain, and their
            membership will be marked as removed. Choose Back if you intended
            to suspend their access instead.
          </>
        ) : (
          <>
            Should {memberName} be suspended or removed from this workspace?
            Both options revoke workspace access. Suspension keeps their
            membership paused; removal marks their membership as removed.
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {isPending && (
        <p role="status" className="mt-4 text-sm text-gray-600">
          Updating member access...
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
        {confirmRemoval ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmRemoval(false)}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => onConfirm("REMOVED")}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Confirm removal
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onConfirm("SUSPENDED")}
              disabled={isPending}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              Suspend
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemoval(true)}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
