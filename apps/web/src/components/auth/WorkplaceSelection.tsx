import { useState, type FormEvent } from "react";
import type { LoginResponse } from "@/lib/trpc.ts";

type WorkplaceSelectionProps = {
  workspaceList: Extract<
    LoginResponse,
    { status: "workspace_selection_required" }
  >["workspaces"];
  onBack: () => void;
  onProceed: (organizationId: string) => void;
  isPending: boolean;
  isRedirecting: boolean;
  error?: string;
  initialWorkspaceId?: string;
  backLabel?: string;
};

function WorkplaceSelection({
  workspaceList,
  onBack,
  onProceed,
  isPending,
  isRedirecting,
  error,
  initialWorkspaceId,
  backLabel = "Back to sign in",
}: WorkplaceSelectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialWorkspaceId ?? null,
  );
  const busy = isPending || isRedirecting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId && !busy) onProceed(selectedId);
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-indigo-950 bg-slate-950 text-slate-200 p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-center">
        Select your organization
      </h1>
      <p className="mt-2 text-sm text-slate-400 text-center">
        Choose a workspace to continue.
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={busy}
          className="mt-5 max-h-80 space-y-3 overflow-y-auto p-1"
        >
          <legend className="sr-only">Available workspaces</legend>
          {workspaceList.map((workspace) => (
            <label
              key={workspace.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-indigo-500 ${selectedId === workspace.id ? "border-indigo-950 " : "border-gray-900 bg-gray-900 hover:bg-gray-950"} ${busy ? "cursor-wait opacity-70" : ""}`}
            >
              <input
                type="radio"
                name="workspace"
                value={workspace.id}
                checked={selectedId === workspace.id}
                onChange={() => setSelectedId(workspace.id)}
                className="h-4 w-4 shrink-0 accent-indigo-600"
              />
              <img
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                src={workspace.logoUrl ?? "/No-Image.png"}
                alt=""
              />
              <span className="min-w-0">
                <span className="block truncate text-lg font-semibold text-slate-200">
                  {workspace.name}
                </span>
                <span className="block text-xs text-slate-400">
                  {workspace.role.toLowerCase()}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {backLabel}
          </button>
          <button
            type="submit"
            disabled={!selectedId || busy}
            className="rainbow-btn"
          >
            {isRedirecting
              ? "Redirecting"
              : isPending
                ? "Selecting..."
                : "Proceed"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default WorkplaceSelection;
