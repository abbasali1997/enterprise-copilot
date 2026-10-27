import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons";

type Role = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

function MessageBubble(props: { role: Role; content: string }) {
  const isUser = props.role === "USER";
  const messageBgColor = isUser
    ? "bg-indigo-500/85 text-slate-100 text-right dark:bg-cyan-600/85"
    : "dark:bg-indigo-950 dark:text-slate-100 bg-slate-200/85 text-black text-left";

  const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1);

  // Keep unfinished fences styled as code while the response is streaming.
  const content = isUser
    ? props.content
    : props.content
        .split(/(```[\s\S]*?(?:```|$)|`[^`\n]+`)/g)
        .map((part, index) => {
          if (part.startsWith("```")) {
            const openingLineEnd = part.indexOf("\n");
            const language = part.substr(3, openingLineEnd - 3);
            const code =
              openingLineEnd === -1
                ? part.slice(3).replace(/```$/, "")
                : part.slice(openingLineEnd + 1).replace(/```$/, "");

            return (
              <pre
                key={index}
                className="my-3 max-w-full overflow-x-auto rounded-xl bg-slate-300 dark:bg-gray-900 p-4 text-left font-mono text-sm leading-6 whitespace-pre text-slate-900 dark:text-slate-100"
              >
                <p className="mb-5 font-bold text-orange-700">
                  <FontAwesomeIcon icon={faCode} /> {capitalize(language)}
                </p>
                <code>{code}</code>
              </pre>
            );
          }

          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={index}
                className="rounded bg-slate-300 dark:bg-gray-900 px-1.5 py-0.5 font-mono text-sm text-slate-900 dark:text-slate-100"
              >
                {part.slice(1, -1)}
              </code>
            );
          }

          return part;
        });

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} my-2 min-w-0`}
    >
      <div
        className={`${messageBgColor} ${isUser ? "max-w-2/4" : "w-full min-w-0"} rounded-4xl p-2 px-4 whitespace-pre-wrap wrap-break-word text-lg`}
      >
        {content}
      </div>
    </div>
  );
}

export default MessageBubble;
