import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faXmark } from "@fortawesome/free-solid-svg-icons";

type AddDocumentModelProps = {
  organizationName: string;
  onClose: () => void;
  onUpload: (file: File) => void;
  isPending: boolean;
  error?: string;
};

function AddDocumentModel({
  organizationName,
  onClose,
  onUpload,
  isPending,
  error,
}: AddDocumentModelProps) {
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const documentId = useId();
  const documentHelpId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const selectDocument = (files: FileList | null) => {
    if (isPending || !files?.length) return;

    let error: string | null = null;

    const file = files[0] as File;
    if (files.length !== 1) {
      error = "Choose one PDF at a time.";
    } else if (file.type !== "application/pdf") {
      error = "Choose a PDF file.";
    } else if (file.size <= 0 || file.size >= 20 * 1024 * 1024) {
      error = "Choose a document smaller than 20 MB.";
    }

    setDocumentError(error);
    setSelectedFile(error ? null : file);
    if (inputRef.current) {
      if (error) {
        inputRef.current.value = "";
      } else {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        inputRef.current.files = transfer.files;
      }
    }
  };

  const onDocumentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    selectDocument(event.target.files);
  };

  const onDocumentDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    selectDocument(event.dataTransfer.files);
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isPending}
      onCancel={(event) => { if (isPending) event.preventDefault(); }}
      onClose={(event) => {
        // Strict Mode cleanup can queue a close event before reopening.
        if (!event.currentTarget.open) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:backdrop:bg-slate-950/70 dark:[color-scheme:dark]"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
        <div>
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            Add document
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400"
          >
            Give your assistants more context with a document for{" "}
            <span className="font-medium text-gray-700 dark:text-slate-200">
              {organizationName}
            </span>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Close add document"
          className="-mr-2 -mt-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <label
          htmlFor={documentId}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!event.dataTransfer.types.includes("Files")) return;
            dragDepth.current += 1;
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setIsDragging(false);
          }}
          onDrop={onDocumentDrop}
          data-dragging={isDragging}
          className="group data-[dragging=true]:border-indigo-500 data-[dragging=true]:bg-indigo-100 data-[dragging=true]:ring-4 data-[dragging=true]:ring-indigo-500/15 dark:data-[dragging=true]:border-indigo-400 dark:data-[dragging=true]:bg-indigo-500/15 relative flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 dark:border-slate-600 dark:bg-slate-900/50 dark:hover:border-indigo-400 dark:hover:bg-indigo-500/5"
        >
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-xl text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition group-hover:-translate-y-0.5 dark:bg-slate-800 dark:text-indigo-300 dark:ring-slate-700">
            <FontAwesomeIcon icon={faUpload} />
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            {isDragging
              ? "Drop your PDF here"
              : "Drop a PDF here or click to browse"}
          </span>
          <span
            id={documentHelpId}
            className="mt-1.5 text-xs text-gray-500 dark:text-slate-400"
          >
            One PDF at a time. Smaller than 20 MB.
          </span>
          <input
            ref={inputRef}
            id={documentId}
            name="Document"
            type="file"
            accept="application/pdf"
            onChange={onDocumentUpload}
            disabled={isPending}
            aria-label="Choose a PDF to upload"
            aria-describedby={documentHelpId}
            aria-invalid={!!documentError}
            className="mt-5 block w-full min-w-0 rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-indigo-500/15 dark:file:text-indigo-300 dark:hover:file:bg-indigo-500/25"
          />
        </label>
        {(documentError || error) && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {documentError || error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:px-8 dark:border-slate-700 dark:bg-slate-900/30">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending || !selectedFile}
          onClick={() => { if (selectedFile && !isPending) onUpload(selectedFile); }}
          className="disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
        >
          <FontAwesomeIcon icon={faUpload} className="text-xs" />
          {isPending ? "Uploading document..." : "Upload document"}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}

export default AddDocumentModel;
