import { AlertTriangle, MicOff } from "lucide-react";
import type { RecordingError } from "@/services/audio/types";

const ICONS: Record<RecordingError["kind"], React.ReactNode> = {
  "permission-denied": <MicOff className="h-5 w-5" aria-hidden />,
  "no-microphone": <MicOff className="h-5 w-5" aria-hidden />,
  unsupported: <AlertTriangle className="h-5 w-5" aria-hidden />,
  "recognition-failed": <AlertTriangle className="h-5 w-5" aria-hidden />,
  aborted: <AlertTriangle className="h-5 w-5" aria-hidden />,
  unknown: <AlertTriangle className="h-5 w-5" aria-hidden />,
};

export function MicPermissionAlert({ error }: { error: RecordingError }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
    >
      <div className="mt-0.5 text-destructive">{ICONS[error.kind]}</div>
      <div className="space-y-1">
        <p className="font-medium">Microphone problem</p>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}
