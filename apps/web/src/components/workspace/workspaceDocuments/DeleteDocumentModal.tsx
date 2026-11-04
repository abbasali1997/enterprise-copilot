import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type DeleteDocumentModalProps = {
  name: string;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function DeleteDocumentModal({
  name,
  isPending,
  error,
  onConfirm,
  onClose,
}: DeleteDocumentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

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
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-gray-900/30 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      <h2 id={titleId} className="text-xl font-bold">Delete document?</h2>
      <p id={descriptionId} className="mt-3 break-words text-sm text-gray-600 dark:text-gray-300">
        Delete <strong>{name}</strong> from this workspace? This action cannot be undone.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? "Deleting..." : "Delete document"}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
