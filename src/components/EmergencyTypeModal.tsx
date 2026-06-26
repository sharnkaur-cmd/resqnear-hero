import { X } from "lucide-react";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";

type Props = { onSelect: (c: AidCategory) => void; onClose: () => void };

export function EmergencyTypeModal({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="animate-fade-up w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-card-soft sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">SOS Activated</p>
            <h2 className="mt-1 text-2xl font-bold">What is the emergency?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tap to alert the nearest trained hero.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {AID_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`animate-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-4 text-left text-white shadow-card-soft transition active:scale-95`}
            >
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-2 text-sm font-bold leading-tight">{c.title}</div>
              <div className="absolute inset-0 bg-white/0 transition group-hover:bg-white/10" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
