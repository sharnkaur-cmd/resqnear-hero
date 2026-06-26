import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Hero — ResQNear" },
      { name: "description", content: "Join 247 trained heroes saving lives in your neighbourhood. Register in under a minute." },
    ],
  }),
  component: RegisterPage,
});

const SKILLS = ["Doctor", "Nurse", "CPR Trained", "Paramedic", "Ex-Military", "First Aider"];

function Confetti() {
  const pieces = Array.from({ length: 60 });
  const colors = ["#CC0000", "#00A86B", "#facc15", "#3b82f6", "#a855f7"];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 2 + Math.random() * 2;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              backgroundColor: color,
              width: size,
              height: size,
              animation: `confetti-fall ${duration}s ${delay}s linear forwards`,
            }}
            className="absolute top-[-20px] rounded-sm"
          />
        );
      })}
    </div>
  );
}

function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", skill: "Doctor", locality: "", pincode: "", available: true,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4500);
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-8">
      <header className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary shadow-glow">
          <Heart className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Join 247 Heroes saving lives</h1>
        <p className="mt-2 text-sm text-muted-foreground">Three minutes today. A lifetime for someone tomorrow.</p>
      </header>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-card-soft">
        <Field label="Full Name">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" className={inputCls} />
        </Field>
        <Field label="Phone Number">
          <input required type="tel" pattern="[0-9+\s]{10,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98xxx xxxxx" className={inputCls} />
        </Field>
        <Field label="Skill">
          <select value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} className={inputCls}>
            {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Locality">
            <input required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} placeholder="Koramangala" className={inputCls} />
          </Field>
          <Field label="Pincode">
            <input required pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="560034" className={inputCls} />
          </Field>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Available right now</div>
            <div className="text-xs text-muted-foreground">Receive nearby SOS alerts</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.available}
            onClick={() => setForm({ ...form, available: !form.available })}
            className={`relative h-7 w-12 rounded-full transition ${form.available ? "bg-success" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${form.available ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </label>

        <button type="submit" className="w-full rounded-xl bg-primary px-5 py-4 text-base font-bold uppercase tracking-widest text-primary-foreground shadow-glow transition active:scale-[0.98]">
          Become a Hero
        </button>
      </form>

      {submitted && (
        <>
          <Confetti />
          <div className="animate-fade-up fixed inset-x-0 bottom-6 z-50 mx-auto w-[92%] max-w-md rounded-2xl bg-success p-4 text-success-foreground shadow-glow">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <div className="font-bold">You're a Hero now 🎉</div>
                <div className="text-xs opacity-90">We'll alert you when someone nearby needs help.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
