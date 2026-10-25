import { memo, useContext } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faPen, faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";

type WorkspaceDocument = {
  id: string;
  key: string;
  name: string;
  type: "BINARY" | "IMAGE" | "DOCUMENT";
  mimeType: string;
  fileSize: number;
  source: string;
};

type WorkspaceDocumentsPropType = {
  documents: WorkspaceDocument[];
  onUpload?: () => void;
  onEdit?: (document: WorkspaceDocument) => void;
  onDownload?: (document: WorkspaceDocument) => void;
  onDelete?: (document: WorkspaceDocument) => void;
};

function WorkspaceDocuments({
  documents,
  onUpload,
  onEdit,
  onDownload,
  onDelete,
}: WorkspaceDocumentsPropType) {
  const auth = useContext(AuthContext);
  const role = auth?.user?.organization.role;
  const canRead = !!role && can(role, PERMISSIONS.DOCUMENT_READ);
  const canUpload = !!role && can(role, PERMISSIONS.DOCUMENT_UPLOAD);
  const canUpdate = !!role && can(role, PERMISSIONS.DOCUMENT_UPDATE);
  const canDownload = !!role && can(role, PERMISSIONS.DOCUMENT_DOWNLOAD);
  const canDelete = !!role && can(role, PERMISSIONS.DOCUMENT_DELETE);

  if (!canRead) {
    return <p role="alert">You do not have permission to view documents.</p>;
  }

  return (
    <section
      aria-label="Workspace documents"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white p-5 dark:bg-slate-800 dark:text-slate-100"
    >
      <div className="mb-10 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Documents ({documents.length})</h3>
          <p className="text-gray-600 dark:text-gray-300">LLM agents use these documents as context to understand your organization.</p>
        </div>
        <button
          type="button"
          onClick={onUpload}
          disabled={!canUpload || !onUpload}
          className="rainbow-btn inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faUpload} />
          Upload Document
        </button>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <table className="w-full table-auto text-left text-sm shadow-lg rounded-lg">
          <caption className="sr-only">Workspace documents and their file types and sizes</caption>
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-slate-100">
            <tr>
              {["Name", "File Type", "Size", "Actions"].map((column) => (
                <th key={column} scope="col" className="whitespace-nowrap border-b border-gray-200 px-5 py-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:bg-slate-900 dark:divide-slate-700">
            {documents.map((document) => (
              <tr key={document.id} className="transition hover:bg-gray-50/70 dark:hover:bg-slate-800">
                <th scope="row" className="px-5 py-4 font-medium">{document.name}</th>
                <td className="px-5 py-4">{document.mimeType}</td>
                <td className="whitespace-nowrap px-5 py-4">
                  {document.fileSize < 1024
                    ? `${document.fileSize} B`
                    : document.fileSize < 1024 * 1024
                      ? `${(document.fileSize / 1024).toFixed(1)} KB`
                      : `${(document.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onEdit?.(document)} disabled={!canUpdate || !onEdit} aria-label={`Edit ${document.name}`} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">
                      <FontAwesomeIcon icon={faPen} className="mr-2" />Edit
                    </button>
                    <button type="button" onClick={() => onDownload?.(document)} disabled={!canDownload || !onDownload} aria-label={`Download ${document.name}`} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />Download
                    </button>
                    <button type="button" onClick={() => onDelete?.(document)} disabled={!canDelete || !onDelete} aria-label={`Delete ${document.name}`} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 disabled:opacity-40">
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!documents.length && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-500">No documents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(WorkspaceDocuments);
