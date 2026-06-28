import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Phone, X, MapPin, Clock, Activity, ShieldAlert, Cpu, Loader2, Navigation, CheckCircle2, AlertTriangle, Volume2 } from "lucide-react";
import type { AidCategory } from "@/lib/first-aid";
import { pickRandomHero, type Hero } from "@/lib/heroes";
import { HeroMap } from "@/components/HeroMap";
import { analyzeEmergency, type EmergencyAnalysis } from "@/lib/ai.functions";
import { saveEmergency } from "@/lib/supabase";
import { buildNearbyHeroes } from "@/lib/nearby";
import { speak, stopSpeaking } from "@/lib/speak";

type Props = {
  category: AidCategory;
  onClose: () => void;
  userLat?: number;
  userLon?: number;
  locationLabel?: string;
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const SEVERITY_TINT: Record<string, string> = {
  Critical: "bg-gradient-sos text-white",
  High: "bg-gradient-pink text-white",
  Medium: "bg-gradient-blue text-white",
  Low: "bg-gradient-teal text-[#0F0F1A]",
};

export function EmergencyActive({ category, onClose, userLat, userLon, locationLabel }: Props) {
  const [seconds, setSeconds] = useState(120);
  const [elapsed, setElapsed] = useState(0);
  const heroRef = useRef<Hero>(useMemo(() => pickRandomHero(), []));
  const hero = heroRef.current;
  const userLatSafe = userLat ?? 12.9352;
  const userLonSafe = userLon ?? 77.6245;
  const nearby = useMemo(
    () => buildNearbyHeroes(userLatSafe, userLonSafe, hero, 5),
    [userLatSafe, userLonSafe, hero],
  );
  const matched = nearby[0];
  const [analysis, setAnalysis] = useState<EmergencyAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const analyze = useServerFn(analyzeEmergency);

  useEffect(() => {
    const saved = localStorage.getItem("emergency_speech_language");
    if (saved) setSelectedLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("emergency_speech_language", selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Hero match score (skill 40 + distance<=0.5km 40 + available 20)
  const matchScore = useMemo(() => {
    let s = 0;
    const need = analysis?.heroSkillNeeded?.toLowerCase() ?? "";
    if (need && matched.skill.toLowerCase().includes(need.split(" ")[0])) s += 40;
    else s += 25;
    if (matched.distanceKm <= 0.5) s += 40;
    else if (matched.distanceKm <= 1.2) s += 28;
    else s += 15;
    s += 20; // available
    return Math.min(100, s);
  }, [matched, analysis]);

  const timeline = [
    { t: 0, label: "SOS received" },
    { t: 3, label: "Location shared" },
    { t: 5, label: "AI analysing" },
    { t: 8, label: "Hero matched" },
    { t: 10, label: "Help on the way" },
  ];
  const escalated = seconds === 0;

  useEffect(() => {
    let cancelled = false;
    setLoadingAi(true);
    const loc = locationLabel ?? "India";
    analyze({ data: { type: category.title, location: loc } })
      .then((r) => {
        if (cancelled) return;
        setAnalysis(r);
        setLoadingAi(false);
        // Log the emergency event (non-blocking)
        saveEmergency({
          type: category.title,
          lat: userLat ?? null,
          lon: userLon ?? null,
          hero_name: hero.name,
          severity: r.severity,
          severity_score: r.severityScore,
        }).catch(() => {});
      })
      .catch(() => { if (!cancelled) setLoadingAi(false); });
    return () => { cancelled = true; };
  }, [analyze, category.title, hero.area, hero.name, locationLabel, userLat, userLon]);

  const steps = analysis?.firstAidSteps ?? category.steps;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F0F1A] text-white">
      <div className="pointer-events-none absolute inset-0 animate-red-flash" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(233,69,96,0.35),transparent_60%)]" />

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

        <div className="mt-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-sos shadow-glow-red">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 animate-pulse-soft text-3xl font-extrabold tracking-tight text-gradient-sos sm:text-4xl">
            EMERGENCY ACTIVE
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {category.emoji} {category.title} — broadcasting to heroes within 1 km
          </p>
        </div>

        {/* AI Analysis */}
        <div className="mt-6 rounded-3xl glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#4cc9f0]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">AI Triage · Gemini</p>
            </div>
            {loadingAi ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Analysing
              </span>
            ) : analysis ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${SEVERITY_TINT[analysis.severity] ?? "bg-gradient-blue text-white"}`}>
                {analysis.severity}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="font-mono text-5xl font-extrabold tabular-nums text-gradient-blue">
              {analysis?.severityScore ?? 0}%
            </div>
            <div className="pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {analysis?.urgency ?? "Calculating"} · {analysis?.heroSkillNeeded ?? "Matching skill"}
            </div>
          </div>
          <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#00d4aa] via-[#4361ee] to-[#7209b7] transition-all duration-500"
              style={{ width: `${analysis?.severityScore ?? 6}%` }}
            />
          </div>
          {analysis?.recommendedAction && (
            <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-relaxed text-white/90">
              <span className="font-bold text-gradient-blue">Recommended: </span>
              {analysis.recommendedAction}
            </p>
          )}
        </div>

        {/* Live Map — fullscreen-feel */}
        <div className="mt-4">
          <HeroMap userLat={userLat} userLon={userLon} hero={hero} nearby={nearby} className="h-[420px]" />
        </div>

        {/* Nearby heroes list with distance + ETA */}
        <div className="mt-4 rounded-3xl glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {nearby.length} Heroes Nearby
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-success">Live</span>
          </div>
          <ul className="mt-3 space-y-2">
            {nearby.map((h, i) => (
              <li
                key={h.name}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                  i === 0 ? "border-[#7209b7]/60 bg-gradient-blue-violet/20" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-[#a78bfa]" : "bg-[#4361ee]"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{h.name}</p>
                  <p className="truncate text-[11px] text-white/70">{h.skill} · {h.area}</p>
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

        {/* Matched hero card — blue/violet gradient (no red) */}
        <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-blue-violet p-5 text-white shadow-glow-blue">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/85">Nearest Hero Matched</p>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black text-white">{matchScore}% Match</span>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold">{matched.name}</p>
              <p className="text-sm text-white/85">{matched.skill}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" /> {matched.distanceKm.toFixed(2)} km · ETA {matched.etaMin} min
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[matched.skill.includes("CPR") || matched.skill.includes("Doctor") ? "CPR Trained" : matched.skill, matched.distanceKm < 0.6 ? "Nearby" : "On route", "Available Now"].map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success ring-1 ring-success/40">
                    <CheckCircle2 className="h-3 w-3" /> {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-black text-white backdrop-blur">
              {matched.name.trim()[0]}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <Clock className="h-4 w-4" /> Rescue countdown
            </div>
            <div className={`font-mono text-2xl font-bold tabular-nums ${seconds <= 20 ? "text-[#FFB830]" : "text-white"}`}>{formatTime(seconds)}</div>
          </div>

          <a
            href="tel:112"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00D4AA] px-5 py-4 text-lg font-extrabold uppercase tracking-wider text-[#0F0F1A] shadow-glow-green transition active:scale-[0.98]"
          >
            <Phone className="h-5 w-5" /> Call Hero
          </a>
        </div>

        {/* Rescue timeline */}
        <div className="mt-4 rounded-3xl glass-card p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">2-Minute Rescue Timeline</p>
          <ol className="mt-3 space-y-2">
            {timeline.map((s, i) => {
              const done = elapsed >= s.t;
              return (
                <li key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${done ? "border-success/40 bg-success/10" : "border-white/10 bg-white/5"}`}>
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? "bg-success text-[#0F0F1A]" : "bg-white/10 text-white/50"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`text-sm font-semibold ${done ? "text-white" : "text-white/60"}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Auto-escalation when timer hits 0 */}
        {escalated && (
          <div className="mt-4 animate-fade-up rounded-3xl border border-[#FF2D55]/40 bg-[#FF2D55]/10 p-5">
            <div className="flex items-center gap-2 text-[#FF8FA3]">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-extrabold uppercase tracking-widest">Escalating to emergency services</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[{ n: "108", l: "Ambulance" }, { n: "112", l: "Emergency" }, { n: "101", l: "Fire" }, { n: "100", l: "Police" }].map((x) => (
                <a key={x.n} href={`tel:${x.n}`} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-sm font-extrabold text-white ring-1 ring-white/15 transition hover:scale-[1.02] active:scale-95">
                  <Phone className="h-4 w-4" /> CALL {x.n} · {x.l}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* First aid steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/85">
              <Activity className="h-4 w-4 text-[#4cc9f0]" /> AI First-Aid Guidance
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-semibold outline-none"
              >
                <option value="en-US">English</option>
                <option value="hi-IN">हिन्दी</option>
                <option value="pa-IN">ਪੰਜਾਬੀ</option>
              </select>
              <button onClick={() => { stopSpeaking(); speak(steps.join(". "), selectedLanguage); }} className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/15">
                <Volume2 className="h-3.5 w-3.5" /> Read Aloud
              </button>
            </div>
          </div>
          <ol className="mt-3 space-y-2">
            {steps.map((step, i) => (
              <li
                key={i}
                className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl glass-card p-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-blue-violet text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-white/95">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 mb-4 flex items-center justify-center gap-2 rounded-full glass px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white/85">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#FF2D55]" />
          Also alerting 112 · Indian emergency services
        </div>
      </div>
    </div>
  );
}
