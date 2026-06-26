export type AidCategory = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  steps: string[];
};

export const AID_CATEGORIES: AidCategory[] = [
  {
    id: "cardiac",
    title: "Cardiac Arrest",
    emoji: "❤️",
    color: "from-rose-500 to-red-700",
    steps: [
      "Check responsiveness. Shout and tap the shoulder. Call 112 immediately.",
      "Place the person flat on their back on a firm surface. Tilt head back, lift chin.",
      "Begin chest compressions: center of chest, 100–120 per minute, 5–6 cm deep.",
      "Continue compressions without interruption until a hero or ambulance arrives.",
      "If an AED is available, switch it on and follow the spoken instructions.",
    ],
  },
  {
    id: "fire",
    title: "Fire",
    emoji: "🔥",
    color: "from-orange-500 to-red-600",
    steps: [
      "Get everyone out of the building immediately. Do not stop for belongings.",
      "Stay low under smoke. Cover nose and mouth with a damp cloth.",
      "Feel doors with the back of your hand before opening — never open a hot door.",
      "Call 101 (Fire) and 112 once you are at a safe distance.",
      "If clothing is on fire: Stop, Drop, and Roll. Cool any burns with running water.",
    ],
  },
  {
    id: "accident",
    title: "Road Accident",
    emoji: "🚗",
    color: "from-amber-500 to-orange-600",
    steps: [
      "Switch on hazard lights. Make the scene safe before approaching.",
      "Call 112 and 108 for ambulance. Share exact location.",
      "Do not move the injured unless there is fire risk — spinal injury possible.",
      "Control heavy bleeding with firm pressure using a clean cloth.",
      "Keep the person warm, calm and awake until help arrives.",
    ],
  },
  {
    id: "medical",
    title: "Medical",
    emoji: "🏥",
    color: "from-sky-500 to-blue-600",
    steps: [
      "Note the symptoms, time they started and any medication taken.",
      "Help the person into a comfortable position — sitting upright if breathing is hard.",
      "Call 108 for ambulance and 112 for full emergency response.",
      "Loosen tight clothing. Do not give food or water unless instructed.",
      "Stay with them and monitor breathing until a hero arrives.",
    ],
  },
  {
    id: "safety",
    title: "Safety Threat",
    emoji: "🛡️",
    color: "from-violet-500 to-purple-700",
    steps: [
      "Move to a safe, well-lit, public location immediately.",
      "Call 112 — single emergency number connects police, fire and medical.",
      "Share live location with a trusted contact and stay on the line.",
      "Do not confront the threat. Make noise to attract attention if needed.",
      "Wait for the nearest hero or police response in a visible safe spot.",
    ],
  },
  {
    id: "choking",
    title: "Choking",
    emoji: "😮",
    color: "from-emerald-500 to-teal-600",
    steps: [
      "Ask 'Are you choking?' If they cannot speak, act immediately.",
      "Give up to 5 firm back blows between the shoulder blades.",
      "If not cleared, give 5 abdominal thrusts (Heimlich manoeuvre).",
      "Alternate back blows and abdominal thrusts until the object is dislodged.",
      "If they become unresponsive, start CPR and call 112 right away.",
    ],
  },
];

export const EMERGENCY_NUMBERS = [
  { code: "112", label: "All Emergencies" },
  { code: "108", label: "Ambulance" },
  { code: "101", label: "Fire" },
  { code: "100", label: "Police" },
];
