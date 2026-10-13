import { useState, type FormEvent } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

function InvitationReply() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const trpc = useTRPC();
  const invitationToken = useParams().token;
  const respondToInvite = useMutation(
    trpc.organization.respondToInvite.mutationOptions(),
  );
  const isValidToken =
    !!invitationToken && /^[A-Za-z0-9_-]{43}$/.test(invitationToken);

  function handleResponse(action: "accept" | "reject") {
    if (
      !invitationToken ||
      !isValidToken ||
      respondToInvite.isPending ||
      respondToInvite.isSuccess
    )
      return;
    if (action === "accept") {
      respondToInvite.mutate({
        action,
        token: invitationToken,
        name: name.trim(),
        password,
      });
    } else {
      respondToInvite.mutate({ action, token: invitationToken });
    }
  }

  function handleAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleResponse("accept");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section
        aria-labelledby="invitation-title"
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 id="invitation-title" className="text-xl font-bold text-gray-900">
          Workspace invitation
        </h1>
        {!isValidToken ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            This invitation link is invalid.
          </p>
        ) : respondToInvite.isSuccess ? (
          <p role="status" className="mt-4 text-sm text-gray-700">
            {respondToInvite.data.action === "accept"
              ? "Invitation accepted. You have joined the workspace."
              : "Invitation rejected."}
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Would you like to accept this invitation?
            </p>
            {respondToInvite.isError && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {respondToInvite.error.message}
              </p>
            )}
            <form
              onSubmit={handleAccept}
              className="mt-6 space-y-4"
              aria-busy={respondToInvite.isPending}
            >
              <div>
                <label
                  htmlFor="invitation-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="invitation-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={respondToInvite.isPending}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                />
              </div>
              <div>
                <label
                  htmlFor="invitation-password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="invitation-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={respondToInvite.isPending}
                  aria-describedby="invitation-password-help"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                />
                <p
                  id="invitation-password-help"
                  className="mt-1 text-xs text-gray-500"
                >
                  Use at least 8 characters.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={respondToInvite.isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {respondToInvite.isPending &&
                  respondToInvite.variables?.action === "accept"
                    ? "Accepting…"
                    : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => handleResponse("reject")}
                  disabled={respondToInvite.isPending}
                  className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {respondToInvite.isPending &&
                  respondToInvite.variables?.action === "reject"
                    ? "Rejecting…"
                    : "Reject"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default InvitationReply;
