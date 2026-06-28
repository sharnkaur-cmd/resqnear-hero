import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy, MapPin, Award, Crown, Timer } from "lucide-react";
import { HEROES } from "@/lib/heroes";

export const Route = createFileRoute("/heroes")({
  head: () => ({
    meta: [
      { title: "Community Heroes — ResQNear" },
      {
        name: "description",
        content:
          "Meet the doctors, nurses, paramedics and trained citizens responding to emergencies.",
      },
    ],
  }),
  component: HeroesPage,
});

const SKILL_TINT: Record<string, string> = {
  Doctor: "from-[#4361ee] to-[#7209b7]",
  Nurse: "from-[#667eea] to-[#764ba2]",
  Paramedic: "from-[#4cc9f0] to-[#4361ee]",
  "CPR Trained": "from-[#00d4aa] to-[#00b4d8]",
  "First Aider": "from-[#7209b7] to-[#560bad]",
};

const PODIUM = [
  {
    color: "#C0C0C0",
    gradient: "linear-gradient(180deg,#E5E7EB,#9CA3AF)",
    glow: "0 0 30px rgba(192,192,192,0.55)",
    h: "h-32",
    label: "Silver",
    rank: 2,
  },

  {
    color: "#FFD700",
    gradient: "linear-gradient(180deg,#FFE066,#D4AF37)",
    glow: "0 0 40px rgba(255,215,0,0.75)",
    h: "h-44",
    label: "Gold",
    rank: 1,
  },

  {
    color: "#CD7F32",
    gradient: "linear-gradient(180deg,#E6A15C,#8B5A2B)",
    glow: "0 0 28px rgba(205,127,50,0.55)",
    h: "h-28",
    label: "Bronze",
    rank: 3,
  },
];

function HeroesPage() {
  const filtered = useMemo(() => HEROES, []);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-[#FFD700]" />
          Leaderboard
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Community <span className="text-gradient-primary">Heroes</span>
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Recognising the citizens who showed up when it mattered.
        </p>
      </header>

      {podiumOrder.length === 3 && (
        <div className="mt-10 grid grid-cols-3 items-end gap-3">
          {podiumOrder.map((h, i) => {
            const s = PODIUM[i];

            return (
              <div key={h.name} className="flex flex-col items-center text-center">
                {s.rank === 1 && <Crown className="h-6 w-6 text-[#FFD700]" fill="#FFD700" />}

                <div
                  className="grid h-16 w-16 place-items-center rounded-full text-xl font-black text-[#0F0F1A]"

                  style={{
                    background: s.gradient,
                    boxShadow: s.glow,
                  }}
                >
                  {h.name.split(" ").slice(-1)[0][0]}
                </div>

                <div className="mt-2 truncate text-xs font-bold sm:text-sm">{h.name}</div>

                <div className="text-[10px] text-muted-foreground">{h.responses} lives</div>

                <div
                  className={`mt-2 grid w-full place-items-center rounded-t-2xl ${s.h} text-[10px] font-bold uppercase tracking-widest text-[#0F0F1A]`}

                  style={{
                    background: s.gradient,
                    boxShadow: s.glow,
                  }}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 space-y-3">
        {rest.map((h, i) => {
          const tint = SKILL_TINT[h.skill] ?? "from-[#667eea] to-[#764ba2]";

          return (
            <div
              key={h.name}

              className="animate-fade-up group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl glass-card p-4 glass-hover hover:-translate-y-0.5 hover:border-white/20"
            >
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} text-base font-extrabold text-white shadow-card`}
              >
                {i + 4}
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold">{h.name}</p>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />

                    {h.area}
                  </span>

                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />

                    {h.avgResponse}
                  </span>
                </p>

                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tint} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white`}
                >
                  <Award className="h-3 w-3" />

                  {h.skill}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xl font-extrabold text-success">{h.responses}</div>

                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  lives helped
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
