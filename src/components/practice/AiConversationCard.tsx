import { Link } from "@tanstack/react-router";
import { MessagesSquare, ArrowRight } from "lucide-react";

export function AiConversationCard() {
  return (
    <Link
      to="/ai-chat"
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-surface p-4 transition-all hover:border-primary hover:shadow-neon"
    >
      <div
        className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-accent/25 blur-3xl transition-opacity group-hover:opacity-80"
        aria-hidden
      />
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <MessagesSquare className="h-5 w-5" aria-hidden />
      </span>
      <div className="relative flex-1 text-left">
        <p className="font-semibold">AI Conversation</p>
        <p className="text-xs text-muted-foreground">Free-form French with instant feedback</p>
      </div>
      <ArrowRight
        className="relative h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1"
        aria-hidden
      />
    </Link>
  );
}
