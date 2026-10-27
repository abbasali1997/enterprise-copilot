import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faCopy } from "@fortawesome/free-solid-svg-icons";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-3 text-3xl font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-2xl font-bold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-2 text-xl font-semibold">{children}</h3>
  ),
  h4: ({ children }) => <h4 className="mt-3 mb-2 font-semibold">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-3 mb-2 font-semibold">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-3 mb-2 font-semibold">{children}</h6>,
  p: ({ children }) => <p className="my-2 whitespace-pre-wrap">{children}</p>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through">{children}</del>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-6">{children}</ul>,
  ol: ({ children, start }) => (
    <ol start={start} className="my-2 list-decimal pl-6">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="my-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-slate-400 pl-4 text-slate-600 dark:text-slate-300">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr
      className="my-10"
      style={{
        border: "0",
        height: "1px",
        backgroundImage:
          "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(150, 150, 150, 0.75), rgba(0, 0, 0, 0))",
      }}
    />
  ),
  a: ({ children, href }) => (
    <a href={href} className="underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code
      className={`rounded bg-slate-300 dark:bg-gray-900 px-1.5 py-0.5 font-mono text-sm text-slate-900 dark:text-slate-100 ${className ?? ""}`}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => {
    const codeElement = isValidElement<{
      children?: ReactNode;
      className?: string;
    }>(children)
      ? children
      : null;
    const code = String(codeElement?.props.children ?? "").replace(/\n$/, "");
    const language =
      /(?:^|\s)language-([^\s]+)/.exec(
        codeElement?.props.className ?? "",
      )?.[1] ?? "";
    const languageLabel = language.charAt(0).toUpperCase() + language.slice(1);

    return (
      <div className="my-5 max-w-full overflow-hidden rounded-xl bg-slate-300 p-4 text-left shadow-lg shadow-gray-500 dark:bg-gray-900 dark:shadow-black">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="font-bold text-orange-700 dark:text-orange-400">
            <FontAwesomeIcon icon={faCode} /> {languageLabel}
          </p>
          <button
            type="button"
            className="cursor-pointer text-base text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
            onClick={() => navigator.clipboard.writeText(code)}
            aria-label="Copy code"
          >
            <FontAwesomeIcon icon={faCopy} /> Copy
          </button>
        </div>
        <pre className="max-w-full overflow-x-auto whitespace-pre font-mono text-sm leading-6 text-slate-900 dark:text-slate-100 [&>code]:bg-transparent [&>code]:p-0">
          {children}
        </pre>
      </div>
    );
  },
};

function MessageBubble(props: { role: Role; content: string }) {
  const isUser = props.role === "USER";
  const messageBgColor = isUser
    ? "bg-indigo-500/85 text-slate-100 text-right dark:bg-cyan-600/85"
    : "dark:bg-indigo-950 dark:text-slate-100 bg-slate-200/85 text-black text-left";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} my-2 min-w-0`}
    >
      <div
        className={`${messageBgColor} ${isUser ? "max-w-2/4 whitespace-pre-wrap" : "w-full min-w-0"} rounded-4xl p-2 px-4 wrap-break-word text-lg`}
      >
        {isUser ? (
          props.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {props.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
