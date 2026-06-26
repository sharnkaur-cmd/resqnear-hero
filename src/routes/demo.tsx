import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, RotateCcw, Cpu, MapPin, CheckCircle2 } from "lucide-react";
import { AID_CATEGORIES } from "@/lib/first-aid";
import { pickRandomHero, type Hero } from "@/lib/heroes";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live Demo — ResQNear" },
      { name: "description", content: "Watch the full ResQNear emergency flow in action: SOS, AI triage, hero dispatch and guided first aid." },
    ],
  }),
  component: DemoPage,
});

type Step = { label: string; detail: string };

function DemoPage() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [severity, setSeverity] = useState(0);
  const heroRef = useRef<Hero>(pickRandomHero());
  const hero = heroRef.current;
  const category = AID_CATEGORIES[0]; // Cardiac Arrest

  const FLOW: Step[] = useMemo(() => ([
    { label: "SOS Pressed", detail: "Citizen taps SOS · location locked at Koramangala, Bengaluru" },
    { label: "Emergency Type", detail: "Cardiac Arrest auto-selected" },
    { label: "AI Triage (Gemini)", detail: "Severity 92 · Critical · Cardiologist matched" },
    { label: "Hero Dispatched", detail: `${hero.name} (${hero.skill}) · ${hero.distanceM} m away · ETA 2.8 min` },
    { label: "First-Aid Guidance", detail: "Bystander walked through CPR step-by-step over voice" },
    { label: "112 Alerted", detail: "Ambulance dispatched in parallel · ETA 4 min" },
    { label: "Hero Arrived — Life Saved", detail: "Total response time 2 min 48 sec" },
  ]), [hero]);

  useEffect(() => {
    if (!running) return;
    setStep(-1);
    setSeverity(0);
    heroRef.current = pickRandomHero({ last: hero.name });
    const timers: number[] = [];
    FLOW.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStep(i), 2000 * (i + 1)));
    });
    const sevTimer = window.setInterval(() => {
      setSeverity((v) => (v >= 92 ? 92 : v + 2));
    }, 100);
    timers.push(sevTimer as unknown as number);
    const stop = window.setTimeout(() => {
      setRunning(false);
      clearInterval(sevTimer);
    }, 2000 * (FLOW.length + 1));
    timers.push(stop);
    return () => timers.forEach((t) => clearTimeout(t));
     
  }, [running]);

  const progress = step < 0 ? 0 : Math.min(100, ((step + 1) / FLOW.length) * 100);

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 text-[#4cc9f0]" /> Investor Demo · Auto Simulation
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          See ResQNear <span className="text-gradient-primary">end-to-end</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">A full SOS → AI triage → hero dispatch → guidance → life saved, simulated live.</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setRunning(true)}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-sos px-5 py-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-glow-red disabled:opacity-60"
          >
            <Play className="h-4 w-4" /> {running ? "Running…" : "Run Simulation"}
          </button>
          <button
            onClick={() => { setRunning(false); setStep(-1); setSeverity(0); }}
            className="inline-flex items-center gap-2 rounded-2xl glass px-4 py-3 text-sm font-semibold"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>

        <div className="mx-auto mt-5 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-gradient-blue-violet transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Step {Math.max(0, step + 1)} of {FLOW.length}
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <ol className="space-y-3">
          {FLOW.map((s, i) => {
            const done = i <= step;
            const current = i === step;
            return (
              <li key={s.label} className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl p-4 transition ${done ? "glass-card border-white/15" : "glass opacity-60"}`}>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold transition ${done ? "bg-gradient-blue-violet text-white shadow-glow-blue" : "bg-white/5 text-muted-foreground"} ${current ? "ring-4 ring-[#4361ee]/30" : ""}`}>
                  {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="space-y-4">
          <div className="rounded-3xl glass-card p-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#4cc9f0]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">AI Severity Analysis</p>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="font-mono text-5xl font-extrabold tabular-nums text-gradient-blue">{severity}%</div>
              <div className="pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Critical · Cardiac event likely</div>
            </div>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full bg-gradient-to-r from-[#00d4aa] via-[#4361ee] to-[#7209b7] transition-all duration-200" style={{ width: `${severity}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2"><div className="text-sm font-extrabold text-white">98%</div>Match</div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2"><div className="text-sm font-extrabold text-white">2.8m</div>ETA</div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2"><div className="text-sm font-extrabold text-white">{hero.distanceM}m</div>Range</div>
            </div>
          </div>

          {step >= 3 && (
            <div className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-blue-violet p-5 text-white shadow-glow-blue">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">Hero Matched</p>
              <p className="mt-1 text-xl font-extrabold">{hero.name}</p>
              <p className="text-sm text-white/90">{hero.skill}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/85"><MapPin className="h-3 w-3" /> {hero.distanceM} m · {hero.area}</p>
            </div>
          )}

          {step >= 4 && (
            <div className="animate-fade-up rounded-3xl glass-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">First-Aid Guidance</p>
              <p className="mt-1 text-sm font-extrabold">{category.emoji} {category.title}</p>
              <ol className="mt-3 space-y-1.5">
                {category.steps.slice(0, Math.min(5, step - 2)).map((s, i) => (
                  <li key={i} className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-xs">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-blue-violet text-[10px] font-bold text-white">{i + 1}</span>
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {step >= 6 && (
            <div className="animate-fade-up relative flex items-center gap-3 overflow-hidden rounded-2xl border border-success/40 bg-success/10 p-4 text-success">
              <span className="absolute -left-2 -top-2 h-12 w-12 animate-ripple rounded-full bg-success/40" />
              <CheckCircle2 className="relative h-5 w-5" />
              <div className="relative text-sm font-extrabold">Hero Arrived · Life Saved · Total time 2 min 48 sec</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
