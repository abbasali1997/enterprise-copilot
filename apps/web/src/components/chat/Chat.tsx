import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

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
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            How can I help you?
          </h1>

          <p className="mt-2 text-xl text-gray-600 dark:text-slate-300">
            Ask questions about your company knowledge.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3/4 px-6 pb-6">
        <div className="flex gap-3 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/90 p-3 shadow-xl shadow-gray-400 dark:shadow-black/25 focus-within:border-indigo-400 dark:focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-cyan-400/15 items-center">
          <button
            className="cursor-pointer text-lg flex h-9 w-9 shrink-0 items-center justify-center rounded-4xl text-gray-800 dark:text-cyan-200 transition hover:bg-gray-200 dark:hover:bg-cyan-400/10 hover:text-indigo-600 dark:hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300"
            aria-label="Attach File(s)"
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>

          <textarea
            rows={1}
            onInput={resizeMessage}
            placeholder="Ask Here"
            className="min-h-10 flex-1 resize-none overflow-y-hidden leading-7 bg-transparent px-2 py-2 text-lg outline-none placeholder:text-gray-500 dark:placeholder:text-slate-400 text-gray-900 dark:text-slate-100 caret-indigo-500 dark:caret-cyan-300"
          />

          <button
            className="cursor-pointer text-lg flex h-9 w-9 shrink-0 items-center justify-center rounded-4xl text-gray-800 dark:text-cyan-200 transition hover:bg-gray-200 dark:hover:bg-cyan-400/10 hover:text-indigo-600 dark:hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300"
            aria-label="Send message"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">
          Chat can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
