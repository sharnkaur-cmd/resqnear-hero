import { CheckCircle2, Loader2, MapPin, AlertTriangle } from "lucide-react";
import type { GpsState } from "@/hooks/use-gps";

export function GpsIndicator({ state, onRetry, threshold }: { state: GpsState; onRetry: () => void; threshold: number }) {
  if (state.status === "idle") return null;

  if (state.status === "requesting") {
    return (
      <div className="animate-fade-up flex items-center gap-3 rounded-2xl glass-card px-4 py-3 text-sm">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-info" />
        <div className="min-w-0">
          <p className="font-semibold">Locking GPS…</p>
          <p className="text-xs text-muted-foreground">Reaching for high-accuracy fix · target {threshold} m</p>
        </div>
      </div>
    );
  }

  if (state.status === "verified") {
    const accurate = state.accuracy <= threshold;
    return (
      <div className="animate-fade-up flex items-center gap-3 rounded-2xl glass-card px-4 py-3 text-sm shadow-glow-green">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success/15">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-success">Location verified</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> Accuracy ±{Math.round(state.accuracy)} m {accurate ? "· high precision" : "· approximate"}
          </p>
        </div>
        <button onClick={onRetry} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-white">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      <p className="min-w-0 flex-1 text-warning">{state.message}</p>
      <button onClick={onRetry} className="shrink-0 rounded-lg bg-warning/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-warning">
        Retry
      </button>
    </div>
  );
}
