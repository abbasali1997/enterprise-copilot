type Role = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

function MessageBubble(props: { role: Role; content: string }) {
  const messageBgColor =
    props.role === "USER" ? "bg-indigo-500" : "bg-indigo-950";

  return (
    <div
      className={`flex ${props.role === "USER" ? "justify-end" : "justify-start"} my-2`}
    >
      <div
        className={`${messageBgColor} ${props.role === "USER" ? "max-w-2/4" : "max-w-full"} rounded-4xl p-2 px-4 whitespace-pre-wrap wrap-break-word text-left text-lg text-slate-100`}
      >
        {props.content}
      </div>
    </div>
  );
}

export default MessageBubble;
