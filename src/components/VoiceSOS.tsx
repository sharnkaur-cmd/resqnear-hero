import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

type Props = {
  onTranscript: (text: string) => void | Promise<void>;
  busy?: boolean;
};

type SRResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type SRInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<SRResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SRConstructor = new () => SRInstance;

export function VoiceSOS({ onTranscript, busy = false }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SRInstance | null>(null);
  const finalTextRef = useRef("");

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  function start() {
    if (typeof window === "undefined" || busy) return;

    const w = window as unknown as {
      SpeechRecognition?: SRConstructor;
      webkitSpeechRecognition?: SRConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice not supported on this browser.");
      return;
    }

    setError(null);
    setTranscript("");
    finalTextRef.current = "";

    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += piece;
        else interim += piece;
      }
      if (finalChunk) finalTextRef.current = `${finalTextRef.current}${finalChunk}`.trim();
      setTranscript(finalTextRef.current || interim);
    };

    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(e.error || "Mic error");
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      const text = finalTextRef.current.trim();
      if (text) void onTranscript(text);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start microphone.");
      setListening(false);
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }

  const disabled = busy;

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center">
        <button
          onClick={listening ? stop : start}
          disabled={disabled}
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
      {transcript && (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 text-center text-xs text-white/85">
          “{transcript}”
        </p>
      )}
      {error && <p className="mt-1 text-center text-[10px] text-[#FF2D55]">{error}</p>}
    </div>
  );
}
