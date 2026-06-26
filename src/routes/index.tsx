import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Users, Timer, Activity } from "lucide-react";
import { EmergencyTypeModal } from "@/components/EmergencyTypeModal";
import { EmergencyActive } from "@/components/EmergencyActive";
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

  function handleSOS() {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 4000 });
    }
    setPicker(true);
  }

  return (
    <main className="bg-hero relative">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-10 text-center sm:pt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
          Live across Bengaluru
        </div>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Your nearest hero.<br />
          <span className="text-primary">In seconds.</span>
        </h1>
        <p className="mt-4 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
          ResQNear instantly routes your SOS to a trained doctor, nurse or first-aider within minutes — while we alert 112.
        </p>

        {/* SOS button */}
        <div className="relative my-10 grid place-items-center">
          <span className="pointer-events-none absolute h-56 w-56 rounded-full bg-primary/40 animate-pulse-ring" />
          <span className="pointer-events-none absolute h-56 w-56 rounded-full bg-primary/25 animate-pulse-ring" style={{ animationDelay: "0.9s" }} />
          <button
            onClick={handleSOS}
            className="animate-heartbeat relative grid h-52 w-52 place-items-center rounded-full bg-gradient-to-br from-primary to-red-800 text-primary-foreground shadow-glow ring-8 ring-primary/20 transition active:scale-95"
          >
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black tracking-tighter">SOS</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/85">Press &amp; Hold</span>
            </div>
          </button>
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Tap in Emergency</p>
        <p className="mt-2 text-xs text-muted-foreground">We'll find your location and alert nearby heroes instantly.</p>

        {/* Stats */}
        <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Users, label: "247 Heroes Near You", sub: "within 2 km radius", tint: "text-primary" },
            { icon: Timer, label: "< 3 Min Response", sub: "average dispatch time", tint: "text-success" },
            { icon: Activity, label: "24/7 Active", sub: "always-on AI dispatcher", tint: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 bg-card/80 p-5 text-left shadow-card-soft backdrop-blur">
              <s.icon className={`h-5 w-5 ${s.tint}`} />
              <div className="mt-3 text-lg font-bold">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Powered by hyperlocal AI dispatch · India only
        </div>
      </section>

      {picker && (
        <EmergencyTypeModal
          onClose={() => setPicker(false)}
          onSelect={(c) => { setPicker(false); setActive(c); }}
        />
      )}
      {active && <EmergencyActive category={active} onClose={() => setActive(null)} />}
    </main>
  );
}
