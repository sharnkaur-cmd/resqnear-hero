import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock, Cpu, Heart, Loader as Loader2, MapPin, Navigation, Phone, ShieldAlert, Siren, Timer, Users, Volume2, VolumeX, X, Zap, Play, Pause, RotateCcw } from "lucide-react";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";
import { HEROES, HERO_POOL, pickRandomHero, type Hero } from "@/lib/heroes";
import { buildNearbyHeroes, type NearbyHero } from "@/lib/nearby";
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
  progress: number;
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

const STATUS_ORDER: EmergencyStatus[] = ["detecting", "triage", "dispatching", "enroute", "onsite", "resolved"];

const STATUS_CONFIG: Record<EmergencyStatus, { label: string; color: string; icon: typeof Activity; duration: number; colorClass: string }> = {
  idle: { label: "Ready", color: "text-muted-foreground", icon: Activity, duration: 0, colorClass: "bg-muted" },
  detecting: { label: "Detecting Location", color: "text-info", icon: Loader2, duration: 2000, colorClass: "bg-info" },
  triage: { label: "AI Triage", color: "text-cyan-400", icon: Cpu, duration: 3000, colorClass: "bg-cyan-500" },
  dispatching: { label: "Dispatching Hero", color: "text-amber-400", icon: Zap, duration: 2000, colorClass: "bg-amber-500" },
  enroute: { label: "Hero En Route", color: "text-purple-400", icon: Navigation, duration: 8000, colorClass: "bg-purple-500" },
  onsite: { label: "Hero On Scene", color: "text-emerald-400", icon: CheckCircle2, duration: 4000, colorClass: "bg-emerald-500" },
  resolved: { label: "Resolved", color: "text-emerald-400", icon: CheckCircle2, duration: 2000, colorClass: "bg-emerald-500" },
};

function ResQHubPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [emergency, setEmergency] = useState<SimulatedEmergency | null>(null);
  const [stats, setStats] = useState({ lives: 1247, responses: 2841, avgResponse: 178 });
  const [speaking, setSpeaking] = useState(false);

  // Generate a new emergency
  const generateEmergency = useCallback((): SimulatedEmergency => {
    const category = AID_CATEGORIES[Math.floor(Math.random() * AID_CATEGORIES.length)];
    const severityScores: Record<string, number> = {
      cardiac: 92,
      fire: 85,
      accident: 78,
      medical: 65,
      safety: 70,
      choking: 88,
    };
    const severityScore = severityScores[category.id] ?? 70;
    const severity: SimulatedEmergency["severity"] =
      severityScore >= 85 ? "Critical" : severityScore >= 70 ? "High" : severityScore >= 50 ? "Medium" : "Low";

    const locationIndex = Math.floor(Math.random() * LOCATIONS.length);
    const lat = BENGALURU_CENTER.lat + (Math.random() - 0.5) * 0.05;
    const lon = BENGALURU_CENTER.lon + (Math.random() - 0.5) * 0.05;

    return {
      id: `EMG-${Date.now()}`,
      type: category.title,
      category,
      severity,
      severityScore,
      status: "detecting",
      progress: 0,
      location: { lat, lon, label: LOCATIONS[locationIndex] },
      hero: null,
      elapsed: 0,
      countdown: 180,
    };
  }, []);

  // Start simulation
  const startSimulation = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
    const newEmergency = generateEmergency();
    setEmergency(newEmergency);
    setIsPlaying(true);
  }, [generateEmergency]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    setIsPlaying(false);
    stopSpeaking();
    setSpeaking(false);
  }, []);

  // Reset everything
  const resetAll = useCallback(() => {
    stopSimulation();
    setEmergency(null);
    setStats({ lives: 1247, responses: 2841, avgResponse: 178 });
  }, [stopSimulation]);

  // Main animation loop - runs every 50ms for smooth progress
  useEffect(() => {
    if (!isPlaying || !emergency) return;

    const interval = setInterval(() => {
      setEmergency((prev) => {
        if (!prev) return null;

        // Update elapsed time
        const newElapsed = prev.elapsed + 0.05; // 50ms increment
        const newCountdown = Math.max(0, 180 - Math.floor(newElapsed));

        // Get current status config
        const currentConfig = STATUS_CONFIG[prev.status];
        if (!currentConfig) return prev;

        // Calculate progress increment
        // Progress is 0-100 over the duration
        const progressPerMs = 100 / currentConfig.duration;
        const newProgress = prev.progress + progressPerMs * 50; // 50ms per tick

        // Check if we should move to next status
        if (newProgress >= 100) {
          const currentIndex = STATUS_ORDER.indexOf(prev.status);
          const nextIndex = currentIndex + 1;

          if (nextIndex < STATUS_ORDER.length) {
            const nextStatus = STATUS_ORDER[nextIndex];

            // Update stats when resolved
            if (nextStatus === "resolved") {
              setStats((s) => ({
                lives: s.lives + 1,
                responses: s.responses + 1,
                avgResponse: Math.round((s.avgResponse + Math.floor(newElapsed)) / 2),
              }));
            }

            // Assign hero when dispatching
            let newHero = prev.hero;
            if (nextStatus === "dispatching" || nextStatus === "enroute") {
              const heroBase = pickRandomHero();
              const nearby = buildNearbyHeroes(prev.location.lat, prev.location.lon, heroBase, 5);
              newHero = nearby[0];
            }

            return {
              ...prev,
              status: nextStatus,
              progress: 0,
              hero: newHero,
              elapsed: newElapsed,
              countdown: newCountdown,
            };
          }
        }

        return {
          ...prev,
          progress: Math.min(100, newProgress),
          elapsed: newElapsed,
          countdown: newCountdown,
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, emergency?.id]);

  // Auto-loop when resolved
  useEffect(() => {
    if (!isPlaying || emergency?.status !== "resolved") return;

    const timeout = setTimeout(() => {
      startSimulation();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isPlaying, emergency?.status, startSimulation]);

  // Update ambient stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((s) => ({
        lives: s.lives + Math.floor(Math.random() * 2),
        responses: s.responses + Math.floor(Math.random() * 3),
        avgResponse: Math.max(60, s.avgResponse + Math.floor(Math.random() * 10) - 5),
      }));
    }, 4000);
    return () => clearInterval(interval);
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

  const nearbyHeroes = useMemo(() => {
    if (!emergency) return [];
    const heroBase = emergency.hero ?? pickRandomHero();
    return buildNearbyHeroes(emergency.location.lat, emergency.location.lon, heroBase, 8);
  }, [emergency]);

  const elapsedDisplay = useMemo(() => {
    const sec = Math.floor(emergency?.elapsed ?? 0);
    return `${sec}s`;
  }, [emergency?.elapsed]);

  const countdownDisplay = useMemo(() => {
    const sec = emergency?.countdown ?? 180;
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  }, [emergency?.countdown]);

  return (
    <main className="min-h-screen bg-aurora pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="text-center">
          <div className={`inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest ${isPlaying ? "text-[#E94560]" : "text-muted-foreground"}`}>
            <Siren className={`h-3.5 w-3.5 ${isPlaying ? "animate-pulse" : ""}`} />
            Live Emergency Command Center
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            ResQ<span className="text-gradient-primary">Hub</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Auto-playing emergency simulation · No backend · 100% frontend animation
          </p>
        </header>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} value={stats.lives.toLocaleString("en-IN")} label="Lives Saved" />
          <StatCard icon={Activity} value={stats.responses.toLocaleString("en-IN")} label="Responses" />
          <StatCard
            icon={Timer}
            value={`${Math.round(stats.avgResponse / 60)}:${(stats.avgResponse % 60).toString().padStart(2, "0")}`}
            label="Avg Response"
            unit="min"
          />
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {!isPlaying && !emergency && (
            <button
              onClick={startSimulation}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-sos px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-red transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5" />
              Start Live Simulation
            </button>
          )}
          {isPlaying && (
            <button
              onClick={stopSimulation}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-amber-400 transition hover:bg-amber-500/20"
            >
              <Pause className="h-5 w-5" />
              Pause
            </button>
          )}
          {emergency && !isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-blue-violet px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-blue"
            >
              <Play className="h-5 w-5" />
              Resume
            </button>
          )}
          {emergency && (
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-2xl glass px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>

        {/* Empty State */}
        {!emergency && !isPlaying && (
          <div className="mt-12 animate-fade-up">
            <div className="rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-sos/20 mb-6">
                <Play className="h-10 w-10 text-[#E94560]" />
              </div>
              <p className="text-xl font-bold text-white">Ready for Emergency Simulation</p>
              <p className="mt-2 text-muted-foreground">
                Click the red button above to start watching a live SOS dispatch flow.
              </p>
              <p className="mt-4 text-xs text-muted-foreground/70">
                The simulation plays automatically like a video, looping through different emergencies.
              </p>
            </div>
          </div>
        )}

        {/* Active Emergency */}
        {emergency && (
          <div className="mt-8 animate-fade-up">
            <EmergencyCard
              emergency={emergency}
              speaking={speaking}
              onToggleVoice={toggleVoice}
              nearbyHeroes={nearbyHeroes}
            />
            <div className="mt-6 rounded-3xl glass-card p-5">
              <FirstAidSteps
                category={emergency.category}
                currentStep={Math.floor(emergency.progress / 25)}
                status={emergency.status}
              />
            </div>
          </div>
        )}

        {/* Hero Network */}
        <div className="mt-10">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Users className="h-4 w-4" />
            Active Heroes Network
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HEROES.slice(0, 4).map((hero, i) => (
              <HeroCard key={hero.name} hero={hero} isActive={isPlaying} />
            ))}
          </div>
        </div>

        {/* Hero Pool Table */}
        <div className="mt-10">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Hero Pool · {HERO_POOL.length} Responders
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
                className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-t border-white/5 px-4 py-3 text-sm transition-all ${
                  emergency?.hero?.name === hero.name
                    ? "bg-purple-500/20 border-purple-500/30"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <span className="font-semibold">{hero.name}</span>
                <span className="text-muted-foreground">{hero.skill}</span>
                <span className="text-muted-foreground">{hero.area}</span>
                <span className="text-right font-bold text-emerald-400">{hero.responses}</span>
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
  unit,
}: {
  icon: typeof Heart;
  value: string;
  label: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-blue-violet text-white">
          <Icon className="h-5 w-5" />
        </div>
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
  nearbyHeroes,
}: {
  emergency: SimulatedEmergency;
  speaking: boolean;
  onToggleVoice: () => void;
  nearbyHeroes: NearbyHero[];
}) {
  const config = STATUS_CONFIG[emergency.status];
  const IconComponent = config.icon;
  const statusIndex = STATUS_ORDER.indexOf(emergency.status);

  return (
    <div className="rounded-3xl glass-card overflow-hidden border-[#E94560]/30 shadow-glow-red">
      {/* Top progress bar */}
      <div className="relative h-2 bg-white/10">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E94560] via-[#FF2D55] to-purple-500 transition-all duration-100"
          style={{ width: `${((statusIndex + emergency.progress / 100) / STATUS_ORDER.length) * 100}%` }}
        />
      </div>

      <div className="bg-gradient-to-r from-[#E94560]/25 via-[#FF2D55]/15 to-transparent p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-sos text-white shadow-glow-red">
              <ShieldAlert className="h-8 w-8" />
              {emergency.status !== "resolved" && (
                <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-[#E94560]" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300">{emergency.id}</p>
              <p className="text-2xl font-extrabold">{emergency.type}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {emergency.location.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <IconComponent className={`h-5 w-5 ${config.color} ${emergency.status === "detecting" || emergency.status === "triage" ? "animate-spin" : ""}`} />
              <span className="text-sm font-bold uppercase tracking-widest">{config.label}</span>
            </div>
            <p className="mt-2 font-mono text-4xl font-extrabold tabular-nums text-gradient-sos">
              {Math.floor(emergency.elapsed)}s
            </p>
            <p className="text-[10px] text-muted-foreground">elapsed</p>
          </div>
        </div>

        {/* Severity */}
        <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl bg-black/30 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-3.5 w-3.5 animate-pulse rounded-full ${
                emergency.severity === "Critical"
                  ? "bg-rose-500"
                  : emergency.severity === "High"
                    ? "bg-amber-400"
                    : "bg-cyan-400"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-widest">{emergency.severity}</span>
          </div>
          <div className="overflow-hidden rounded-full bg-white/10">
            <div
              className="h-3 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 transition-all duration-100"
              style={{ width: `${emergency.severityScore}%` }}
            />
          </div>
          <span className="font-mono text-xl font-bold">{emergency.severityScore}%</span>
        </div>

        {/* Current status progress */}
        {emergency.status !== "resolved" && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              <span>{config.label}</span>
              <span>{Math.floor(emergency.progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full ${config.colorClass} transition-all duration-100`}
                style={{ width: `${emergency.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left - Hero */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Hero Dispatch</p>
              <button
                onClick={onToggleVoice}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition ${
                  speaking
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-white/10 text-muted-foreground hover:bg-white/15"
                }`}
              >
                {speaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                {speaking ? "Stop" : "Read Aloud"}
              </button>
            </div>

            {emergency.hero ? (
              <div className="overflow-hidden rounded-2xl bg-gradient-blue-violet p-5 text-white shadow-glow-blue">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-extrabold">{emergency.hero.name}</p>
                    <p className="text-sm text-white/85">{emergency.hero.skill}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold">
                        <Navigation className="h-3.5 w-3.5" />
                        {emergency.hero.distanceKm.toFixed(2)} km
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        {emergency.hero.etaMin} min
                      </span>
                    </div>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/15 text-2xl font-black backdrop-blur">
                    {emergency.hero.name.trim()[0]}
                  </div>
                </div>

                {/* Distance remaining animation */}
                {emergency.status === "enroute" && (
                  <div className="mt-4 rounded-xl bg-black/20 p-3">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>Distance remaining</span>
                      <span className="font-mono">{(emergency.hero.distanceKm * (1 - emergency.progress / 100)).toFixed(2)} km</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-100"
                        style={{ width: `${emergency.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finding nearest hero...</span>
              </div>
            )}

            {/* Nearby list */}
            {emergency.hero && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Nearby Responders
                </p>
                <ul className="space-y-2">
                  {nearbyHeroes.slice(1, 5).map((h, i) => (
                    <li key={`${h.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
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

          {/* Right - Timeline */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Response Timeline
            </p>
            <ul className="space-y-2">
              {STATUS_ORDER.slice(0, -1).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const idx = STATUS_ORDER.indexOf(s);
                const past = statusIndex > idx;
                const current = s === emergency.status;
                const I = cfg.icon;

                return (
                  <li key={s} className="relative">
                    {current && emergency.progress < 100 && (
                      <span className="absolute -left-1 top-3 h-2.5 w-2.5 animate-ping rounded-full bg-rose-500" />
                    )}
                    <div
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                        past
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : current
                            ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(233,69,96,0.2)]"
                            : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
                          past
                            ? "bg-emerald-500 text-white"
                            : current
                              ? "bg-rose-500 text-white"
                              : "bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {past ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : current && (s === "detecting" || s === "triage") ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <I className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`flex-1 text-sm font-semibold ${past || current ? "" : "text-muted-foreground"}`}>
                        {cfg.label}
                      </span>
                      {current && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full bg-rose-500 transition-all duration-100"
                              style={{ width: `${emergency.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold w-10">{Math.floor(emergency.progress)}%</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Countdown */}
            {emergency.status !== "resolved" && (
              <div className="mt-4 animate-fade-up rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Auto-Escalation Timer</p>
                <p className="font-mono text-3xl font-extrabold tabular-nums text-amber-400">{Math.floor(emergency.countdown / 60)}:{(emergency.countdown % 60).toString().padStart(2, "0")}</p>
                <p className="text-xs text-muted-foreground mt-1">Calls 112 automatically if hero doesn't arrive</p>
              </div>
            )}

            {/* Emergency numbers */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[{ num: "112", label: "Emergency" }, { num: "108", label: "Ambulance" }].map(({ num, label }) => (
                <a key={num} href={`tel:${num}`} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold hover:bg-white/10 transition">
                  <Phone className="h-4 w-4 text-cyan-400" />
                  {num} — {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FirstAidSteps({ category, currentStep, status }: { category: AidCategory; currentStep: number; status: EmergencyStatus }) {
  const activeCount = status === "resolved" ? 5 : Math.min(4, currentStep + 1);

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <Activity className="h-4 w-4 text-cyan-400" />
        First-Aid Guidance · {category.emoji} {category.title}
      </div>
      <ol className="mt-4 space-y-2">
        {category.steps.map((step, i) => {
          const isActive = i < activeCount;
          const isCurrent = i === activeCount - 1;

          return (
            <li
              key={i}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border p-4 transition-all duration-300 ${
                isActive
                  ? "border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-transparent"
                  : "border-white/10 bg-white/[0.04] opacity-60"
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? "bg-gradient-blue-violet text-white shadow-glow-blue"
                    : "bg-white/10 text-muted-foreground"
                }`}
              >
                {isActive && i < activeCount - 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <p className={`text-sm leading-relaxed ${isCurrent ? "text-white font-medium" : isActive ? "text-white/85" : "text-muted-foreground"}`}>
                {step}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function HeroCard({ hero, isActive }: { hero: Hero; isActive: boolean }) {
  return (
    <div className={`rounded-2xl glass-card p-4 transition-all hover:border-white/20 ${isActive ? "animate-pulse" : ""}`}>
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
        <span className="font-bold text-emerald-400">{hero.responses} lives</span>
      </div>
    </div>
  );
}
