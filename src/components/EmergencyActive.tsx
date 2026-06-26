import { useEffect, useState } from "react";
import { Phone, X, MapPin, Clock, Activity, ShieldAlert } from "lucide-react";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";
import { HEROES } from "@/lib/heroes";

type Props = { category: AidCategory; onClose: () => void };

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function EmergencyActive({ category, onClose }: Props) {
  const [seconds, setSeconds] = useState(300);
  const hero = HEROES[0];

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-primary text-primary-foreground">
      {/* pulsing red overlay */}
      <div className="pointer-events-none absolute inset-0 animate-pulse-soft bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18),transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl px-5 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-white" />
            Live
          </div>
          <button onClick={onClose} aria-label="Cancel emergency" className="grid h-10 w-10 place-items-center rounded-full bg-black/30 hover:bg-black/50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 animate-pulse-soft" />
          <h1 className="mt-3 animate-pulse-soft text-3xl font-extrabold tracking-tight sm:text-4xl">
            EMERGENCY ACTIVE
          </h1>
          <p className="mt-1 text-sm text-white/85">
            {category.emoji} {category.title} — broadcasting to heroes within 1 km
          </p>
        </div>

        {/* Hero card */}
        <div className="mt-6 rounded-2xl bg-black/30 p-5 shadow-card-soft ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-widest text-white/70">Nearest Hero Matched</p>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{hero.name}</p>
              <p className="text-sm text-white/80">{hero.skill}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                <MapPin className="h-3.5 w-3.5" /> {hero.distanceM} m away · {hero.area}
              </p>
            </div>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-black">
              {hero.name.split(" ").slice(-1)[0][0]}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Clock className="h-4 w-4" /> ETA countdown
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums">{formatTime(seconds)}</div>
          </div>

          <a
            href="tel:112"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-4 text-lg font-bold text-success-foreground shadow-lg transition active:scale-[0.98]"
          >
            <Phone className="h-5 w-5" /> CALL HERO · 112
          </a>
        </div>

        {/* First aid steps */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/85">
            <Activity className="h-4 w-4" /> AI First-Aid Guidance
          </div>
          <ol className="mt-3 space-y-2">
            {category.steps.map((step, i) => (
              <li
                key={i}
                className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl bg-black/25 p-4 ring-1 ring-white/10"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-white/95">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 mb-4 flex items-center justify-center gap-2 rounded-full bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/85">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-white" />
          Also alerting 112
        </div>
      </div>
    </div>
  );
}
