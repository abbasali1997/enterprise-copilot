import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";

const ChatArea = () => {
  // const trpc = useTRPC();

  const resizeMessage = (event: FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight);
    const padding =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom);
    const borders =
      Number.parseFloat(styles.borderTopWidth) +
      Number.parseFloat(styles.borderBottomWidth);
    const maxHeight = lineHeight * 5 + padding + borders;

    // Reset first so deleting text can shrink the input again.
    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight + borders;
    textarea.style.height = `${Math.min(contentHeight, maxHeight)}px`;
    textarea.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  };

  return (
    <div className="w-full h-full flex min-w-0 flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            How can I help you?
          </h1>

          <p className="mt-2 text-xl text-black">
            Ask questions about your company knowledge.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 pb-6">
        <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm items-center">
          <button
            className="cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center text-gray-600 transition hover:text-gray-900"
            aria-label="Attach File(s)"
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>

          <textarea
            rows={1}
            onInput={resizeMessage}
            placeholder="Ask Copilot..."
            className="min-h-10 flex-1 resize-none overflow-y-hidden leading-7 bg-transparent px-2 py-2 text-lg outline-none placeholder:text-gray-500 text-gray-700"
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

        <p className="mt-2 text-center text-xs text-purple-950">
          Chat can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
