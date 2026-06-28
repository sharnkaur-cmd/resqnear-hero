import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Users, Timer, Activity, BookOpen, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { EmergencyTypeModal } from "@/components/EmergencyTypeModal";
import { EmergencyActive } from "@/components/EmergencyActive";
import { GpsIndicator } from "@/components/GpsIndicator";
import { VoiceSOS } from "@/components/VoiceSOS";
import { useGps } from "@/hooks/use-gps";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResQNear — Your nearest hero. In seconds." },
      { name: "description", content: "Tap SOS and reach the nearest trained first responder in your neighbourhood. Built for India." },
    ],
  }),
  component: HomePage,
});

function useCounter(target: number, durationMs = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return v;
}

function guessCategoryFromText(text: string): AidCategory {
  const t = text.toLowerCase();
  const pairs: Array<[RegExp, string]> = [
    [/(heart|chest|cardiac|दिल|सीने)/, "Cardiac"],
    [/(choke|choking|गला)/, "Choking"],
    [/(burn|fire|जल|आग)/, "Burns"],
    [/(bleed|blood|कट|खून)/, "Bleeding"],
    [/(fracture|break|bone|हड्डी)/, "Fracture"],
    [/(faint|unconscious|बेहोश)/, "Unconscious"],
  ];
  for (const [re, key] of pairs) {
    if (re.test(t)) {
      const hit = EMERGENCY_CATEGORIES.find((c) => c.title.toLowerCase().includes(key.toLowerCase()));
      if (hit) return hit;
    }
  }
  return EMERGENCY_CATEGORIES[0];
}

function HomePage() {
  const [picker, setPicker] = useState(false);
  const [active, setActive] = useState<AidCategory | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const { state, verify, threshold } = useGps();
  const navigate = useNavigate();
  const armed = useRef(false);

  useEffect(() => { verify(); }, [verify]);

  function handleSOS() {
    if (state.status !== "verified" && state.status !== "requesting") verify();
    setPicker(true);
  }

  function handleVoice(text: string) {
    setVoiceNote(text);
    if (armed.current) return;
    armed.current = true;
    const cat = guessCategoryFromText(text);
    setActive(cat);
    setTimeout(() => { armed.current = false; }, 1500);
  }

  const coords = state.status === "verified" ? { lat: state.lat, lon: state.lon } : {};

  const lives = useCounter(1247);
  const responseSec = useCounter(180);

  return (
    <main className="relative">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-8 text-center sm:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
          24/7 Heroes Active Near You
        </div>

        <h1 className="mt-5 text-[44px] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
          Your nearest hero.<br />
          <span className="text-gradient-primary">In seconds.</span>
        </h1>
        <p className="mt-4 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
          ResQNear routes your SOS to a trained doctor, nurse or first-aider within minutes — while we alert 112.
        </p>

        <div className="mt-6 w-full max-w-sm">
          <GpsIndicator state={state} onRetry={verify} threshold={threshold} />
        </div>

        <div className="relative my-10 grid place-items-center">
          <span className="pointer-events-none absolute h-60 w-60 rounded-full bg-[#E94560]/40 animate-pulse-ring" />
          <span className="pointer-events-none absolute h-60 w-60 rounded-full bg-[#FF2D55]/25 animate-pulse-ring" style={{ animationDelay: "1s" }} />
          <button
            onClick={handleSOS}
            aria-label="Trigger SOS"
            className="animate-heartbeat relative grid h-56 w-56 place-items-center rounded-full bg-gradient-sos text-white shadow-glow-red ring-[6px] ring-white/10 transition active:scale-95"
            style={{ boxShadow: "0 0 60px rgba(233,69,96,0.6), inset 0 4px 24px rgba(255,255,255,0.18), inset 0 -8px 28px rgba(0,0,0,0.35)" }}
          >
            <div className="flex flex-col items-center">
              <span className="text-[72px] font-black leading-none tracking-tighter">SOS</span>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.32em] text-white/90">Press &amp; Hold</span>
            </div>
          </button>
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.32em] text-gradient-sos">Tap in Emergency</p>

        <div className="mt-5 flex flex-col items-center gap-3">
          <VoiceSOS onTranscript={handleVoice} />
          {voiceNote && <p className="text-[11px] text-muted-foreground">Heard: “{voiceNote}”</p>}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-[#4cc9f0]" />
          {state.status === "verified"
            ? `${state.lat.toFixed(3)}°, ${state.lon.toFixed(3)}° · ±${Math.round(state.accuracy)}m`
            : "Detecting your location…"}
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={ShieldCheck} value={lives.toLocaleString("en-IN")} label="Lives Protected" sub="and counting" tint="bg-gradient-blue" border="from-[#4361ee] to-[#4cc9f0]" />
          <StatCard icon={Timer} value={`< ${Math.max(1, Math.round(responseSec / 60))} min`} label="Average Response" sub="from SOS to hero" tint="bg-gradient-violet" border="from-[#667eea] to-[#764ba2]" />
          <StatCard icon={Activity} value="24/7" label="Active Heroes" sub="always-on coverage" tint="bg-gradient-blue-violet" border="from-[#4361ee] to-[#7209b7]" />
        </div>

        <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:max-w-md">
          <Link to="/first-aid" className="glass glass-hover flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-white/10">
            <BookOpen className="h-4 w-4 text-[#4cc9f0]" /> First-Aid Guide
          </Link>
          <Link to="/heroes" className="glass glass-hover flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-white/10">
            <Users className="h-4 w-4 text-success" /> Top Heroes
          </Link>
        </div>

        <button
          onClick={() => navigate({ to: "/demo" })}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-blue-violet px-5 py-3 text-sm font-extrabold uppercase tracking-[0.22em] text-white shadow-glow-blue transition hover:scale-[1.03] active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" /> Try Demo
        </button>
      </section>

      {picker && (
        <EmergencyTypeModal
          onClose={() => setPicker(false)}
          onSelect={(c) => { setPicker(false); setActive(c); }}
        />
      )}
      {active && <EmergencyActive category={active} onClose={() => setActive(null)} userLat={coords.lat} userLon={coords.lon} />}
    </main>
  );
}

function StatCard({ icon: Icon, value, label, sub, tint, border }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string; sub: string; tint: string; border: string }) {
  return (
    <div className="group relative animate-fade-up overflow-hidden rounded-2xl glass-card p-5 text-left glass-hover hover:-translate-y-0.5 hover:border-white/20">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${border}`} />
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint} text-white shadow-glow-blue`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="font-mono text-2xl font-extrabold tabular-nums text-white">{value}</div>
      </div>
      <div className="mt-3 text-base font-bold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
