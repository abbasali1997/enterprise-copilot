import { memo, useContext, useRef, useState } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faUpload } from "@fortawesome/free-solid-svg-icons";
import AddDocumentModel from "./AddDocumentModel.tsx";
import ViewDocumentModel from "./ViewDocumentModel.tsx";
import { useTRPC } from "@/lib/trpc.ts";
import { useMutation } from "@tanstack/react-query";

type WorkspaceDocument = {
  id: string;
  name: string;
  type: "BINARY" | "IMAGE" | "DOCUMENT";
  mimeType: string;
  fileSize: number;
};

type WorkspaceDocumentsPropType = {
  documents: WorkspaceDocument[];
  onAddToDocumentList: (document: WorkspaceDocument) => void;
  organizationName: string;
  onDownload?: (document: WorkspaceDocument) => void;
  onDelete?: (document: WorkspaceDocument) => void;
};

function WorkspaceDocuments({
  documents,
  onAddToDocumentList,
  organizationName,
}: WorkspaceDocumentsPropType) {
  const trpc = useTRPC();
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<WorkspaceDocument | null>(
    null,
  );

  const uploadInFlight = useRef(false);
  const createUpload = useMutation(
    trpc.documents.createUpload.mutationOptions(),
  );
  const finalizeUpload = useMutation(
    trpc.documents.finalizeUpload.mutationOptions(),
  );

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (
        file.type !== "application/pdf" ||
        file.size <= 0 ||
        file.size >= 20 * 1024 * 1024
      ) {
        throw new Error("Choose a non-empty PDF smaller than 20 MB.");
      }

      const data = await createUpload.mutateAsync({
        name: file.name,
        fileSize: file.size,
        mimeType: "application/pdf",
      });

      // The browser sets Content-Length from the File body; scripts cannot set it.
      const response = await fetch(data.url, {
        method: data.method,
        headers: { "Content-Type": data.headers["Content-Type"] },
        body: file,
      });

      if (!response.ok) {
        throw new Error(
          "Document upload failed (" + response.status + "). Please try again.",
        );
      }

      return finalizeUpload.mutateAsync({
        name: file.name,
        mimeType: "application/pdf",
        fileSize: file.size,
        key: data.key,
      });
    },
    onSuccess: (document) => {
      onAddToDocumentList(document);
      setIsAddDocumentOpen(false);
    },
  });

  const auth = useContext(AuthContext);
  const role = auth?.user?.organization.role;
  const canRead = !!role && can(role, PERMISSIONS.DOCUMENT_READ);
  const canUpload = !!role && can(role, PERMISSIONS.DOCUMENT_UPLOAD);

  if (!canRead) {
    return <p role="alert">You do not have permission to view documents.</p>;
  }

  const onUpload = (file: File) => {
    if (!canUpload || uploadInFlight.current) return;
    uploadInFlight.current = true;
    upload.mutate(file, {
      onSettled: () => {
        uploadInFlight.current = false;
      },
    });
  };

  return (
    <section
      aria-label="Workspace documents"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white p-5 dark:bg-slate-800 dark:text-slate-100"
    >
      {viewDocument && (
        <ViewDocumentModel
          key={viewDocument.id}
          attachmentId={viewDocument.id}
          name={viewDocument.name}
          onClose={() => setViewDocument(null)}
        />
      )}
      {isAddDocumentOpen && (
        <AddDocumentModel
          organizationName={organizationName}
          onUpload={onUpload}
          isPending={upload.isPending}
          error={upload.error?.message}
          onClose={() => {
            if (!uploadInFlight.current) setIsAddDocumentOpen(false);
          }}
        />
      )}
      <div className="mb-10 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Documents ({documents.length})</h3>
          <p className="text-gray-600 dark:text-gray-300">
            LLM agents use these documents as context to understand your
            organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            upload.reset();
            setIsAddDocumentOpen(true);
          }}
          disabled={!canUpload}
          className="rainbow-btn inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faUpload} />
          Upload Document
        </button>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <table className="w-full table-auto text-left text-sm shadow-lg rounded-lg">
          <caption className="sr-only">
            Workspace documents and their file types and sizes
          </caption>
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-slate-100">
            <tr>
              {["Name", "File Type", "Size", "Actions"].map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="whitespace-nowrap border-b border-gray-200 px-5 py-4 font-semibold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:bg-slate-900 dark:divide-slate-700">
            {documents.map((document) => (
              <tr
                key={document.id}
                className="transition hover:bg-gray-50/70 dark:hover:bg-slate-800"
              >
                <th scope="row" className="px-5 py-4 font-medium">
                  {document.name}
                </th>
                <td className="px-5 py-4">{document.mimeType}</td>
                <td className="whitespace-nowrap px-5 py-4">
                  {document.fileSize < 1024
                    ? `${document.fileSize} B`
                    : document.fileSize < 1024 * 1024
                      ? `${(document.fileSize / 1024).toFixed(1)} KB`
                      : `${(document.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                </td>

                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setViewDocument(document)}
                    aria-label={`View ${document.name}`}
                    className="cursor-pointer border border-transparent rounded-2xl px-5 py-1 text-base bg-gray-200 dark:bg-gray-600 hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500 hover:border-indigo-500 dark:hover:text-cyan-500 dark:hover:border-cyan-500"
                  >
                    <span className="">
                      <FontAwesomeIcon icon={faEye} /> View{" "}
                    </span>
                  </button>
                </td>
              </tr>
            ))}
            {!documents.length && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(WorkspaceDocuments);
