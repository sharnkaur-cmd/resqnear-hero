import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { saveHero } from "@/lib/supabase";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Hero — ResQNear" },
      { name: "description", content: "Join 24/7 trained heroes saving lives in your neighbourhood. Register in under a minute." },
    ],
  }),
  component: RegisterPage,
});

const SKILLS = ["Doctor", "Nurse", "CPR Trained", "Paramedic", "Ex-Military", "First Aider", "General Helper"];

function Confetti() {
  const pieces = Array.from({ length: 70 });
  const colors = ["#E94560", "#FF2D55", "#00D4AA", "#FFB830", "#4CC9F0", "#f093fb", "#764ba2"];
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", skill: "Doctor", locality: "", pincode: "", available: true,
  });

  const [savedName, setSavedName] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { error: dbError } = await saveHero(form);
      if (dbError) throw dbError;
      setSavedName(form.name);
      setSubmitted(true);
      setForm({ name: "", phone: "", skill: "Doctor", locality: "", pincode: "", available: true });
      localStorage.setItem("resqnear_hero", JSON.stringify({ name: form.name, skill: form.skill, locality: form.locality }));
      setTimeout(() => { setSubmitted(false); window.location.href = "/"; }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save right now.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const heroData = localStorage.getItem("resqnear_hero") ? JSON.parse(localStorage.getItem("resqnear_hero")!) : null;
  if (heroData) {
    return (
      <main className="mx-auto max-w-xl px-5 pb-20 pt-8 text-center">
        <div className="mt-16 mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-blue-violet text-5xl font-black text-white shadow-glow-blue ring-4 ring-white/15 mb-6">
          {heroData.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Welcome back, {heroData.name.split(" ")[0]}! 👋</h2>
        <p className="text-sm text-white/60 mb-4">You are already a registered ResQNear Hero</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-success/15 px-4 py-2 text-sm font-bold text-success ring-1 ring-success/40 mb-6">
          <CheckCircle2 className="h-4 w-4" /> Verified Hero · {heroData.skill}
        </div>
        <p className="text-sm text-white/50 mb-8">📍 {heroData.locality}</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <a href="/" className="rounded-2xl bg-gradient-blue-violet px-6 py-3 text-sm font-bold text-white text-center shadow-glow-blue">← Back to Home</a>
          <button onClick={() => { localStorage.removeItem("resqnear_hero"); window.location.reload(); }} className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-bold text-white/70">Update Registration</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-blue-violet shadow-glow-blue">
          <Heart className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Join <span className="text-gradient-primary">24/7 Heroes</span> saving lives
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Three minutes today. A lifetime for someone tomorrow.</p>
      </header>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl glass-card p-6">
        <Field label="Full Name">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" className={inputCls} />
        </Field>
        <Field label="Phone Number">
          <input required type="tel" pattern="[0-9+\s]{10,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98xxx xxxxx" className={inputCls} />
        </Field>
        <Field label="Skill">
          <select value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} className={inputCls}>
            {SKILLS.map((s) => <option key={s} value={s} className="bg-[#16213E]">{s}</option>)}
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

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Available right now</div>
            <div className="text-xs text-muted-foreground">Receive nearby SOS alerts</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.available}
            onClick={() => setForm({ ...form, available: !form.available })}
            className={`relative h-7 w-12 rounded-full transition ${form.available ? "bg-success shadow-glow-green" : "bg-white/15"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${form.available ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </label>

        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-blue-violet px-5 py-4 text-base font-extrabold uppercase tracking-[0.22em] text-white shadow-glow-blue transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70">
          {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</> : "Become a Hero"}
        </button>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-[#E94560]/40 bg-[#E94560]/10 p-3 text-xs text-white/90">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF2D55]" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {submitted && (
        <>
          <Confetti />
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F0F1A]/80 backdrop-blur-md p-4">
            <div className="animate-fade-up w-full max-w-sm rounded-3xl glass-card p-8 text-center">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-blue-violet text-5xl font-black text-white shadow-glow-blue ring-4 ring-white/15">
                {(savedName.trim()[0] || "H").toUpperCase()}
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-success ring-1 ring-success/40">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Hero
              </div>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Welcome, {savedName.split(" ")[0] || "Hero"} 🎉</h2>
              <p className="mt-1 text-sm text-muted-foreground">You're now part of India's 24/7 hero network. We'll alert you when someone nearby needs help.</p>
              <button onClick={() => { setSubmitted(false); window.location.href = "/"; }} className="mt-5 w-full rounded-2xl bg-gradient-blue-violet px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-blue">Go to Home</button>
            </div>
          </div>
        </>
      )}
      
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none transition focus:border-white/30 focus:ring-2 focus:ring-[#E94560]/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}