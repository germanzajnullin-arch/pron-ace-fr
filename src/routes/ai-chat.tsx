import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Mic, Send, Square } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { MicPermissionAlert } from "@/components/feedback/MicPermissionAlert";
import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";
import { createLogger } from "@/services/logger";

const log = createLogger("AiChat");

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { title: `AI Conversation — ${APP_NAME}` },
      { name: "description", content: "Free-form French conversation practice with instant feedback." },
    ],
  }),
  component: AiChatPage,
});

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/** Deterministic MVP replies — swap with Lovable AI Gateway later. */
const CANNED_REPLIES: readonly string[] = [
  "Très bien ! Et pourquoi apprenez-vous le français ?",
  "Intéressant. Pouvez-vous me le dire en une phrase complète ?",
  "Bonne prononciation ! Essayez de rouler le « r » un peu plus.",
  "D'accord. Et qu'est-ce que vous avez fait ce week-end ?",
  "Excellent. Racontez-moi une chose que vous aimez à Paris.",
];

const OPENERS: readonly string[] = [
  "Bonjour ! Comment allez-vous aujourd'hui ?",
  "Salut ! De quoi avez-vous envie de parler ?",
];

function AiChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "opener",
      role: "assistant",
      text: OPENERS[Math.floor(Math.random() * OPENERS.length)],
    },
  ]);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const recorder = useRecorder({
    expectedText: "",
    onScored: (result) => {
      if (result.transcript.trim()) {
        setDraft(result.transcript.trim());
      }
    },
  });

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setPending(true);
    log.debug("sending message", { text: trimmed });
    // Simulate assistant thinking.
    const delay = 700 + Math.random() * 700;
    window.setTimeout(() => {
      const reply = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: reply },
      ]);
      setPending(false);
    }, delay);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const isRecording = recorder.state === "recording";

  return (
    <main className="flex flex-1 flex-col px-0 pt-4 pb-6">
      <div className="flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <div className="text-sm">
          <span className="text-muted-foreground">Chat with </span>
          <span className="font-semibold text-primary">Léa</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-4 flex-1 space-y-3 overflow-y-auto px-4 pb-4"
        aria-live="polite"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-surface-2 text-foreground",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-surface-2 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            </div>
          </div>
        ) : null}
      </div>

      {recorder.error ? (
        <div className="px-4 pb-2">
          <MicPermissionAlert error={recorder.error} />
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mx-4 flex items-end gap-2 rounded-2xl border border-border/60 bg-surface p-2"
      >
        <button
          type="button"
          onClick={() => (isRecording ? recorder.stop() : recorder.start())}
          disabled={recorder.state === "processing" || recorder.state === "requesting"}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            isRecording
              ? "bg-destructive text-destructive-foreground animate-pulse-neon"
              : "bg-primary/15 text-primary hover:bg-primary/25",
          )}
          aria-label={isRecording ? "Stop recording" : "Record"}
        >
          {isRecording ? <Square className="h-5 w-5" fill="currentColor" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
        </button>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          rows={1}
          placeholder={isRecording ? recorder.interim || "Parlez…" : "Type in French, or tap the mic"}
          className="max-h-28 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </form>
    </main>
  );
}
