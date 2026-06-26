import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Timer, Activity, BookOpen, ShieldCheck, MapPin } from "lucide-react";
import { EmergencyTypeModal } from "@/components/EmergencyTypeModal";
import { EmergencyActive } from "@/components/EmergencyActive";
import { GpsIndicator } from "@/components/GpsIndicator";
import { useGps } from "@/hooks/use-gps";
import type { AidCategory } from "@/lib/first-aid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResQNear — Your nearest hero. In seconds." },
      { name: "description", content: "Tap SOS and reach the nearest trained first responder in your neighbourhood. Built for India." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [picker, setPicker] = useState(false);
  const [active, setActive] = useState<AidCategory | null>(null);
  const { state, verify, threshold } = useGps();

  useEffect(() => { verify(); }, [verify]);

  function handleSOS() {
    if (state.status !== "verified" && state.status !== "requesting") verify();
    setPicker(true);
  }

  const coords = state.status === "verified" ? { lat: state.lat, lon: state.lon } : {};

  return (
    <main className="relative">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-8 text-center sm:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
          247 Heroes Active Near You
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
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-[#4cc9f0]" />
          {state.status === "verified" ? "Koramangala, Bengaluru" : "Detecting your area…"}
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="247 Heroes Nearby" sub="within 2 km radius" tint="bg-gradient-blue" border="from-[#4361ee] to-[#4cc9f0]" />
          <StatCard icon={Timer} label="< 3 Min Response" sub="average dispatch time" tint="bg-gradient-violet" border="from-[#667eea] to-[#764ba2]" />
          <StatCard icon={Activity} label="24/7 Active Coverage" sub="always-on AI dispatcher" tint="bg-gradient-blue-violet" border="from-[#4361ee] to-[#7209b7]" />
        </div>

        <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:max-w-md">
          <Link to="/first-aid" className="glass glass-hover flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-white/10">
            <BookOpen className="h-4 w-4 text-[#4cc9f0]" /> First-Aid Guide
          </Link>
          <Link to="/heroes" className="glass glass-hover flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-white/10">
            <ShieldCheck className="h-4 w-4 text-success" /> Top Heroes
          </Link>
        </div>
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

function StatCard({ icon: Icon, label, sub, tint, border }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string; tint: string; border: string }) {
  return (
    <div className="group relative animate-fade-up overflow-hidden rounded-2xl glass-card p-5 text-left glass-hover hover:-translate-y-0.5 hover:border-white/20">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${border}`} />
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint} text-white shadow-glow-blue`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-base font-bold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
