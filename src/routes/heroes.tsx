import { createFileRoute } from "@tanstack/react-router";
import { Trophy, MapPin, Award, Crown } from "lucide-react";
import { HEROES } from "@/lib/heroes";

export const Route = createFileRoute("/heroes")({
  head: () => ({
    meta: [
      { title: "Community Heroes — ResQNear" },
      { name: "description", content: "Meet the doctors, nurses, paramedics and trained citizens responding to emergencies in your neighbourhood." },
    ],
  }),
  component: HeroesPage,
});

const SKILL_TINT: Record<string, string> = {
  Cardiologist: "from-[#E94560] to-[#FF2D55]",
  Doctor: "from-[#4CC9F0] to-[#4361EE]",
  Nurse: "from-[#f093fb] to-[#f5576c]",
  Paramedic: "from-[#FFB830] to-[#FF8C00]",
  "CPR Trained": "from-[#00D4AA] to-[#00B4D8]",
  "First Aider": "from-[#667eea] to-[#764ba2]",
};

const PODIUM = [
  { color: "#C0C0C0", glow: "0 0 30px rgba(192,192,192,0.55)", h: "h-32", label: "Silver", rank: 2 },
  { color: "#FFD700", glow: "0 0 40px rgba(255,215,0,0.7)", h: "h-44", label: "Gold", rank: 1 },
  { color: "#CD7F32", glow: "0 0 28px rgba(205,127,50,0.55)", h: "h-28", label: "Bronze", rank: 3 },
];

function HeroesPage() {
  const top3 = HEROES.slice(0, 3);
  const rest = HEROES.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-[#FFD700]" /> Leaderboard
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Community <span className="text-gradient-primary">Heroes</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Recognising the citizens who showed up when it mattered.</p>
      </header>

      {/* Podium */}
      <div className="mt-12 grid grid-cols-3 items-end gap-3">
        {podiumOrder.map((h, i) => {
          const s = PODIUM[i];
          return (
            <div key={h.name} className="flex flex-col items-center text-center">
              {s.rank === 1 && <Crown className="h-6 w-6 text-[#FFD700]" fill="#FFD700" />}
              <div
                className="grid h-16 w-16 place-items-center rounded-full text-xl font-black text-[#0F0F1A]"
                style={{ background: s.color, boxShadow: s.glow }}
              >
                {h.name.split(" ").slice(-1)[0][0]}
              </div>
              <div className="mt-2 truncate text-xs font-bold sm:text-sm">{h.name}</div>
              <div className="text-[10px] text-muted-foreground">{h.responses} saves</div>
              <div
                className={`mt-2 grid w-full place-items-center rounded-t-2xl ${s.h} text-[10px] font-bold uppercase tracking-widest text-[#0F0F1A]`}
                style={{ background: `linear-gradient(180deg, ${s.color}, ${s.color}99)`, boxShadow: s.glow }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-10 space-y-3">
        {rest.map((h, i) => {
          const tint = SKILL_TINT[h.skill] ?? "from-[#667eea] to-[#764ba2]";
          return (
            <div
              key={h.name}
              className="animate-fade-up group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl glass-card p-4 glass-hover hover:-translate-y-0.5 hover:border-white/20"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} text-base font-extrabold text-white shadow-card`}>
                {i + 4}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold">{h.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {h.area}
                </p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tint} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white`}>
                  <Award className="h-3 w-3" /> {h.skill}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-success">{h.responses}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">responses</div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
