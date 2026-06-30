import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  X,
  Phone,
  Mic,
  AlertTriangle,
  Cpu,
  Loader2,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import type { AidCategory } from "@/lib/first-aid";
import type { EmergencyTypeLabel } from "@/lib/aiEmergency";
import { HeroMap } from "@/components/HeroMap";
import { pickRandomHero, type Hero } from "@/lib/heroes";
import { buildNearbyHeroes, findNearbyDoctors, type NearbyHero } from "@/lib/nearby";
import { saveEmergency } from "@/lib/supabase";
import { speakText } from "@/lib/speak";

type Props = {
  category: AidCategory;
  label: EmergencyTypeLabel;
  guidanceSteps: string[];
  speech: string;
  onClose: () => void;
  userLat?: number;
  userLon?: number;
  locationLabel?: string;
  loading?: boolean;
};

function formatAmbulanceTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VoiceEmergencyActive({
  category,
  label,
  guidanceSteps,
  speech,
  onClose,
  userLat,
  userLon,
  locationLabel,
  loading = false,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [liveNearby, setLiveNearby] = useState<NearbyHero[]>([]);
  const escalated = secondsLeft === 0;
  const heroRef = useRef<Hero>(useMemo(() => pickRandomHero(), []));
  const lastSpokenGuidanceRef = useRef("");
  const hero = heroRef.current;
  const userLatSafe = userLat ?? 12.9352;
  const userLonSafe = userLon ?? 77.6245;
  const findDoctors = useServerFn(findNearbyDoctors);

  useEffect(() => {
    if (!userLat || !userLon) {
      setLiveNearby([]);
      return;
    }

    let cancelled = false;
    findDoctors({ data: { lat: userLat, lon: userLon, radius: 8000, limit: 5 } })
      .then((doctors) => {
        if (!cancelled) setLiveNearby(doctors);
      })
      .catch(() => {
        if (!cancelled) setLiveNearby([]);
      });

    return () => {
      cancelled = true;
    };
  }, [findDoctors, userLat, userLon]);

  const nearby = useMemo(() => {
    if (liveNearby.length > 0) return liveNearby;
    return buildNearbyHeroes(userLatSafe, userLonSafe, hero, 5);
  }, [hero, liveNearby, userLatSafe, userLonSafe]);
  const matched = nearby[0];

  useEffect(() => {
    if (loading) return;
    saveEmergency({
      type: `Voice SOS · ${label}`,
      lat: userLat ?? null,
      lon: userLon ?? null,
      hero_name: "Voice SOS",
      severity: "High",
      severity_score: 85,
    }).catch(() => {});
  }, [label, loading, userLat, userLon]);

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const steps = useMemo(() => guidanceSteps.slice(0, 5), [guidanceSteps]);
  const guidanceText = useMemo(() => [category.title, ...steps].join(" "), [category.title, steps]);

  useEffect(() => {
    if (loading || steps.length === 0 || !guidanceText.trim()) return;
    if (guidanceText === lastSpokenGuidanceRef.current) return;
    lastSpokenGuidanceRef.current = guidanceText;
    setTimeout(() => speakText(guidanceText, "en-US"), 250);
  }, [guidanceText, loading, steps.length]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F0F1A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(114,9,183,0.35),transparent_60%)]" />

      <div className="relative mx-auto max-w-lg px-5 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest">
            <Mic className="h-3.5 w-3.5 text-[#a78bfa]" />
            Voice SOS Active
          </div>
          <button
            onClick={onClose}
            aria-label="Cancel voice emergency"
            className="grid h-10 w-10 place-items-center rounded-full glass hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-3xl glass-card p-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#4cc9f0]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Gemini AI · Voice Detection
            </p>
          </div>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing your emergency…
            </div>
          ) : (
            <>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Detected
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {category.emoji} {label}
              </p>
              {locationLabel && <p className="mt-1 text-xs text-white/50">{locationLabel}</p>}
            </>
          )}
        </div>

        {!loading && (
          <>
            <div className="mt-4">
              <HeroMap
                userLat={userLat}
                userLon={userLon}
                hero={hero}
                nearby={nearby}
                className="h-[300px]"
              />
            </div>

            <div className="mt-4 rounded-3xl glass-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {nearby.length} Hospitals Nearby
                </p>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-success">
                  Live
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {nearby.map((h, i) => (
                  <li
                    key={h.name}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                      i === 0
                        ? "border-[#7209b7]/60 bg-gradient-blue-violet/20"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-[#a78bfa]" : "bg-[#4361ee]"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{h.name}</p>
                      <p className="truncate text-[11px] text-white/70">
                        {h.skill} · {h.area}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="flex items-center justify-end gap-1 text-xs font-bold text-white">
                        <Navigation className="h-3 w-3" /> {h.distanceKm.toFixed(2)} km
                      </p>
                      <p className="flex items-center justify-end gap-1 text-[11px] text-white/70">
                        <Clock className="h-3 w-3" /> {h.etaMin} min ETA
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-blue-violet p-5 text-white shadow-glow-blue">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/85">
                  Nearest Hospital
                </p>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black text-white">
                  {matched.distanceKm.toFixed(2)} km
                </span>
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xl font-extrabold">{matched.name}</p>
                  <p className="text-sm text-white/85">{matched.skill}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                    <MapPin className="h-3.5 w-3.5" /> {matched.distanceKm.toFixed(2)} km · ETA{" "}
                    {matched.etaMin} min
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      matched.skill.includes("CPR") || matched.skill.includes("Doctor")
                        ? "CPR Trained"
                        : matched.skill,
                      matched.distanceKm < 0.6 ? "Nearby" : "On route",
                      "Available Now",
                    ].map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success ring-1 ring-success/40"
                      >
                        <CheckCircle2 className="h-3 w-3" /> {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-black text-white backdrop-blur">
                  {matched.name.trim()[0]}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl glass-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gradient-blue">
                AI Guidance
              </p>
              <ol className="mt-3 space-y-2">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-blue-violet text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-white/95">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div
              className={`mt-4 rounded-3xl p-5 ${
                escalated ? "border border-[#FF2D55]/40 bg-[#FF2D55]/10" : "glass-card"
              }`}
            >
              {escalated ? (
                <>
                  <div className="flex items-center gap-2 text-[#FF8FA3]">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm font-extrabold uppercase tracking-widest">
                      Emergency services are being contacted…
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { n: "108", l: "Ambulance" },
                      { n: "112", l: "Emergency" },
                      { n: "101", l: "Fire" },
                      { n: "100", l: "Police" },
                    ].map((x) => (
                      <a
                        key={x.n}
                        href={`tel:${x.n}`}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-sm font-extrabold text-white ring-1 ring-white/15 transition active:scale-95"
                      >
                        <Phone className="h-4 w-4" /> {x.n} · {x.l}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Ambulance Escalation
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    Calling ambulance in{" "}
                    <span className="font-mono text-2xl font-extrabold tabular-nums text-gradient-sos">
                      {formatAmbulanceTimer(secondsLeft)}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    Cancel now to stop escalation · {category.title}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
