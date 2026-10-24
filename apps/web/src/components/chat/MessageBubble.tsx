type Role = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

function MessageBubble(props: { role: Role; content: string }) {
  const messageBgColor =
    props.role === "USER"
      ? "bg-indigo-500/85 text-slate-100 text-right dark:bg-cyan-600/85"
      : "dark:bg-indigo-950 dark:text-slate-100 bg-slate-200/85 text-black text-left";

  return (
    <div
      className={`flex ${props.role === "USER" ? "justify-end" : "justify-start"} my-2`}
    >
      <div
        className={`${messageBgColor} ${props.role === "USER" ? "max-w-2/4" : "w-full"} rounded-4xl p-2 px-4 whitespace-pre-wrap wrap-break-word text-lg `}
      >
        {props.content}
      </div>
    </div>
  );
}

export default MessageBubble;
