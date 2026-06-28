import { useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type Props = {
  onTranscript: (text: string) => void | Promise<void>;
  busy?: boolean;
};

export function VoiceSOS({ onTranscript, busy = false }: Props) {
  const { listening, supported, error, controller } = useSpeechRecognition(onTranscript);

  const startListening = useCallback(() => {
    if (busy || listening) return;
    controller.start();
  }, [busy, controller, listening]);

  const stopListening = useCallback(() => {
    if (listening) controller.stop();
  }, [controller, listening]);

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center">
        <button
          onPointerDown={startListening}
          onPointerUp={stopListening}
          onPointerLeave={stopListening}
          onPointerCancel={stopListening}
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}
          onTouchEnd={stopListening}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              startListening();
            }
          }}
          onKeyUp={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              stopListening();
            }
          }}
          onBlur={stopListening}
          disabled={busy}
          aria-label={listening ? "Stop voice SOS" : "Speak emergency"}
          className={`group flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
            listening
              ? "bg-[#E94560] text-white shadow-glow-red animate-pulse-soft"
              : "glass glass-hover text-white"
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {busy ? "Classifying…" : listening ? "Listening…" : "Voice SOS"}
        </button>
      </div>
      {!supported && (
        <p className="mt-2 text-center text-[10px] text-[#FF2D55]">
          Speech recognition unsupported.
        </p>
      )}
      {error && <p className="mt-2 text-center text-[10px] text-[#FF2D55]">{error}</p>}
    </div>
  );
}
