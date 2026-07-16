import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rounded-xl animate-shimmer", className)}
    />
  );
}
