import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import MessageBubble from "@/components/chat/MessageBubble.tsx";

type MessageType = {
  status: "PENDING" | "STREAMING" | "COMPLETED" | "FAILED" | "CANCELLED";
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  id: string;
  content: string;
  model: string | null;
  errorMessage: string | null;
};

const ConversationChat = ({
  conversationId,
}: {
  conversationId: string | undefined;
}) => {
  const [selectedModelId, setSelectedModelId] = useState(
    "gemini-3.5-flash-lite",
  );
  const [localMessages, setMessages] = useState<MessageType[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  useEffect(() => () => subscriptionRef.current?.unsubscribe(), []);

  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef<string | undefined>(conversationId);
  // to ensure another message can not be sent while one's response is being generated
  const sendingRef = useRef(false);

  const { data: models = [] } = useQuery({
    queryKey: ["conversation", "models"],
    queryFn: () => trpcClient.assistant.models.query(),
  });

  const { data: currentConversation } = useQuery<{ messages: MessageType[] }>({
    queryKey: ["conversation", "get", conversationId],
    queryFn: async (): Promise<{ messages: MessageType[] }> => {
      const conversation: { messages: MessageType[] } =
        await trpcClient.conversation.get.query({
          conversationId: conversationId ?? "",
        });
      return {
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          status: message.status,
          model: message.model,
          errorMessage: message.errorMessage,
        })),
      };
    },
    enabled: !!conversationId,
  });

  const messages = localMessages ?? currentConversation?.messages ?? [];

  const selectedModel =
    models.find((model) => model.model === selectedModelId) ?? models[0];

  const sendMessage = useMutation({
    mutationFn: (input: {
      conversationId?: string;
      content: string;
      provider: "openai" | "gemini";
      model: (typeof models)[number]["model"];
    }) =>
      trpcClient.conversation.sendMessage.mutate({
        ...input,
      }),
    onMutate: (input) => {
      const temporaryId = crypto.randomUUID();
      setMessages((current) => [
        ...(current ?? messages),
        {
          id: temporaryId,
          role: "USER",
          content: input.content,
          status: "PENDING",
          model: null,
          errorMessage: null,
        },
      ]);
      return { temporaryId };
    },
    onSuccess: (data, _input, context) => {
      conversationIdRef.current = data.message.conversationId;
      setMessages((current) => [
        ...(current ?? messages).map((message) =>
          message.id === context.temporaryId
            ? {
                id: data.message.id,
                role: data.message.role,
                content: data.message.content,
                status: data.message.status,
                model: data.message.model,
                errorMessage: data.message.errorMessage,
              }
            : message,
        ),
        {
          id: data.generationId,
          role: "ASSISTANT",
          content: "",
          status: "PENDING",
          model: _input.model,
          errorMessage: null,
        },
      ]);
      const finish = (error?: string) => {
        sendingRef.current = false;
        setIsGenerating(false);
        setMessages((current) =>
          (current ?? []).map((message) =>
            message.id === data.generationId
              ? {
                  ...message,
                  status: error ? "FAILED" : "COMPLETED",
                  errorMessage: error ?? null,
                }
              : message,
          ),
        );
      };
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = trpcClient.chat.onGeneration.subscribe(
        { generationId: data.generationId },
        {
          onData: ({ data: event }) => {
            if (event.type === "text-delta")
              setMessages((current) =>
                (current ?? []).map((message) =>
                  message.id === data.generationId
                    ? {
                        ...message,
                        status: "STREAMING",
                        content: message.content + event.delta,
                      }
                    : message,
                ),
              );
            else if (event.type === "finish") finish();
            else if (event.type === "error") finish(event.message);
          },
          onError: (error) => finish(error.message),
          onComplete: () => {
            sendingRef.current = false;
            setIsGenerating(false);
          },
        },
      );
    },
    onError: (error, _input, context) => {
      sendingRef.current = false;
      setIsGenerating(false);
      setMessages((current) =>
        (current ?? messages).map((message) =>
          message.id === context?.temporaryId
            ? { ...message, status: "FAILED", errorMessage: error.message }
            : message,
        ),
      );
    },
  });

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [localMessages, currentConversation, isGenerating]);

  const submitMessage = () => {
    const content = textareaRef.current?.value.trim();
    if (!content || !selectedModel || sendingRef.current) return;

    sendingRef.current = true;
    setIsGenerating(true);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
    sendMessage.mutate({
      conversationId: conversationIdRef.current,
      content,
      provider: selectedModel.provider,
      model: selectedModel.model,
    });
  };

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
    <div className="w-full h-full flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {messages.length ? (
        <div
          ref={messageListRef}
          className="my-4 min-h-0 flex-1 overflow-y-auto"
        >
          <div className="w-full max-w-3/4 mx-auto flex flex-col justify-start">
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble role={message.role} content={message.content} />
                {message.errorMessage && (
                  <p
                    role="alert"
                    className="text-right text-sm text-red-600 dark:text-red-400"
                  >
                    Failed to send: {message.errorMessage}
                  </p>
                )}
              </div>
            ))}
            {isGenerating && (
              <p
                role="status"
                className="my-2 text-sm text-gray-500 dark:text-slate-400"
              >
                Generating response...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-700 dark:text-slate-100">
              How can I help you?
            </h1>

            <p className="mt-2 text-xl text-gray-600 dark:text-slate-300">
              Ask questions about your company knowledge.
            </p>
          </div>
        </div>
      )}

      <div className="relative mx-auto mt-auto w-full max-w-3/4 shrink-0 pb-6">
        <div className="rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/90 p-3 shadow-xl shadow-gray-400 dark:shadow-black/25 focus-within:border-indigo-400 dark:focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-cyan-400/15">
          <div className="flex items-center gap-3">
            <textarea
              disabled={isGenerating}
              ref={textareaRef}
              rows={1}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              onInput={resizeMessage}
              placeholder="What Is Your Question?"
              className="min-h-10 flex-1 resize-none overflow-y-hidden leading-7 bg-transparent px-2 py-2 text-lg outline-none placeholder:text-gray-500 dark:placeholder:text-slate-400 text-gray-900 dark:text-slate-100 caret-indigo-500 dark:caret-cyan-300"
            />

            <div className="flex justify-end">
              <select
                aria-label="Chat model"
                value={selectedModel?.model ?? ""}
                onChange={(event) => setSelectedModelId(event.target.value)}
                disabled={isGenerating || models.length === 0}
                className="max-w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-cyan-400"
              >
                {models.length === 0 && (
                  <option value="">Models unavailable</option>
                )}
                {(["openai", "gemini"] as const).map((provider) => (
                  <optgroup
                    key={provider}
                    label={provider === "openai" ? "OpenAI" : "Gemini"}
                  >
                    {models
                      .filter((model) => model.provider === provider)
                      .map((model) => (
                        <option key={model.model} value={model.model}>
                          {model.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <button
              className="cursor-pointer text-lg flex h-9 w-9 shrink-0 items-center justify-center rounded-4xl text-gray-800 dark:text-cyan-200 transition hover:bg-gray-200 dark:hover:bg-cyan-400/10 hover:text-indigo-600 dark:hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300"
              onClick={submitMessage}
              disabled={isGenerating || !selectedModel}
              aria-label="Send message"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">
          Chat can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

const ChatArea = ({
  conversationId,
}: {
  conversationId: string | undefined;
}) => (
  <ConversationChat
    key={conversationId ?? "new"}
    conversationId={conversationId}
  />
);

export default ChatArea;
