import { createFileRoute } from "@tanstack/react-router";
import { Trophy, MapPin, Award } from "lucide-react";
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

const podiumStyles = [
  { ring: "ring-yellow-400", bg: "from-yellow-400 to-amber-600", h: "h-40", label: "Gold" },
  { ring: "ring-slate-300", bg: "from-slate-200 to-slate-400", h: "h-32", label: "Silver" },
  { ring: "ring-orange-400", bg: "from-orange-400 to-amber-700", h: "h-28", label: "Bronze" },
];

function HeroesPage() {
  const top3 = HEROES.slice(0, 3);
  const rest = HEROES.slice(3);
  // Visual podium order: silver, gold, bronze
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const styleOrder = [podiumStyles[1], podiumStyles[0], podiumStyles[2]];

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-primary" /> Leaderboard
        </div>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Community Heroes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Recognising the citizens who showed up when it mattered.</p>
      </header>

      {/* Podium */}
      <div className="mt-10 grid grid-cols-3 items-end gap-3">
        {podiumOrder.map((h, i) => {
          const s = styleOrder[i];
          return (
            <div key={h.name} className="flex flex-col items-center text-center">
              <div className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${s.bg} text-xl font-black text-black shadow-glow ring-4 ${s.ring}`}>
                {h.name.split(" ").slice(-1)[0][0]}
              </div>
              <div className="mt-2 truncate text-xs font-bold sm:text-sm">{h.name}</div>
              <div className="text-[10px] text-muted-foreground">{h.responses} saves</div>
              <div className={`mt-2 w-full rounded-t-xl bg-gradient-to-b ${s.bg} ${s.h} grid place-items-center text-[10px] font-bold uppercase tracking-widest text-black/80`}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-10 space-y-3">
        {rest.map((h, i) => (
          <div
            key={h.name}
            className="animate-fade-up grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card-soft"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-base font-bold">
              {i + 4}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold">{h.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {h.area}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                <Award className="h-3 w-3" /> {h.skill}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-success">{h.responses}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">responses</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
