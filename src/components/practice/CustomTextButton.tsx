import { Link } from "@tanstack/react-router";
import { PenLine, ChevronRight } from "lucide-react";

export function CustomTextButton() {
  return (
    <Link
      to="/custom-text"
      className="group flex w-full items-center gap-4 rounded-2xl border border-accent/40 bg-surface p-4 transition-all hover:border-accent hover:shadow-accent"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <PenLine className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex-1 text-left">
        <p className="font-semibold">Custom Text</p>
        <p className="text-xs text-muted-foreground">Paste anything in French and drill it</p>
      </div>
      <ChevronRight
        className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
