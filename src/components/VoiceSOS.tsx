import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Languages } from "lucide-react";

type Props = {
  onTranscript: (text: string, lang: "en-IN" | "hi-IN") => void;
};

// Minimal cross-browser SpeechRecognition typing
type SRConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceSOS({ onTranscript }: Props) {
  const [lang, setLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<InstanceType<SRConstructor> | null>(null);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  function start() {
    if (typeof window === "undefined") return;
    const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setError("Voice not supported on this browser."); return; }
    setError(null);
    setTranscript("");
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscript(t);
    };
    rec.onerror = (e) => { setError(e.error || "Mic error"); setListening(false); };
    rec.onend = () => {
      setListening(false);
      setTranscript((t) => { if (t.trim()) onTranscript(t.trim(), lang); return t; });
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  function stop() { try { recRef.current?.stop(); } catch { /* noop */ } setListening(false); }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={listening ? stop : start}
          aria-label={listening ? "Stop voice SOS" : "Speak emergency"}
          className={`group flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition active:scale-95 ${
            listening ? "bg-[#E94560] text-white shadow-glow-red animate-pulse-soft" : "glass glass-hover text-white"
          }`}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? "Listening…" : "Voice SOS"}
        </button>
        <button
          onClick={() => setLang((l) => (l === "en-IN" ? "hi-IN" : "en-IN"))}
          className="flex items-center gap-1 rounded-full glass px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/85"
        >
          <Languages className="h-3.5 w-3.5" /> {lang === "en-IN" ? "EN" : "हिं"}
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
