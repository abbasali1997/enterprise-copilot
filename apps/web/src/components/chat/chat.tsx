const ChatArea = () => {
  return (
    <main className="w-full h-full flex min-w-0 flex-1 flex-col bg-white">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            How can I help you?
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Ask questions about your company knowledge.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 pb-6">
        <div className="flex items-end gap-3 rounded-xl border bg-white p-3 shadow-sm">
          <textarea
            rows={1}
            placeholder="Message CompanyGPT..."
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-gray-400"
          />

          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800"
            aria-label="Send message"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-gray-400">
          CompanyGPT can make mistakes. Verify important information.
        </p>
      </div>
    </main>
  );
};

export default ChatArea;