import { useEffect, useState } from "react";
import { X, Phone, Mic, AlertTriangle, Cpu, Loader2 } from "lucide-react";
import type { AidCategory } from "@/lib/first-aid";
import type { EmergencyTypeLabel } from "@/lib/aiEmergency";
import { saveEmergency } from "@/lib/supabase";

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
  const escalated = secondsLeft === 0;

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

  const steps = guidanceSteps.slice(0, 5);

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
              <p className="mt-2 text-xs text-white/60">You said: “{speech}”</p>
              {locationLabel && (
                <p className="mt-1 text-xs text-white/50">{locationLabel}</p>
              )}
            </>
          )}
        </div>

        {!loading && (
          <>
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
                escalated
                  ? "border border-[#FF2D55]/40 bg-[#FF2D55]/10"
                  : "glass-card"
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
