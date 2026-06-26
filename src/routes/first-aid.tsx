import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Volume2, Square, Phone } from "lucide-react";
import { AID_CATEGORIES, EMERGENCY_NUMBERS } from "@/lib/first-aid";
import { speak, stopSpeaking } from "@/lib/speak";

export const Route = createFileRoute("/first-aid")({
  head: () => ({
    meta: [
      { title: "AI First-Aid Guide — ResQNear" },
      { name: "description", content: "Step-by-step first-aid for cardiac arrest, fire, accidents, choking and more. Built for India." },
    ],
  }),
  component: FirstAidPage,
});

function FirstAidPage() {
  const [active, setActive] = useState(AID_CATEGORIES[0]);
  const [speaking, setSpeaking] = useState(false);

  function toggleSpeak() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const text = `${active.title} first aid. ${active.steps.map((s, i) => `Step ${i + 1}. ${s}`).join(" ")}`;
    speak(text);
    setSpeaking(true);
    setTimeout(() => setSpeaking(false), text.length * 60);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AI First-Aid Guide</div>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">What do I do, right now?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick the situation. Follow the steps. We'll read them aloud.</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {AID_CATEGORIES.map((c) => {
          const isActive = c.id === active.id;
          return (
            <button
              key={c.id}
              onClick={() => { stopSpeaking(); setSpeaking(false); setActive(c); }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-4 text-left text-white shadow-card-soft transition active:scale-95 ${isActive ? "ring-4 ring-white/70" : "opacity-90 hover:opacity-100"}`}
            >
              <div className="text-2xl">{c.emoji}</div>
              <div className="mt-1 text-sm font-bold leading-tight">{c.title}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-card-soft">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Step-by-step</p>
            <h2 className="truncate text-xl font-bold">{active.emoji} {active.title}</h2>
          </div>
          <button onClick={toggleSpeak} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            {speaking ? <><Square className="h-4 w-4" /> Stop</> : <><Volume2 className="h-4 w-4" /> Read Aloud</>}
          </button>
        </div>

        <ol className="mt-4 space-y-2">
          {active.steps.map((s, i) => (
            <li key={i} className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl bg-background/40 p-4 ring-1 ring-border/60" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</div>
              <p className="text-sm leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">India Emergency Numbers</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EMERGENCY_NUMBERS.map((n) => (
            <a key={n.code} href={`tel:${n.code}`} className="group rounded-2xl border border-border/60 bg-card p-4 text-center shadow-card-soft transition hover:border-primary">
              <Phone className="mx-auto h-4 w-4 text-primary" />
              <div className="mt-1 text-3xl font-extrabold tracking-tight">{n.code}</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{n.label}</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
