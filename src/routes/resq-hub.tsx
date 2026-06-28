import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  HeartPulse,
  Hospital,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Radio,
  Shield,
  Siren,
  Stethoscope,
  Volume2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { speakText, stopSpeaking } from "@/lib/speak";

export const Route = createFileRoute("/resq-hub")({
  head: () => ({
    meta: [
      { title: "ResQNear Emergency Hub" },
      {
        name: "description",
        content: "AI powered emergency assistance, medical ID, BloodRadar, nearby help, panic sharing and emergency learning.",
      },
    ],
  }),
  component: ResQHubPage,
});

type MedicalProfile = {
  name: string;
  blood_type: string;
  age: string;
  allergies: string;
  medications: string;
  conditions: string;
  contact_name: string;
  contact_phone: string;
};

type DonorForm = {
  name: string;
  blood_type: string;
  phone: string;
  area: string;
  is_available: boolean;
};

type PanicContact = {
  name: string;
  phone: string;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const INITIAL_PROFILE: MedicalProfile = {
  name: "",
  blood_type: "O+",
  age: "",
  allergies: "",
  medications: "",
  conditions: "",
  contact_name: "",
  contact_phone: "",
};

const INITIAL_DONOR: DonorForm = {
  name: "",
  blood_type: "O+",
  phone: "",
  area: "",
  is_available: true,
};

const DEMO_DONORS = [
  { name: "Aarav Menon", blood_type: "O+", area: "Indiranagar", distance: "1.4 km", availability: "Available now", phone: "919999000111" },
  { name: "Nisha Rao", blood_type: "A-", area: "Koramangala", distance: "2.8 km", availability: "Available in 20 min", phone: "919999000222" },
  { name: "Kabir Shah", blood_type: "B+", area: "Jayanagar", distance: "3.1 km", availability: "On call", phone: "919999000333" },
];

const HOSPITALS = [
  { name: "Manipal", distance: "1.6 km", speciality: "Emergency and trauma", open: "Open 24/7" },
  { name: "Fortis", distance: "2.4 km", speciality: "Cardiac care", open: "Open" },
  { name: "Apollo", distance: "3.2 km", speciality: "Multi-speciality", open: "Open 24/7" },
  { name: "Victoria", distance: "2.1 km", speciality: "Blood bank", open: "Open" },
  { name: "St Johns", distance: "4.5 km", speciality: "Critical care", open: "Open 24/7" },
  { name: "Narayana", distance: "5.8 km", speciality: "Cardiac and neuro", open: "Open" },
];

const DOCTORS = [
  { title: "General", name: "Dr Meera Iyer", eta: "7 min" },
  { title: "Cardiac", name: "Dr Sharma", eta: "3 min" },
  { title: "Ortho", name: "Dr Farhan Ali", eta: "11 min" },
];

const COURSES = [
  {
    id: "cpr",
    title: "CPR",
    steps: ["Check response and breathing.", "Call emergency services.", "Push hard and fast in the chest centre.", "Continue until help arrives."],
  },
  {
    id: "choking",
    title: "Choking",
    steps: ["Ask if they can cough.", "Give five back blows.", "Give abdominal thrusts.", "Call emergency help if it continues."],
  },
  {
    id: "bleeding",
    title: "Bleeding",
    steps: ["Apply firm pressure.", "Raise the injured area if possible.", "Add clean cloth without removing soaked layers.", "Watch for shock."],
  },
  {
    id: "burns",
    title: "Burns",
    steps: ["Cool under running water.", "Remove tight items nearby.", "Cover with clean cloth.", "Do not apply creams in severe burns."],
  },
  {
    id: "stroke",
    title: "Stroke",
    steps: ["Check face drooping.", "Check arm weakness.", "Listen for speech trouble.", "Call emergency services immediately."],
  },
];

const DEMO_STEPS = [
  "SOS Triggered",
  "Gemini AI analyzing emergency...",
  "Emergency detected:",
  "Finding nearest hero...",
  "Hero found:",
  "Location shared",
  "AI guidance:",
];

const EMERGENCY_TYPES = ["Cardiac", "Fire", "Accident", "Medical", "Choking", "Safety Threat"];

function toTextArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ResQHubPage() {
  const [profile, setProfile] = useState<MedicalProfile>(INITIAL_PROFILE);
  const [donor, setDonor] = useState<DonorForm>(INITIAL_DONOR);
  const [selectedBlood, setSelectedBlood] = useState("O+");
  const [localDonors, setLocalDonors] = useState<typeof DEMO_DONORS>([]);
  const [profileStatus, setProfileStatus] = useState("");
  const [donorStatus, setDonorStatus] = useState("");
  const [contactsOpen, setContactsOpen] = useState(false);
  const [panicContacts, setPanicContacts] = useState<PanicContact[]>([]);
  const [contactDraft, setContactDraft] = useState<PanicContact>({ name: "", phone: "" });
  const [alertLink, setAlertLink] = useState("");
  const [completedCourses, setCompletedCourses] = useState<Record<string, boolean>>({});
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(-1);
  const [emergencyType, setEmergencyType] = useState("Cardiac");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const backup = localStorage.getItem("medical_profile_backup");
    const savedContacts = localStorage.getItem("panic_contacts");
    const savedCourses = localStorage.getItem("learn_completion");
    const savedDonors = localStorage.getItem("blood_donor_backup");
    const savedLanguage = localStorage.getItem("speech_language");

    if (backup) setProfile(JSON.parse(backup) as MedicalProfile);
    if (savedContacts) setPanicContacts(JSON.parse(savedContacts) as PanicContact[]);
    if (savedCourses) setCompletedCourses(JSON.parse(savedCourses) as Record<string, boolean>);
    if (savedDonors) setLocalDonors(JSON.parse(savedDonors) as typeof DEMO_DONORS);
    if (savedLanguage) setSelectedLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("speech_language", selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!demoActive) return;
    setDemoStep(0);
    const id = window.setInterval(() => {
      setDemoStep((current) => {
        if (current >= DEMO_STEPS.length - 1) {
          window.clearInterval(id);
          return current;
        }
        return current + 1;
      });
    }, 1100);
    return () => window.clearInterval(id);
  }, [demoActive]);

  const qrValue = useMemo(() => JSON.stringify({
    name: profile.name || "ResQNear Patient",
    blood_type: profile.blood_type,
    age: profile.age,
    allergies: profile.allergies,
    medications: profile.medications,
    conditions: profile.conditions,
    emergency_contact: `${profile.contact_name} ${profile.contact_phone}`.trim(),
  }), [profile]);

  const visibleDonors = [...localDonors, ...DEMO_DONORS].filter((item) => item.blood_type === selectedBlood);
  const courseProgress = Math.round((Object.values(completedCourses).filter(Boolean).length / COURSES.length) * 100);

  function updateProfile(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateDonor(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = event.target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
    setDonor((current) => ({ ...current, [target.name]: value }));
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem("medical_profile_backup", JSON.stringify(profile));
    setProfileStatus("Saved locally. Syncing to Supabase...");

    const { error } = await supabase.from("medical_profiles").insert({
      user_id: null,
      name: profile.name,
      blood_type: profile.blood_type,
      age: profile.age ? Number(profile.age) : null,
      allergies: toTextArray(profile.allergies),
      medications: toTextArray(profile.medications),
      conditions: toTextArray(profile.conditions),
      contact_name: profile.contact_name,
      contact_phone: profile.contact_phone,
    });

    setProfileStatus(error ? `Local backup saved. Supabase error: ${error.message}` : "Medical ID saved and backed up.");
  }

  async function registerDonor(event: FormEvent) {
    event.preventDefault();
    const newDonor = {
      name: donor.name,
      blood_type: donor.blood_type,
      phone: donor.phone,
      area: donor.area,
      distance: "Nearby",
      availability: donor.is_available ? "Available now" : "Registered",
    };
    const nextDonors = [newDonor, ...localDonors];
    setLocalDonors(nextDonors);
    localStorage.setItem("blood_donor_backup", JSON.stringify(nextDonors));
    setDonorStatus("Saved locally. Syncing to Supabase...");

    const { error } = await supabase.from("blood_donors").insert(donor);
    setDonorStatus(error ? `Local donor backup saved. Supabase error: ${error.message}` : "Donor registered.");
    setDonor(INITIAL_DONOR);
  }

  function savePanicContact(event: FormEvent) {
    event.preventDefault();
    const nextContacts = [contactDraft, ...panicContacts].filter((item) => item.name && item.phone);
    setPanicContacts(nextContacts);
    localStorage.setItem("panic_contacts", JSON.stringify(nextContacts));
    setContactDraft({ name: "", phone: "" });
  }

  function sendPanicAlert() {
    const openAlert = (mapsLink: string) => {
      const message = `Emergency from ResQNear\n\nNeed help.\n\nLocation:\n${mapsLink}`;
      const firstContact = panicContacts[0]?.phone.replace(/\D/g, "") ?? "";
      const whatsapp = `https://wa.me/${firstContact}?text=${encodeURIComponent(message)}`;
      setAlertLink(`sms:${firstContact}?body=${encodeURIComponent(message)}`);
      window.open(whatsapp, "_blank", "noopener,noreferrer");
    };

    if (!navigator.geolocation) {
      openAlert("Location unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        openAlert(`https://maps.google.com/?q=${latitude},${longitude}`);
      },
      () => openAlert("Location permission unavailable"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function speakCourse(title: string, steps: string[]) {
    const text = `${title}. ${steps.join(". ")}`;
    stopSpeaking();
    speakText(text, selectedLanguage);
  }

  function completeCourse(id: string) {
    const next = { ...completedCourses, [id]: true };
    setCompletedCourses(next);
    localStorage.setItem("learn_completion", JSON.stringify(next));
  }

  function startDemo() {
    setEmergencyType(EMERGENCY_TYPES[Math.floor(Math.random() * EMERGENCY_TYPES.length)]);
    setDemoActive(false);
    setDemoStep(-1);
    window.setTimeout(() => setDemoActive(true), 80);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-[#4cc9f0]" />
          Emergency Command Center
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
          ResQNear <span className="text-gradient-primary">Emergency Hub</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">AI powered emergency assistance</p>
        <EmergencyDashboard />
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <FeatureCard icon={HeartPulse} title="Medical ID" subtitle="Create emergency health profile">
          <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
            <TextInput name="name" value={profile.name} onChange={updateProfile} placeholder="Name" />
            <select name="blood_type" value={profile.blood_type} onChange={updateProfile} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none">
              {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <TextInput name="age" value={profile.age} onChange={updateProfile} placeholder="Age" type="number" />
            <TextInput name="contact_name" value={profile.contact_name} onChange={updateProfile} placeholder="Emergency contact" />
            <TextInput name="contact_phone" value={profile.contact_phone} onChange={updateProfile} placeholder="Contact phone" />
            <TextInput name="allergies" value={profile.allergies} onChange={updateProfile} placeholder="Allergies" />
            <TextArea name="medications" value={profile.medications} onChange={updateProfile} placeholder="Medicines" />
            <TextArea name="conditions" value={profile.conditions} onChange={updateProfile} placeholder="Medical conditions" />
            <button className="rounded-xl bg-gradient-sos px-4 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-glow-red sm:col-span-2">Save Medical ID</button>
          </form>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border border-white/10 bg-[#0F0F1A]/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What heroes see on arrival</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-lg font-extrabold">{profile.name || "Patient Name"}</p>
                <p><span className="text-muted-foreground">Blood:</span> {profile.blood_type || "Unknown"} · <span className="text-muted-foreground">Age:</span> {profile.age || "Unknown"}</p>
                <p><span className="text-muted-foreground">Allergies:</span> {profile.allergies || "None added"}</p>
                <p><span className="text-muted-foreground">Medicines:</span> {profile.medications || "None added"}</p>
                <p><span className="text-muted-foreground">Conditions:</span> {profile.conditions || "None added"}</p>
                <p><span className="text-muted-foreground">Contact:</span> {profile.contact_name || "Not added"} {profile.contact_phone}</p>
              </div>
            </div>
            <div className="grid place-items-center rounded-2xl bg-white p-3">
              <QRCodeCanvas value={qrValue} size={132} level="M" includeMargin />
            </div>
          </div>
          {profileStatus && <p className="mt-3 text-xs font-semibold text-success">{profileStatus}</p>}
        </FeatureCard>

        <FeatureCard icon={Activity} title="BloodRadar" subtitle="Urgent blood request and donor matching">
          <div className="rounded-2xl border border-[#E94560]/30 bg-[#E94560]/10 p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#ff6b7d]"><Siren className="h-4 w-4" /> Urgent Blood Request</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-black">O+ needed</p>
                <p className="text-sm text-muted-foreground">Victoria Hospital · 2.1 km</p>
              </div>
              <span className="rounded-full bg-[#E94560] px-3 py-1 text-xs font-bold text-white">Live</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((type) => (
              <button key={type} onClick={() => setSelectedBlood(type)} className={`rounded-xl px-3 py-2 text-sm font-extrabold transition ${selectedBlood === type ? "bg-gradient-sos text-white shadow-glow-red" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"}`}>
                {type}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {visibleDonors.map((item) => (
              <div key={`${item.name}-${item.phone}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="font-bold">{item.name} · {item.blood_type}</p>
                  <p className="text-xs text-muted-foreground">{item.area} · {item.distance} · {item.availability}</p>
                </div>
                <a href={`https://wa.me/${item.phone}`} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-success text-[#0F0F1A]">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
          <form onSubmit={registerDonor} className="mt-4 grid gap-2 sm:grid-cols-2">
            <TextInput name="name" value={donor.name} onChange={updateDonor} placeholder="Donor name" required />
            <select name="blood_type" value={donor.blood_type} onChange={updateDonor} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none">
              {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <TextInput name="phone" value={donor.phone} onChange={updateDonor} placeholder="WhatsApp phone" required />
            <TextInput name="area" value={donor.area} onChange={updateDonor} placeholder="Area" required />
            <label className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-muted-foreground">
              <input name="is_available" type="checkbox" checked={donor.is_available} onChange={updateDonor} /> Available
            </label>
            <button className="rounded-xl bg-gradient-teal px-4 py-2.5 text-sm font-bold text-[#0F0F1A]">Register Donor</button>
          </form>
          {donorStatus && <p className="mt-3 text-xs font-semibold text-success">{donorStatus}</p>}
        </FeatureCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <FeatureCard icon={Hospital} title="Nearby Help" subtitle="Demo emergency services nearby">
          <div className="grid grid-cols-4 gap-2">
            {["112", "108", "101", "100"].map((number) => (
              <a key={number} href={`tel:${number}`} className="rounded-xl bg-white/5 py-3 text-center text-sm font-black hover:bg-white/10">{number}</a>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {HOSPITALS.map((hospital) => (
              <div key={hospital.name} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{hospital.name}</p>
                    <p className="text-xs text-muted-foreground">{hospital.distance} · {hospital.speciality} · {hospital.open}</p>
                  </div>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(`${hospital.name} hospital`)}`} target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold">Directions</a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {DOCTORS.map((doctor) => (
              <div key={doctor.title} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-sm font-bold">{doctor.title}</span>
                <span className="text-xs text-muted-foreground">{doctor.name} · ETA {doctor.eta}</span>
              </div>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard icon={Phone} title="Panic Share" subtitle="Alert family with live location">
          <button onClick={() => setContactsOpen(true)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10">
            Save emergency contacts
          </button>
          <button onClick={sendPanicAlert} className="mt-3 w-full rounded-2xl bg-gradient-sos px-4 py-4 text-sm font-black uppercase tracking-widest text-white shadow-glow-red">
            Alert my family
          </button>
          <div className="mt-4 space-y-2">
            {panicContacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts saved yet.</p>}
            {panicContacts.map((contact) => (
              <div key={`${contact.name}-${contact.phone}`} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-sm font-bold">{contact.name}</span>
                <span className="text-xs text-muted-foreground">{contact.phone}</span>
              </div>
            ))}
          </div>
          {alertLink && <a href={alertLink} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"><MessageCircle className="h-4 w-4" /> SMS fallback</a>}
        </FeatureCard>

        <FeatureCard icon={BookOpen} title="Learn" subtitle="Emergency skills with progress">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Voice Language</span>
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold outline-none"
              >
                <option value="en-US">English</option>
                <option value="hi-IN">हिन्दी</option>
                <option value="pa-IN">ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Completion</span>
              <span>{courseProgress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-teal transition-all" style={{ width: `${courseProgress}%` }} />
            </div>
          </div>
          <div className="space-y-3">
            {COURSES.map((course) => (
              <div key={course.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{course.title}</p>
                  <button onClick={() => speakCourse(course.title, course.steps)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {course.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
                </ol>
                <button onClick={() => completeCourse(course.id)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {completedCourses[course.id] ? "Completed" : "Mark complete"}
                </button>
              </div>
            ))}
          </div>
        </FeatureCard>
      </section>

      <section className="mt-6 rounded-2xl glass-card p-5">
        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#E94560]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6b7d]">
              <Radio className="h-4 w-4" /> Live Demo Simulation
            </p>
            <h2 className="mt-3 text-2xl font-extrabold">Run the full ResQNear response flow</h2>
            <p className="mt-2 text-sm text-muted-foreground">Animated SOS, AI triage, hero discovery, location share and first guidance in one emergency drill.</p>
            <button onClick={startDemo} className="mt-5 w-full rounded-2xl bg-gradient-sos px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-glow-red sm:w-auto">
              Start ResQNear Demo
            </button>
          </div>
          <div className="relative min-h-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F1A]/70 p-5">
            <span className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E94560]/25 animate-pulse-ring" />
            <span className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4cc9f0]/30 animate-pulse-ring" style={{ animationDelay: "0.8s" }} />
            <div className="relative space-y-3">
              {DEMO_STEPS.map((step, index) => (
                <div key={step} className={`grid grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border p-3 transition ${demoStep >= index ? "border-white/20 bg-white/10 opacity-100" : "border-white/5 bg-white/[0.03] opacity-45"}`}>
                  <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${demoStep >= index ? "bg-gradient-sos text-white" : "bg-white/10 text-muted-foreground"}`}>{index + 1}</div>
                  <div>
                    <p className="text-sm font-bold">{step}</p>
                    {index === 2 && demoStep >= index && <p className="mt-1 text-xs text-[#ff6b7d]">{emergencyType}</p>}
                    {index === 4 && demoStep >= index && <p className="mt-1 text-xs text-success">Doctor Sharma · 1.2 km · ETA 3 min</p>}
                    {index === 6 && demoStep >= index && (
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        {["Stay calm", "Keep person safe", "Call emergency services", "Wait for responder"].map((item, itemIndex) => <span key={item}>{itemIndex + 1}. {item}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {contactsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">Emergency contacts</h3>
              <button onClick={() => setContactsOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={savePanicContact} className="mt-4 grid gap-3">
              <TextInput value={contactDraft.name} onChange={(event) => setContactDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Contact name" required />
              <TextInput value={contactDraft.phone} onChange={(event) => setContactDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone with country code" required />
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-blue px-4 py-3 text-sm font-bold text-white">
                <Plus className="h-4 w-4" /> Save contact
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function EmergencyDashboard() {
  return (
    <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-3">
      {[
        { icon: AlertTriangle, label: "AI Triage", value: "Live", color: "text-[#ff6b7d]" },
        { icon: MapPin, label: "Heroes", value: "18 near", color: "text-[#4cc9f0]" },
        { icon: Clock, label: "ETA", value: "3 min", color: "text-success" },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="animate-fade-up rounded-2xl glass-card p-3 text-left">
          <div className="flex items-center justify-between">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
          </div>
          <p className="mt-3 text-lg font-black">{value}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, subtitle, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl glass-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-blue-violet text-white shadow-glow-blue">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[#4cc9f0]/50" />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={3} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[#4cc9f0]/50 sm:col-span-2" />;
}
