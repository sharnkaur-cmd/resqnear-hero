import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  statusProgress: number;
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

const STATUS_CONFIG: Record<EmergencyStatus, { label: string; color: string; icon: typeof Activity; duration: number }> = {
  idle: { label: "Ready", color: "text-muted-foreground", icon: Activity, duration: 0 },
  detecting: { label: "Detecting Location", color: "text-info", icon: Loader2, duration: 2500 },
  triage: { label: "AI Triage", color: "text-[#4cc9f0]", icon: Cpu, duration: 3500 },
  dispatching: { label: "Dispatching Hero", color: "text-warning", icon: Zap, duration: 2000 },
  enroute: { label: "Hero En Route", color: "text-[#a78bfa]", icon: Navigation, duration: 12000 },
  onsite: { label: "Hero On Scene", color: "text-success", icon: CheckCircle2, duration: 6000 },
  resolved: { label: "Resolved", color: "text-success", icon: CheckCircle2, duration: 3000 },
};

const STATUS_ORDER: EmergencyStatus[] = ["detecting", "triage", "dispatching", "enroute", "onsite", "resolved"];

function ResQHubPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [emergency, setEmergency] = useState<SimulatedEmergency | null>(null);
  const [stats, setStats] = useState({ lives: 1247, responses: 2841, avgResponse: 178 });
  const [speaking, setSpeaking] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const statusStartRef = useRef<number>(0);

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
      statusProgress: 0,
      startTime: Date.now(),
      location: { lat, lon, label: LOCATIONS[locationIndex] },
      hero: null,
      elapsed: 0,
      countdown: 180,
    };
  }, []);

  const startSimulation = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
    const newEmergency = generateEmergency();
    setEmergency(newEmergency);
    statusStartRef.current = performance.now();
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
  }, [generateEmergency]);

  const stopSimulation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    stopSpeaking();
    setSpeaking(false);
  }, []);

  const resetAll = useCallback(() => {
    stopSimulation();
    setEmergency(null);
    setStats({ lives: 1247, responses: 2841, avgResponse: 178 });
  }, [stopSimulation]);

  useEffect(() => {
    if (!isPlaying || !emergency) return;

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setEmergency((prev) => {
        if (!prev) return null;

        const currentStatus = prev.status;
        const statusIndex = STATUS_ORDER.indexOf(currentStatus);
        if (statusIndex === -1 || currentStatus === "resolved") {
          return prev;
        }

        const statusConfig = STATUS_CONFIG[currentStatus];
        const statusElapsed = currentTime - statusStartRef.current;
        const progress = Math.min(100, (statusElapsed / statusConfig.duration) * 100);

        let updates: Partial<SimulatedEmergency> = {
          statusProgress: progress,
          elapsed: Math.floor((Date.now() - prev.startTime) / 1000),
          countdown: Math.max(0, 180 - Math.floor((Date.now() - prev.startTime) / 1000)),
        };

        if (progress >= 100) {
          const nextIndex = statusIndex + 1;
          if (nextIndex < STATUS_ORDER.length) {
            const nextStatus = STATUS_ORDER[nextIndex];
            updates.status = nextStatus;
            updates.statusProgress = 0;
            statusStartRef.current = currentTime;

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
          }
        }

        return { ...prev, ...updates };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, emergency]);

  // Auto-loop simulation
  useEffect(() => {
    if (!isPlaying) return;

    const checkLoop = setInterval(() => {
      if (emergency?.status === "resolved" && emergency.statusProgress >= 100) {
        setTimeout(() => {
          startSimulation();
        }, 1500);
      }
    }, 500);

    return () => clearInterval(checkLoop);
  }, [isPlaying, emergency?.status, emergency?.statusProgress, startSimulation]);

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

  return (
    <main className="min-h-screen bg-aurora pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Siren className={`h-3.5 w-3.5 ${isPlaying ? "text-[#E94560] animate-pulse" : ""}`} />
            Live Emergency Command Center
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            ResQ<span className="text-gradient-primary">Hub</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time emergency simulation · Auto-playing animation · No backend
          </p>
        </header>

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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {!isPlaying && !emergency && (
            <button
              onClick={startSimulation}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-sos px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-red transition hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5" />
              Start Live Simulation
            </button>
          )}
          {isPlaying && (
            <button
              onClick={stopSimulation}
              className="inline-flex items-center gap-2 rounded-2xl bg-warning/20 border border-warning/40 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-warning"
            >
              <Pause className="h-5 w-5" />
              Pause
            </button>
          )}
          {emergency && !isPlaying && (
            <button
              onClick={() => {
                setIsPlaying(true);
                lastTimeRef.current = performance.now();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-blue-violet px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-blue"
            >
              <Play className="h-5 w-5" />
              Resume
            </button>
          )}
          {emergency && (
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-2xl glass px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>

        {!emergency && !isPlaying && (
          <div className="mt-12 animate-fade-up">
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-sos/20 mb-6">
                <Play className="h-10 w-10 text-[#E94560]" />
              </div>
              <p className="text-xl font-bold text-white">Ready for Emergency Simulation</p>
              <p className="mt-2 text-muted-foreground">
                Click "Start Live Simulation" to watch a full SOS → Hero dispatch flow.
              </p>
              <p className="mt-4 text-xs text-muted-foreground/70">
                The simulation runs automatically like a video. It loops continuously.
              </p>
            </div>
          </div>
        )}

        {emergency && (
          <div className="mt-8 animate-fade-up">
            <EmergencyCard
              emergency={emergency}
              speaking={speaking}
              onToggleVoice={toggleVoice}
              nearbyHeroes={nearbyHeroes}
              isPlaying={isPlaying}
            />

            <div className="mt-6 rounded-3xl glass-card p-5">
              <FirstAidSteps
                category={emergency.category}
                currentStep={emergency.status === "resolved" ? 5 : Math.min(3, Math.floor(emergency.statusProgress / 25))}
              />
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Users className="h-4 w-4" />
            Active Heroes Nearby
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HEROES.slice(0, 4).map((hero, i) => (
              <HeroCard key={hero.name} hero={hero} index={i} isPlaying={isPlaying} />
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Hero Network · Bengaluru
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Name</span>
              <span>Skill</span>
              <span>Area</span>
              <span className="text-right">Responses</span>
            </div>
            {HERO_POOL.map((hero, i) => (
              <div
                key={hero.name}
                className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-t border-white/5 px-4 py-3 text-sm transition ${
                  emergency?.hero?.name === hero.name
                    ? "bg-[#7209b7]/20 border-[#7209b7]/30"
                    : "hover:bg-white/[0.03]"
                }`}
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
  unit,
}: {
  icon: typeof Heart;
  value: string;
  label: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl glass-card p-5 transition-all duration-500 hover:border-white/20">
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
  isPlaying,
}: {
  emergency: SimulatedEmergency;
  speaking: boolean;
  onToggleVoice: () => void;
  nearbyHeroes: NearbyHero[];
  isPlaying: boolean;
}) {
  const config = STATUS_CONFIG[emergency.status];
  const StatusIcon = config.icon;
  const statusIndex = STATUS_ORDER.indexOf(emergency.status);
  const allStatuses = STATUS_ORDER.slice(0, -1);

  return (
    <div className="rounded-3xl glass-card overflow-hidden border-[#E94560]/30 shadow-glow-red">
      {/* Animated top bar progress */}
      <div className="relative h-1.5 bg-white/10">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E94560] via-[#FF2D55] to-[#7209b7] transition-all duration-100"
          style={{ width: `${((statusIndex + emergency.statusProgress / 100) / STATUS_ORDER.length) * 100}%` }}
        />
      </div>

      <div className="bg-gradient-to-r from-[#E94560]/20 to-[#FF2D55]/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-sos text-white shadow-glow-red transition-transform duration-300 ${
              isPlaying ? "animate-pulse" : ""
            }`}>
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF8FA3]">
                {emergency.id}
              </p>
              <p className="text-2xl font-extrabold">{emergency.type}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {emergency.location.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <StatusIcon
                className={`h-5 w-5 ${config.color} ${emergency.status === "detecting" || emergency.status === "triage" ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-bold uppercase tracking-widest">{config.label}</span>
            </div>
            <div className="mt-2 font-mono text-4xl font-extrabold tabular-nums text-gradient-sos">
              {emergency.elapsed}s
            </div>
            <p className="text-[10px] text-muted-foreground">elapsed</p>
          </div>
        </div>

        {/* Severity bar with animation */}
        <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl bg-black/20 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-3.5 w-3.5 animate-pulse rounded-full ${
                emergency.severity === "Critical"
                  ? "bg-[#E94560]"
                  : emergency.severity === "High"
                    ? "bg-[#FFB830]"
                    : "bg-info"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-widest">{emergency.severity}</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00d4aa] via-[#4361ee] to-[#7209b7] transition-all duration-300"
              style={{ width: `${emergency.severityScore}%` }}
            />
            <div className="absolute inset-0 overflow-hidden">
              <div className="h-full w-[200%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>
          <span className="font-mono text-xl font-bold">{emergency.severityScore}%</span>
        </div>

        {/* Current status progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            <span>{config.label}</span>
            <span>{Math.round(emergency.statusProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#4361ee] to-[#7209b7] transition-all duration-100"
              style={{ width: `${emergency.statusProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column - Hero dispatch */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Hero Dispatch
              </p>
              <button
                onClick={onToggleVoice}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition ${
                  speaking
                    ? "bg-[#E94560]/20 text-[#E94560]"
                    : "bg-white/10 text-muted-foreground hover:bg-white/15"
                }`}
              >
                {speaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                {speaking ? "Stop" : "Read Aloud"}
              </button>
            </div>

            {/* Hero card with animation */}
            <div className={`transition-all duration-500 ${
              emergency.hero
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-60"
            }`}>
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
                          {emergency.hero.etaMin} min ETA
                        </span>
                      </div>
                    </div>
                    <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/15 text-2xl font-black backdrop-blur">
                      {emergency.hero.name.trim()[0]}
                    </div>
                  </div>

                  {/* Hero en-route animation */}
                  {emergency.status === "enroute" && (
                    <div className="mt-4 rounded-xl bg-white/10 p-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Distance remaining</span>
                        <span className="font-mono">{(emergency.hero.distanceKm * (1 - emergency.statusProgress / 100)).toFixed(1)} km</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-[#00D4AA] transition-all duration-100"
                          style={{ width: `${emergency.statusProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Searching for nearest hero...</span>
                </div>
              )}
            </div>

            {/* Nearby responders */}
            {emergency.hero && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nearby Responders
                </p>
                <ul className="mt-2 space-y-2">
                  {nearbyHeroes.slice(1, 5).map((h, i) => (
                    <li
                      key={`${h.name}-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm transition hover:border-white/15"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#4361ee]/80 text-xs font-bold text-white">
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

          {/* Right column - Timeline */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Response Timeline
            </p>
            <ul className="space-y-1.5">
              {allStatuses.map((s, i) => {
                const cfg = STATUS_CONFIG[s];
                const past = statusIndex > i;
                const current = emergency.status === s;
                const IconComponent = cfg.icon;

                return (
                  <li key={s} className="relative">
                    {current && (
                      <div className="absolute -left-0.5 top-1.5 h-2.5 w-2.5 animate-ping rounded-full bg-[#E94560]" />
                    )}
                    <div
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 ${
                        past
                          ? "border-success/30 bg-success/10"
                          : current
                            ? "border-[#E94560]/40 bg-[#E94560]/10 shadow-glow-red"
                            : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`grid h-7 w-7 place-items-center rounded-full transition-all duration-300 ${
                          past
                            ? "bg-success text-[#0F0F1A]"
                            : current
                              ? "bg-[#E94560] text-white"
                              : "bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {past && s !== "detecting" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : current && (s === "detecting" || s === "triage") ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconComponent className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold truncate ${past || current ? "" : "text-muted-foreground"}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {current && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full bg-[#E94560] transition-all duration-100"
                              style={{ width: `${emergency.statusProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold">
                            {Math.round(emergency.statusProgress)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Auto-escalation timer */}
            {emergency.status !== "resolved" && emergency.countdown > 0 && (
              <div className="mt-4 animate-fade-up rounded-xl border border-warning/30 bg-warning/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-warning mb-1">
                  Auto-Escalation Timer
                </p>
                <p className="font-mono text-3xl font-extrabold tabular-nums text-warning">
                  {Math.floor(emergency.countdown / 60)}:{(emergency.countdown % 60).toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Calls 112 automatically if hero doesn't arrive
                </p>
              </div>
            )}

            {/* Emergency numbers */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { num: "112", label: "Emergency" },
                { num: "108", label: "Ambulance" },
              ].map(({ num, label }) => (
                <a
                  key={num}
                  href={`tel:${num}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  <Phone className="h-4 w-4 text-[#4cc9f0]" />
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

function FirstAidSteps({ category, currentStep }: { category: AidCategory; currentStep: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <Activity className="h-4 w-4 text-[#4cc9f0]" />
        First-Aid Guidance · {category.emoji} {category.title}
      </div>
      <ol className="mt-4 space-y-2">
        {category.steps.map((step, i) => {
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <li
              key={i}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border p-4 transition-all duration-500 ${
                isActive
                  ? "border-[#7209b7]/40 bg-gradient-to-r from-[#7209b7]/10 to-transparent"
                  : "border-white/10 bg-white/[0.04] opacity-60"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-blue-violet text-white shadow-glow-blue"
                    : "bg-white/10 text-muted-foreground"
                }`}
              >
                {isActive && i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <p className={`text-sm leading-relaxed transition-opacity duration-300 ${
                isCurrent ? "text-white" : isActive ? "text-white/85" : "text-muted-foreground"
              }`}>
                {step}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function HeroCard({ hero, index, isPlaying }: { hero: Hero; index: number; isPlaying: boolean }) {
  return (
    <div
      className={`rounded-2xl glass-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 ${
        isPlaying ? "animate-pulse-soft" : ""
      }`}
      style={{ animationDelay: `${index * 200}ms` }}
    >
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
