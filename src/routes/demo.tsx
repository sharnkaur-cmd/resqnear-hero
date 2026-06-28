import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, RotateCcw, Cpu, MapPin, CheckCircle2 } from "lucide-react";
import { AID_CATEGORIES } from "@/lib/first-aid";
import { pickRandomHero, type Hero } from "@/lib/heroes";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live Demo — ResQNear" },
      {
        name: "description",
        content:
          "Watch the full ResQNear emergency flow in action: SOS, AI triage, hero dispatch and guided first aid.",
      },
    ],
  }),
  component: DemoPage,
});

type Step = { title: string; description: string };

function DemoPage() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [severity, setSeverity] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const heroRef = useRef<Hero>(pickRandomHero());
  const hero = heroRef.current;
  const category = AID_CATEGORIES[0]; // Cardiac Arrest

  const FLOW: Step[] = useMemo(
    () => [
      {
        title: "SOS Pressed",
        description: "Citizen pressed the SOS button. Location locked: Koramangala, Bengaluru.",
      },
      {
        title: "Emergency Type",
        description: "AI detected Cardiac Arrest. Confidence: 98%.",
      },
      {
        title: "AI Triage",
        description: "Severity Score: 92. Priority: Critical. Matching nearby specialists...",
      },
      {
        title: "Hero Dispatched",
        description: `Nearest verified doctor found. ${hero.name} assigned. Distance: ${hero.distanceM} meters. ETA: 2.8 minutes.`,
      },
      {
        title: "First Aid Guidance",
        description: "Voice instructions started. CPR guidance provided to bystander.",
      },
      {
        title: "112 Alerted",
        description: "Ambulance dispatched. Police notified if required. ETA: 4 minutes.",
      },
      {
        title: "Hero Arrived",
        description: "Doctor reached patient. Emergency stabilized. Case marked successful.",
      },
    ],
    [hero],
  );

  const startSimulation = () => {
    setRunning(true);
    setCompleted(false);
    setStep(-1);
    setSeverity(0);
    setElapsedTime(0);
    heroRef.current = pickRandomHero({ last: hero.name });
  };

  const resetSimulation = () => {
    setRunning(false);
    setCompleted(false);
    setStep(-1);
    setSeverity(0);
    setElapsedTime(0);
    heroRef.current = pickRandomHero();
  };

  useEffect(() => {
    if (!running) return;

    let currentIndex = -1;
    const stepTimer = window.setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= FLOW.length - 1) {
        setStep(FLOW.length - 1);
        setCompleted(true);
        setRunning(false);
        window.clearInterval(stepTimer);
        return;
      }
      setStep(currentIndex);
    }, 3000);

    const severityTimer = window.setInterval(() => {
      setSeverity((value) => (value >= 92 ? 92 : value + 2));
    }, 120);

    const elapsedTimer = window.setInterval(() => {
      setElapsedTime((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(severityTimer);
      window.clearInterval(elapsedTimer);
    };
  }, [running, FLOW]);

  const progress = step < 0 ? 0 : Math.min(100, ((step + 1) / FLOW.length) * 100);
  const currentStep = step >= 0 ? FLOW[step] : null;
  const completedSteps = step >= 0 ? FLOW.slice(0, Math.max(0, step)) : [];
  const statusLabel = completed ? "Completed" : running ? "Running" : step >= 0 ? "Paused" : "Ready";

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 text-[#4cc9f0]" /> Investor Demo · Auto Simulation
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          See ResQNear <span className="text-gradient-primary">end-to-end</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A full SOS → AI triage → hero dispatch → guidance → life saved, simulated live.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={startSimulation}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-sos px-5 py-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-glow-red disabled:opacity-60"
          >
            <Play className="h-4 w-4" /> {running ? "Running…" : completed ? "Replay Simulation" : "Run Simulation"}
          </button>
          <button
            onClick={resetSimulation}
            className="inline-flex items-center gap-2 rounded-2xl glass px-4 py-3 text-sm font-semibold"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>

        <div className="mx-auto mt-5 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-gradient-blue-violet transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Step {Math.max(0, step + 1)} of {FLOW.length}
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl glass-card p-5">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-[#4cc9f0]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              How the app works in 7 steps
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {FLOW.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <div
                  key={s.title}
                  className={`rounded-2xl border p-3 transition-all duration-500 ${
                    done
                      ? "border-success/40 bg-success/10"
                      : current
                        ? "border-[#4cc9f0]/60 bg-[#4cc9f0]/10 shadow-[0_0_0_1px_rgba(76,201,240,0.2)]"
                        : "border-white/10 bg-white/[0.03] opacity-70"
                  } ${current ? "animate-pulse" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                      Step {i + 1}
                    </span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : current ? (
                      <span className="rounded-full bg-[#4cc9f0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#4cc9f0]">
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground">Next</span>
                    )}
                  </div>
                  <p className="font-extrabold text-white">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(67,97,238,0.2),transparent_65%)] p-0 shadow-[0_0_45px_rgba(67,97,238,0.15)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#4cc9f0]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  LIVE SIMULATION
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${completed ? "bg-success/15 text-success" : running ? "bg-[#4cc9f0]/15 text-[#4cc9f0]" : "bg-white/10 text-white/70"}`}>
                {completed ? "Completed" : running ? "Running" : "Ready"}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-extrabold text-white">Real-Time Emergency Response</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A live workflow simulation of the full ResQNear response path.
                  </p>
                </div>
                <div className={`h-3 w-3 rounded-full ${running ? "animate-pulse bg-[#4cc9f0]" : completed ? "bg-success" : "bg-white/20"}`} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  <span>Current Event</span>
                  <span>Step {step >= 0 ? step + 1 : 0} of {FLOW.length}</span>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xl font-extrabold text-white">
                    {currentStep ? currentStep.title : "Waiting for simulation"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {currentStep ? currentStep.description : "Press Run Simulation to begin the live emergency workflow."}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00d4aa] via-[#4361ee] to-[#7209b7] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    Elapsed Time
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-white">{elapsedTime}s</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-white">{statusLabel}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Activity Log
                </p>
                <ul className="mt-3 space-y-2">
                  {completedSteps.length > 0 ? (
                    completedSteps.map((item, index) => (
                      <li key={item.title} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>
                          <span className="font-semibold text-white">{item.title}</span>
                          {index === completedSteps.length - 1 && !completed ? " · In progress" : ""}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No events completed yet.</li>
                  )}
                </ul>
              </div>

              {completed && (
                <div className="mt-5 rounded-2xl border border-success/40 bg-success/10 p-4 text-success">
                  <p className="text-sm font-extrabold">Simulation Completed Successfully</p>
                  <p className="mt-1 text-sm text-success/80">
                    The full emergency response workflow has been demonstrated end to end.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl glass-card p-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#4cc9f0]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                AI Severity Analysis
              </p>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="font-mono text-5xl font-extrabold tabular-nums text-gradient-blue">
                {severity}%
              </div>
              <div className="pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Critical · Cardiac event likely
              </div>
            </div>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#00d4aa] via-[#4361ee] to-[#7209b7] transition-all duration-200"
                style={{ width: `${severity}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <div className="text-sm font-extrabold text-white">98%</div>Match
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <div className="text-sm font-extrabold text-white">2.8m</div>ETA
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <div className="text-sm font-extrabold text-white">{hero.distanceM}m</div>Range
              </div>
            </div>
          </div>

          {step >= 3 && (
            <div className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-blue-violet p-5 text-white shadow-glow-blue">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
                Hero Matched
              </p>
              <p className="mt-1 text-xl font-extrabold">{hero.name}</p>
              <p className="text-sm text-white/90">{hero.skill}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/85">
                <MapPin className="h-3 w-3" /> {hero.distanceM} m · {hero.area}
              </p>
            </div>
          )}

          {step >= 4 && (
            <div className="animate-fade-up rounded-3xl glass-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                First-Aid Guidance
              </p>
              <p className="mt-1 text-sm font-extrabold">
                {category.emoji} {category.title}
              </p>
              <ol className="mt-3 space-y-1.5">
                {category.steps.slice(0, Math.min(5, step - 2)).map((s, i) => (
                  <li
                    key={i}
                    className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-xs"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-blue-violet text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
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
              <div className="relative text-sm font-extrabold">
                Hero Arrived · Life Saved · Total time 2 min 48 sec
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
