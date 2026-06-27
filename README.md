# 🚨 ResQNear

> **Your nearest hero. In seconds.**

A hyperlocal, AI-powered emergency first-responder network for India. When every second counts, ResQNear matches the victim with the nearest trained hero (doctor, nurse, paramedic, CPR-certified citizen) within a 1 km radius — while Gemini AI delivers step-by-step first-aid guidance and triages severity in real time.

---

## 🩺 The Problem

In India, the average ambulance takes **20–30 minutes** to arrive in city traffic. For cardiac arrest, brain death begins in **4–6 minutes**. Thousands of lives are lost every year not because help didn't exist — but because it didn't arrive in time.

## 💡 The Solution

ResQNear turns every trained citizen into a first responder.

1. **One-tap SOS** broadcasts to verified heroes within 1 km.
2. **Gemini AI** triages severity, picks the right skill (cardiologist, trauma nurse, etc.) and streams first-aid steps to the bystander.
3. **Live map + ETA countdown** while 112 is alerted in parallel.
4. **Offline-first PWA** — the 7 core screens and first-aid guide are cached for low-connectivity emergencies.

---

## ✨ Features

- 🆘 **Pulsing SOS button** with GPS-accuracy verification before broadcast
- 🤖 **AI Triage (Gemini)** — severity %, recommended action, 5 first-aid steps
- 🗺️ **Live Leaflet map** with user + hero markers and pulsing rings
- 🧑‍⚕️ **Random hero matching** from a pool of 12 verified Indian responders
- 🏆 **Community leaderboard** — podium + cards, lives saved
- 📝 **Hero registration** saved to Lovable Cloud (Supabase)
- 📖 **AI First-Aid Guide** with Web Speech Synthesis "Read Aloud"
- 📞 **One-tap dial** for India numbers — 112, 108, 101, 100 (never 911)
- 🎬 **Demo mode** — full 7-step end-to-end simulation
- 📱 **Mobile-first PWA** — installable, offline cache, glassmorphism dark UI

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | **TanStack Start** (React 19 + Vite 7, file-based routing, SSR) |
| Styling | **Tailwind CSS v4** with custom glassmorphism design tokens |
| AI | **Google Gemini 3 Flash** via Lovable AI Gateway |
| Backend | **Lovable Cloud** (Supabase Postgres + Auth) |
| Maps | Leaflet + OpenStreetMap (dark tiles) |
| Voice | Web Speech Synthesis API |
| Geo | Browser Geolocation API (50 m accuracy gate) |
| PWA | `vite-plugin-pwa` + Workbox runtime caching |

---

## 🚀 Run Locally

```bash
bun install
bun run dev
```

App boots at `http://localhost:8080`.

### Environment

Supabase URL + anon key are hardcoded in `src/config.ts` (publishable, RLS-protected).
The Gemini key (`LOVABLE_API_KEY`) is auto-provisioned by Lovable on the server side — never exposed to the browser.

For a self-hosted deploy, set:

```env
LOVABLE_API_KEY=<provisioned by Lovable AI Gateway>
```

### Supabase Schema

```sql
create table public.heroes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  skill text not null,
  locality text not null,
  pincode text not null,
  available boolean default true,
  created_at timestamptz default now()
);

create table public.emergencies (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  lat double precision,
  lon double precision,
  hero_name text,
  severity text,
  severity_score int,
  created_at timestamptz default now()
);

grant insert, select on public.heroes, public.emergencies to anon, authenticated;
alter table public.heroes enable row level security;
alter table public.emergencies enable row level security;
create policy "public insert heroes" on public.heroes for insert to anon with check (true);
create policy "public insert emergencies" on public.emergencies for insert to anon with check (true);
```

---

## 📸 Screens

1. **Home** — Animated SOS button + live stats (heroes nearby, lives saved, avg response).
2. **Emergency Picker** — 6 gradient cards (Cardiac, Fire, Accident, Medical, Safety, Choking).
3. **Emergency Active** — AI triage gauge, live map, matched hero card, 5-min ETA, first-aid steps.
4. **Heroes Leaderboard** — Gold/silver/bronze podium + ranked cards.
5. **Hero Registration** — Skill / locality / availability form (saves to Supabase).
6. **AI First-Aid Guide** — Categories, step-by-step, read aloud, India emergency numbers.
7. **Demo** — 7-step auto simulation with progress bar.

---

## 🌐 Live URL

> _Add your published URL here once deployed._

---

## 🏆 Built for the Hackathon

Made with ❤️ in India. Built with [Lovable](https://lovable.dev).
