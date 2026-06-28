import { X } from "lucide-react";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";

type Props = { onSelect: (c: AidCategory) => void; onClose: () => void };

const GRADIENTS: Record<string, string> = {
  cardiac: "bg-[linear-gradient(135deg,#764ba2,#f093fb)]",
  fire: "bg-[linear-gradient(135deg,#FF6B35,#F7931E)]",
  accident: "bg-[linear-gradient(135deg,#FFB830,#FF8C00)]",
  medical: "bg-[linear-gradient(135deg,#4CC9F0,#4361EE)]",
  safety: "bg-[linear-gradient(135deg,#7209B7,#560BAD)]",
  choking: "bg-[linear-gradient(135deg,#00D4AA,#00B4D8)]",
};

export function EmergencyTypeModal({ onSelect, onClose }: Props) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center">
      <div className="animate-fade-up w-full max-w-lg overflow-hidden rounded-t-3xl glass-card p-6 sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gradient-sos">
              SOS Activated
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight">
              What is the emergency?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap to alert the nearest trained hero.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {AID_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`animate-fade-up group relative overflow-hidden rounded-2xl ${GRADIENTS[c.id]} p-4 text-left text-white shadow-card transition hover:scale-[1.03] active:scale-95`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60" />
              <div className="relative text-3xl">{c.emoji}</div>
              <div className="relative mt-2 text-sm font-bold leading-tight">{c.title}</div>
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-2xl transition group-hover:bg-white/25" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
