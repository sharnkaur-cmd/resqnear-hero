import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock, Cpu, Heart, Loader as Loader2, MapPin, Navigation, Phone, ShieldAlert, Siren, Timer, Users, Volume2, VolumeX, X, Zap } from "lucide-react";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";
import { HEROES, HERO_POOL, pickRandomHero, type Hero } from "@/lib/heroes";
import { buildNearbyHeroes, type NearbyHero, haversineKm } from "@/lib/nearby";
import { speak, stopSpeaking } from "@/lib/speak";

export const Route = createFileRoute("/resq-hub")({
  head: () => ({
    meta: [
      { title: "ResQHub — Live Emergency Command Center" },
      { name: "description", content: "Live emergency simulation dashboard. Watch SOS dispatch, hero matching, and response in real-time." },
    ],
  }),
  component: ResQHubPage,
});

type EmergencyStatus = "idle" | "detecting" | "triage" | "dispatching" | "enroute" | "onsite" | "resolved";

type SimulatedEmergency = {
  id: string;
  type: string;
  category: AidCategory;
  severity: "Critical" | "High" | "Medium" | "Low";
  severityScore: number;
  status: EmergencyStatus;
  startTime: number;
  location: { lat: number; lon: number; label: string };
  hero: NearbyHero | null;
  elapsed: number;
  countdown: number;
};

const BENGALURU_CENTER = { lat: 12.9352, lon: 77.6245 };

const LOCATIONS = [
  "Koramangala 4th Block",
  "Indiranagar 100 Feet Road",
  "HSR Layout Sector 2",
  "BTM Layout 2nd Stage",
  "Whitefield Main Road",
  "Electronic City Phase 1",
  "Marathahalli Bridge",
  "Jayanagar 4th Block",
  "JP Nagar 6th Phase",
  "Bellandur Gate",
];

const STATUS_CONFIG: Record<EmergencyStatus, { label: string; color: string; icon: typeof Activity }> = {
  idle: { label: "Ready", color: "text-muted-foreground", icon: Activity },
  detecting: { label: "Detecting Location", color: "text-info", icon: Loader2 },
  triage: { label: "AI Triage", color: "text-[#4cc9f0]", icon: Cpu },
  dispatching: { label: "Dispatching Hero", color: "text-warning", icon: Zap },
  enroute: { label: "Hero En Route", color: "text-[#a78bfa]", icon: Navigation },
  onsite: { label: "Hero On Scene", color: "text-success", icon: CheckCircle2 },
  resolved: { label: "Resolved", color: "text-success", icon: CheckCircle2 },
};

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function useRandomSeed() {
  return useMemo(() => Math.random(), []);
}

function ResQHubPage() {
  const [emergency, setEmergency] = useState<SimulatedEmergency | null>(null);
  const [stats, setStats] = useState({ lives: 1247, responses: 2841, avgResponse: 178 });
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState(false);
  const seed = useRandomSeed();

  const startEmergency = useCallback(() => {
    const category = AID_CATEGORIES[Math.floor(seed * AID_CATEGORIES.length)];
    const severityScores: Record<string, number> = {
      cardic: 92,
      fire: 85,
      accident: 78,
      medical: 65,
      safety: 70,
      choking: 88,
    };
    const severityScore = severityScores[category.id] ?? 70;
    const severity: SimulatedEmergency["severity"] =
      severityScore >= 85 ? "Critical" : severityScore >= 70 ? "High" : severityScore >= 50 ? "Medium" : "Low";

    const locationIndex = Math.floor(seed * LOCATIONS.length);
    const lat = BENGALURU_CENTER.lat + (Math.random() - 0.5) * 0.05;
    const lon = BENGALURU_CENTER.lon + (Math.random() - 0.5) * 0.05;

    setEmergency({
      id: `EMG-${Date.now()}`,
      type: category.title,
      category,
      severity,
      severityScore,
      status: "detecting",
      startTime: Date.now(),
      location: { lat, lon, label: LOCATIONS[locationIndex] },
      hero: null,
      elapsed: 0,
      countdown: 180,
    });
  }, [seed]);

  const resetEmergency = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
    setEmergency(null);
  }, []);

  const toggleVoice = useCallback(() => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else if (emergency) {
      const steps = emergency.category.steps.slice(0, 4).join(". ");
      speak(`Emergency: ${emergency.type}. ${steps}`);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 15000);
    }
  }, [speaking, emergency]);

  useEffect(() => {
    if (!emergency) return;

    const stages: EmergencyStatus[] = ["detecting", "triage", "dispatching", "enroute", "onsite", "resolved"];
    const stageDurations = [2000, 3000, 2000, 8000, 4000, 2000];

    let currentStageIndex = stages.indexOf(emergency.status);
    if (currentStageIndex === -1) return;

    const timeouts: number[] = [];
    let accumulated = 0;

    for (let i = currentStageIndex; i < stages.length - 1; i++) {
      accumulated += stageDurations[i];
      timeouts.push(
        window.setTimeout(() => {
          setEmergency((prev) => {
            if (!prev) return null;
            const nextStatus = stages[i + 1];
            let updates: Partial<SimulatedEmergency> = { status: nextStatus };

            if (nextStatus === "dispatching" || nextStatus === "enroute") {
              const heroBase = pickRandomHero();
              const nearby = buildNearbyHeroes(prev.location.lat, prev.location.lon, heroBase, 5);
              updates.hero = nearby[0];
            }

            if (nextStatus === "resolved") {
              setStats((s) => ({
                lives: s.lives + 1,
                responses: s.responses + 1,
                avgResponse: Math.round((s.avgResponse + prev.elapsed) / 2),
              }));
            }

            return { ...prev, ...updates };
          });
        }, accumulated),
      );
    }

    return () => timeouts.forEach(clearTimeout);
  }, [emergency?.status]);

  useInterval(() => {
    setStats((s) => ({
      lives: s.lives + Math.floor(Math.random() * 2),
      responses: s.responses + Math.floor(Math.random() * 3),
      avgResponse: Math.max(60, s.avgResponse + Math.floor(Math.random() * 10) - 5),
    }));
  }, 5000);

  useInterval(() => {
    setEmergency((prev) => {
      if (!prev || prev.status === "resolved") return prev;
      const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
      const countdown = Math.max(0, 180 - elapsed);
      return { ...prev, elapsed, countdown };
    });
  }, emergency && emergency.status !== "resolved" ? 1000 : null);

  const nearbyHeroes = useMemo(() => {
    if (!emergency) return [];
    const heroBase = pickRandomHero();
    return buildNearbyHeroes(emergency.location.lat, emergency.location.lon, heroBase, 8);
  }, [emergency]);

  return (
    <main className="min-h-screen bg-aurora pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Siren className="h-3.5 w-3.5 text-[#E94560]" />
            Live Emergency Command Center
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            ResQ<span className="text-gradient-primary">Hub</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time emergency simulation dashboard · No backend · 100% frontend
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} value={stats.lives.toLocaleString("en-IN")} label="Lives Saved" trend={Math.floor(Math.random() * 10)} />
          <StatCard icon={Activity} value={stats.responses.toLocaleString("en-IN")} label="Responses" trend={Math.floor(Math.random() * 5)} />
          <StatCard icon={Timer} value={`${Math.round(stats.avgResponse / 60)}:${(stats.avgResponse % 60).toString().padStart(2, "0")}`} label="Avg Response" unit="min" />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={startEmergency}
            disabled={!!emergency && emergency.status !== "resolved"}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-sos px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-red transition disabled:opacity-60"
          >
            <ShieldAlert className="h-5 w-5" />
            Simulate Emergency
          </button>
          {emergency && (
            <button
              onClick={resetEmergency}
              className="inline-flex items-center gap-2 rounded-2xl glass px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          )}
          <button
            onClick={() => setVoices(!voices)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              voices ? "bg-[#7209b7] text-white shadow-glow-violet" : "glass hover:bg-white/10"
            }`}
          >
            {voices ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Voice Guidance
          </button>
        </div>

        {emergency && (
          <div className="mt-8 animate-fade-up">
            <EmergencyCard
              emergency={emergency}
              speaking={speaking}
              onToggleVoice={toggleVoice}
              voicesEnabled={voices}
              nearbyHeroes={nearbyHeroes}
            />
            <div className="mt-6 rounded-3xl glass-card p-4">
              <FirstAidSteps category={emergency.category} />
            </div>
          </div>
        )}

        {!emergency && (
          <div className="mt-8">
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-12 text-center">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-semibold text-muted-foreground">Ready for Emergency Simulation</p>
              <p className="mt-2 text-sm text-muted-foreground/70">
                Click "Simulate Emergency" to start a full live dispatch flow.
              </p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Users className="h-4 w-4" />
            Active Heroes Nearby
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HEROES.slice(0, 4).map((hero) => (
              <HeroCard key={hero.name} hero={hero} />
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Nearby Hero Pool
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Name</span>
              <span>Skill</span>
              <span>Area</span>
              <span className="text-right">Responses</span>
            </div>
            {HERO_POOL.map((hero) => (
              <div
                key={hero.name}
                className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-t border-white/5 px-4 py-3 text-sm hover:bg-white/[0.03]"
              >
                <span className="font-semibold">{hero.name}</span>
                <span className="text-muted-foreground">{hero.skill}</span>
                <span className="text-muted-foreground">{hero.area}</span>
                <span className="text-right font-bold text-success">{hero.responses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  unit,
}: {
  icon: typeof Heart;
  value: string;
  label: string;
  trend?: number;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-blue-violet text-white">
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-success">+{trend}</span>
        )}
      </div>
      <div className="mt-3 font-mono text-3xl font-extrabold tabular-nums">
        {value}
        {unit && <span className="text-base text-muted-foreground"> {unit}</span>}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function EmergencyCard({
  emergency,
  speaking,
  onToggleVoice,
  voicesEnabled,
  nearbyHeroes,
}: {
  emergency: SimulatedEmergency;
  speaking: boolean;
  onToggleVoice: () => void;
  voicesEnabled: boolean;
  nearbyHeroes: NearbyHero[];
}) {
  const config = STATUS_CONFIG[emergency.status];
  const StatusIcon = config.icon;

  return (
    <div className="rounded-3xl glass-card overflow-hidden border-[#E94560]/30 shadow-glow-red">
      <div className="bg-gradient-to-r from-[#E94560]/20 to-[#FF2D55]/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-sos text-white shadow-glow-red">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF8FA3]">Active Emergency</p>
              <p className="text-xl font-extrabold">{emergency.type}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {emergency.location.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <StatusIcon className={`h-4 w-4 ${config.color} ${emergency.status === "detecting" ? "animate-spin" : ""}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{config.label}</span>
            </div>
            <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-gradient-sos">
              {emergency.elapsed}s
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-black/20 p-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 animate-pulse-soft rounded-full ${
                emergency.severity === "Critical"
                  ? "bg-[#E94560]"
                  : emergency.severity === "High"
                    ? "bg-[#FFB830]"
                    : "bg-info"
              }`}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest">{emergency.severity}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00d4aa] via-[#4361ee] to-[#7209b7] transition-all duration-500"
              style={{ width: `${emergency.severityScore}%` }}
            />
          </div>
          <span className="font-mono text-lg font-bold">{emergency.severityScore}%</span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Hero Dispatch</p>
              {voicesEnabled && (
                <button
                  onClick={onToggleVoice}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#7209b7]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]"
                >
                  {speaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {speaking ? "Stop" : "Read"}
                </button>
              )}
            </div>
            {emergency.hero ? (
              <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-blue-violet p-4 text-white shadow-glow-blue">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-extrabold">{emergency.hero.name}</p>
                    <p className="text-sm text-white/85">{emergency.hero.skill}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
                        <Navigation className="h-3 w-3" />
                        {emergency.hero.distanceKm.toFixed(2)} km
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
                        <Clock className="h-3 w-3" />
                        {emergency.hero.etaMin} min
                      </span>
                    </div>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-xl font-black">
                    {emergency.hero.name.trim()[0]}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Matching nearest hero...</span>
              </div>
            )}

            {emergency.hero && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nearby Responders
                </p>
                <ul className="mt-2 space-y-2">
                  {nearbyHeroes.slice(1, 5).map((h, i) => (
                    <li
                      key={`${h.name}-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-sm"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#4361ee] text-xs font-bold text-white">
                        {h.name.trim()[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.skill}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-bold">{h.distanceKm.toFixed(1)} km</p>
                        <p className="text-muted-foreground">{h.etaMin}m</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</p>
            <ul className="mt-3 space-y-2">
              {(Object.keys(STATUS_CONFIG) as EmergencyStatus[]).map((s, i) => {
                const cfg = STATUS_CONFIG[s];
                const passed = (Object.keys(STATUS_CONFIG).indexOf(emergency.status) ?? -1) >= i;
                const current = emergency.status === s;
                const IconComponent = cfg.icon;

                return (
                  <li
                    key={s}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                      passed
                        ? "border-success/30 bg-success/10"
                        : current
                          ? "border-[#E94560]/30 bg-[#E94560]/10 shadow-glow-red"
                          : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-full ${
                        passed ? "bg-success text-[#0F0F1A]" : current ? "bg-[#E94560] text-white" : "bg-white/10"
                      }`}
                    >
                      {passed && s !== "detecting" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : current && s === "detecting" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${passed || current ? "" : "text-muted-foreground"}`}>
                      {cfg.label}
                    </span>
                    {current && (
                      <span className="ml-auto text-xs font-bold uppercase tracking-widest text-[#E94560]">
                        {emergency.elapsed}s
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {emergency.status !== "resolved" && emergency.countdown > 0 && (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-warning">
                  Auto-Escalation Timer
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-warning">
                  {Math.floor(emergency.countdown / 60)}:{(emergency.countdown % 60).toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground">Calling 112 automatically if hero doesn't arrive</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FirstAidSteps({ category }: { category: AidCategory }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <Activity className="h-4 w-4 text-[#4cc9f0]" />
        First-Aid Guidance · {category.emoji} {category.title}
      </div>
      <ol className="mt-4 space-y-2">
        {category.steps.map((step, i) => (
          <li
            key={i}
            className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-blue-violet text-sm font-bold text-white">
              {i + 1}
            </div>
            <p className="text-sm leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function HeroCard({ hero }: { hero: Hero }) {
  return (
    <div className="rounded-2xl glass-card p-4 glass-hover hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-blue-violet text-base font-bold text-white">
          {hero.name.trim()[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{hero.name}</p>
          <p className="truncate text-xs text-muted-foreground">{hero.skill}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {hero.area}
        </span>
        <span className="font-bold text-success">{hero.responses} lives</span>
      </div>
    </div>
  );
}
