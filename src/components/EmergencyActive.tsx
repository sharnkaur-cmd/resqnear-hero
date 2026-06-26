import { useEffect, useState } from "react";
import { Phone, X, MapPin, Clock, Activity, ShieldAlert } from "lucide-react";
import type { AidCategory } from "@/lib/first-aid";
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F0F1A] text-white">
      {/* dramatic red flash backdrop */}
      <div className="pointer-events-none absolute inset-0 animate-red-flash" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(233,69,96,0.45),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,45,85,0.35),transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl px-5 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-[#FF2D55]" />
            Live · Broadcasting
          </div>
          <button onClick={onClose} aria-label="Cancel emergency" className="grid h-10 w-10 place-items-center rounded-full glass hover:bg-white/15">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-sos shadow-glow-red">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 animate-pulse-soft text-3xl font-extrabold tracking-tight text-gradient-primary sm:text-4xl">
            EMERGENCY ACTIVE
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {category.emoji} {category.title} — broadcasting to heroes within 1 km
          </p>
        </div>

        {/* Hero card */}
        <div className="mt-6 overflow-hidden rounded-3xl glass-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-info">Nearest Hero Matched</p>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">Top Hero</span>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold">{hero.name}</p>
              <p className="text-sm text-white/80">{hero.skill}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                <MapPin className="h-3.5 w-3.5" /> {hero.distanceM} m away · {hero.area}
              </p>
            </div>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-2xl font-black text-white shadow-glow-red">
              {hero.name.split(" ").slice(-1)[0][0]}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Clock className="h-4 w-4" /> ETA countdown
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-gradient-primary">{formatTime(seconds)}</div>
          </div>

          <a
            href="tel:112"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00D4AA] px-5 py-4 text-lg font-extrabold uppercase tracking-wider text-[#0F0F1A] shadow-glow-green transition active:scale-[0.98]"
          >
            <Phone className="h-5 w-5" /> CALL HERO · 112
          </a>
        </div>

        {/* First aid steps */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/85">
            <Activity className="h-4 w-4 text-[#FF2D55]" /> AI First-Aid Guidance
          </div>
          <ol className="mt-3 space-y-2">
            {category.steps.map((step, i) => (
              <li
                key={i}
                className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl glass-card p-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-white/95">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 mb-4 flex items-center justify-center gap-2 rounded-full glass px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white/85">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#FF2D55]" />
          Also alerting 112
        </div>
      </div>
    </div>
  );
}
