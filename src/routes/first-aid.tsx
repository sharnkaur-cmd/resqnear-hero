import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Volume2, Square, Phone } from "lucide-react";
import { AID_CATEGORIES, EMERGENCY_NUMBERS } from "@/lib/first-aid";
import { speakText, stopSpeaking } from "@/lib/speak";

export const Route = createFileRoute("/first-aid")({
  head: () => ({
    meta: [
      { title: "AI First-Aid Guide — ResQNear" },
      { name: "description", content: "Step-by-step first-aid for cardiac arrest, fire, accidents, choking and more. Built for India." },
    ],
  }),
  component: FirstAidPage,
});

const GRADIENTS: Record<string, string> = {
  cardiac: "bg-[linear-gradient(135deg,#764ba2,#f093fb)]",
  fire: "bg-[linear-gradient(135deg,#FF6B35,#F7931E)]",
  accident: "bg-[linear-gradient(135deg,#FFB830,#FF8C00)]",
  medical: "bg-[linear-gradient(135deg,#4CC9F0,#4361EE)]",
  safety: "bg-[linear-gradient(135deg,#7209B7,#560BAD)]",
  choking: "bg-[linear-gradient(135deg,#00D4AA,#00B4D8)]",
};

function FirstAidPage() {
  const [active, setActive] = useState(AID_CATEGORIES[0]);
  const [speaking, setSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");

  useEffect(() => {
    const saved = localStorage.getItem("first_aid_speech_language");
    if (saved) setSelectedLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("first_aid_speech_language", selectedLanguage);
  }, [selectedLanguage]);

  function toggleSpeak() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const text = `${active.title} first aid. ${active.steps.map((s, i) => `Step ${i + 1}. ${s}`).join(" ")}`;
    setSpeaking(true);
    speakText(text, selectedLanguage);
    setTimeout(() => setSpeaking(false), text.length * 60);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">AI First-Aid Guide</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          What do I do, <span className="text-gradient-primary">right now?</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick the situation. Follow the steps. We'll read them aloud.</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {AID_CATEGORIES.map((c) => {
          const isActive = c.id === active.id;
          return (
            <button
              key={c.id}
              onClick={() => { stopSpeaking(); setSpeaking(false); setActive(c); }}
              className={`relative overflow-hidden rounded-2xl ${GRADIENTS[c.id]} p-4 text-left text-white shadow-card transition active:scale-95 ${isActive ? "ring-2 ring-white/80 scale-[1.02]" : "opacity-90 hover:opacity-100 hover:scale-[1.02]"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
              <div className="relative text-2xl">{c.emoji}</div>
              <div className="relative mt-1 text-sm font-bold leading-tight">{c.title}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-3xl glass-card p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Step-by-step</p>
            <h2 className="truncate text-xl font-extrabold">{active.emoji} {active.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-semibold outline-none"
            >
              <option value="en-US">English</option>
              <option value="hi-IN">हिन्दी</option>
              <option value="pa-IN">ਪੰਜਾਬੀ</option>
            </select>
            <button onClick={toggleSpeak} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-blue-violet px-4 py-2.5 text-sm font-bold text-white shadow-glow-blue">
              {speaking ? <><Square className="h-4 w-4" /> Stop</> : <><Volume2 className="h-4 w-4" /> Read Aloud</>}
            </button>
          </div>
        </div>

        <ol className="mt-4 space-y-2">
          {active.steps.map((s, i) => (
            <li key={i} className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-blue-violet text-sm font-bold text-white">{i + 1}</div>
              <p className="text-sm leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">India Emergency Numbers</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EMERGENCY_NUMBERS.map((n) => (
            <a key={n.code} href={`tel:${n.code}`} className="group rounded-2xl glass-card p-4 text-center transition hover:-translate-y-0.5 hover:border-white/20">
              <Phone className="mx-auto h-4 w-4 text-[#4cc9f0]" />
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-gradient-primary">{n.code}</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{n.label}</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
