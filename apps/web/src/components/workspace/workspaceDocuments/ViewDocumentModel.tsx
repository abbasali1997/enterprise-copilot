import { memo, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type ViewDocumentModelProps = {
  attachmentId: string;
  name: string;
  onClose: () => void;
};

function ViewDocumentModel({
  attachmentId,
  name,
  onClose,
}: ViewDocumentModelProps) {
  const trpc = useTRPC();
  const preview = useQuery(
    trpc.documents.viewDocument.queryOptions(
      { attachmentId },
      { staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false },
    ),
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="fixed inset-0 m-auto h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-slate-700">
          <h2 id={titleId} className="min-w-0 truncate text-lg font-semibold">
            {name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-700"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        {preview.isFetching ? (
          <p role="status" className="p-6">
            Loading document...
          </p>
        ) : preview.isError ? (
          <div className="p-6">
            <p role="alert" className="text-red-600 dark:text-red-300">
              {preview.error.message}
            </p>
            <button
              type="button"
              onClick={() => void preview.refetch()}
              className="mt-4 rounded-lg border px-4 py-2"
            >
              Try again
            </button>
          </div>
        ) : preview.data ? (
          <>
            <div className="shrink-0 px-5 py-2 text-lg bg-indigo-50 dark:bg-slate-600 text-center">
              <a
                href={preview.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-200 hover:text-cyan-500"
              >
                Open In A New Tab{" "}
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </a>
            </div>
            <iframe
              src={preview.data.url}
              title={name}
              className="min-h-0 w-full flex-1 border-0 bg-gray-100 dark:bg-slate-900"
            />
          </>
        ) : null}
      </div>
    </dialog>,
    document.body,
  );
}

export default memo(ViewDocumentModel);
