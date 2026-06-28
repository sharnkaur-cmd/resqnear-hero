import { createServerFn } from "@tanstack/react-start";
import { AID_CATEGORIES, type AidCategory } from "@/lib/first-aid";

export const EMERGENCY_TYPE_LABELS = [
  "Cardiac Arrest",
  "Fire",
  "Road Accident",
  "Medical",
  "Choking",
  "Safety Threat",
] as const;

export type EmergencyTypeLabel = (typeof EMERGENCY_TYPE_LABELS)[number];

export type VoiceConfidence = "high" | "medium" | "low";

export type VoiceEmergencyResult = {
  label: EmergencyTypeLabel;
  category: AidCategory;
  guidanceSteps: string[];
  confidence: VoiceConfidence;
};

const LABEL_TO_CATEGORY_ID: Record<EmergencyTypeLabel, string> = {
  "Cardiac Arrest": "cardiac",
  Fire: "fire",
  "Road Accident": "accident",
  Medical: "medical",
  Choking: "choking",
  "Safety Threat": "safety",
};

const FALLBACK_GUIDANCE: Record<EmergencyTypeLabel, string[]> = {
  "Cardiac Arrest": [
    "Sit down calmly and stay still.",
    "Keep the person comfortable and loosen tight clothing.",
    "Avoid unnecessary movement.",
    "Call 112 or 108 for emergency support.",
    "Wait for help and monitor breathing.",
  ],
  Fire: [
    "Leave the building or area immediately.",
    "Stay low if there is smoke.",
    "Do not stop for belongings or use elevators.",
    "Call 101 once you are at a safe distance.",
    "Wait away from the fire until help arrives.",
  ],
  "Road Accident": [
    "Move to a safe spot off the road.",
    "Switch on hazard lights if possible.",
    "Do not move anyone with serious injuries.",
    "Call 112 and share your exact location.",
    "Stay with the injured until help arrives.",
  ],
  Medical: [
    "Note symptoms and when they started.",
    "Help the person rest in a comfortable position.",
    "Loosen tight clothing and keep them calm.",
    "Call 108 for ambulance if needed.",
    "Stay with them and monitor their condition.",
  ],
  Choking: [
    "Ask if they are choking — act if they cannot speak.",
    "Give up to 5 firm back blows between shoulder blades.",
    "Use abdominal thrusts if back blows do not work.",
    "Call 112 if they become unresponsive.",
    "Continue until the airway is clear.",
  ],
  "Safety Threat": [
    "Move to a safe, well-lit, public place.",
    "Stay away from the threat — do not confront.",
    "Call 112 immediately.",
    "Share your live location with someone trusted.",
    "Wait for help in a visible safe spot.",
  ],
};

function normalizeEmergencyLabel(label: string): EmergencyTypeLabel | null {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (normalized === "cardiac" || normalized.includes("cardiac") || normalized.includes("heart")) {
    return "Cardiac Arrest";
  }
  if (normalized.includes("fire") || normalized.includes("burn")) {
    return "Fire";
  }
  if (
    normalized.includes("accident") ||
    normalized.includes("crash") ||
    normalized.includes("collision")
  ) {
    return "Road Accident";
  }
  if (
    normalized.includes("medical") ||
    normalized.includes("injury") ||
    normalized.includes("fever")
  ) {
    return "Medical";
  }
  if (normalized.includes("chok") || normalized.includes("throat")) {
    return "Choking";
  }
  if (
    normalized.includes("threat") ||
    normalized.includes("unsafe") ||
    normalized.includes("danger")
  ) {
    return "Safety Threat";
  }

  const exact = EMERGENCY_TYPE_LABELS.find((candidate) => candidate.toLowerCase() === normalized);
  return exact ?? null;
}

export function categoryFromLabel(label: string): AidCategory {
  const normalized = normalizeEmergencyLabel(label);
  if (normalized) {
    return (
      AID_CATEGORIES.find((c) => c.id === LABEL_TO_CATEGORY_ID[normalized]) ?? AID_CATEGORIES[0]
    );
  }

  return AID_CATEGORIES[0];
}

export function labelFromCategory(category: AidCategory): EmergencyTypeLabel {
  const match = EMERGENCY_TYPE_LABELS.find((t) => LABEL_TO_CATEGORY_ID[t] === category.id);
  return match ?? "Medical";
}

function detectConfidence(text: string, label: EmergencyTypeLabel): VoiceConfidence {
  const t = text.toLowerCase();
  const strongSignals = [
    "heart attack",
    "cardiac",
    "chest pain",
    "fire",
    "smoke",
    "on fire",
    "burning",
    "accident",
    "crash",
    "collision",
    "bike",
    "car hit",
    "road accident",
    "choking",
    "can't breathe",
    "cannot breathe",
    "stuck in throat",
    "threat",
    "attack",
    "unsafe",
    "danger",
    "rob",
    "bleeding",
    "bleed",
  ];
  const hasStrongSignal = strongSignals.some((signal) => t.includes(signal));
  if (!text.trim()) return "low";
  if (hasStrongSignal) return "high";
  return t.split(/\s+/).length >= 4 ? "medium" : "low";
}

export function fallbackClassifySpeech(text: string): VoiceEmergencyResult {
  const t = text.toLowerCase();
  let label: EmergencyTypeLabel = "Medical";

  if (
    t.includes("heart") ||
    t.includes("chest pain") ||
    t.includes("cardiac") ||
    t.includes("heart attack") ||
    t.includes("सीने") ||
    t.includes("दिल")
  ) {
    label = "Cardiac Arrest";
  } else if (
    t.includes("fire") ||
    t.includes("burning") ||
    t.includes("on fire") ||
    t.includes("smoke") ||
    t.includes("आग")
  ) {
    label = "Fire";
  } else if (
    t.includes("accident") ||
    t.includes("crash") ||
    t.includes("collision") ||
    t.includes("bike") ||
    t.includes("car hit") ||
    t.includes("road accident")
  ) {
    label = "Road Accident";
  } else if (
    t.includes("chok") ||
    t.includes("stuck in throat") ||
    t.includes("can't breathe because") ||
    t.includes("cannot breathe because")
  ) {
    label = "Choking";
  } else if (
    t.includes("threat") ||
    t.includes("attack") ||
    t.includes("unsafe") ||
    t.includes("danger") ||
    t.includes("rob")
  ) {
    label = "Safety Threat";
  } else if (
    t.includes("fever") ||
    t.includes("injury") ||
    t.includes("sick") ||
    t.includes("bleed") ||
    t.includes("medical") ||
    t.includes("wound")
  ) {
    label = "Medical";
  }

  return {
    label,
    category: categoryFromLabel(label),
    guidanceSteps: FALLBACK_GUIDANCE[label],
    confidence: detectConfidence(text, label),
  };
}

function normalizeGuidance(steps: unknown, label: EmergencyTypeLabel): string[] {
  const fallback = FALLBACK_GUIDANCE[label];
  if (!Array.isArray(steps)) return fallback;
  const cleaned = steps
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5);
  if (cleaned.length < 4) return fallback;
  return cleaned;
}

function parseGeminiResponse(raw: string): {
  label: EmergencyTypeLabel | null;
  guidanceSteps: string[] | null;
} {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { category?: string; guidanceSteps?: string[] };
    if (!parsed.category) return { label: null, guidanceSteps: null };
    const label = normalizeEmergencyLabel(parsed.category);
    if (!label) return { label: null, guidanceSteps: null };
    return {
      label,
      guidanceSteps: Array.isArray(parsed.guidanceSteps) ? parsed.guidanceSteps : null,
    };
  } catch {
    const label = normalizeEmergencyLabel(cleaned);
    return { label, guidanceSteps: null };
  }
}

export const classifyEmergencySpeech = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { speech: string })
  .handler(async ({ data }): Promise<VoiceEmergencyResult> => {
    const speech = data.speech.trim();
    const fallback = fallbackClassifySpeech(speech);

    const key = process.env.LOVABLE_API_KEY;
    if (!key || !speech) return fallback;

    const prompt = `You are an emergency triage AI for India. Classify the caller's speech and give short first-aid guidance.

Allowed categories ONLY (exact spelling):
1. Cardiac Arrest — heart pain, chest pain, cardiac problem, सीने में दर्द
2. Fire — house on fire, fire accident, burning, आग लग गई
3. Road Accident — car accident, bike crash, road accident
4. Medical — fever, injury, sickness, medical emergency
5. Choking — choking, can't breathe because something stuck
6. Safety Threat — danger, unsafe situation, attack, threat

Caller speech: "${speech}"

Respond with JSON only:
{
  "category": "one of the six labels above",
  "guidanceSteps": ["exactly 4 or 5 very short actionable steps for this emergency"]
}

Rules:
- guidanceSteps must be 4 or 5 items, each under 12 words
- Use Indian emergency numbers (112, 108) where relevant
- Never use 911`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "Return only valid JSON with category and guidanceSteps fields.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) return fallback;

      const j = await res.json();
      const text: string = j.choices?.[0]?.message?.content ?? "";
      const parsed = parseGeminiResponse(text);
      if (!parsed.label) return fallback;

      return {
        label: parsed.label,
        category: categoryFromLabel(parsed.label),
        guidanceSteps: normalizeGuidance(parsed.guidanceSteps, parsed.label),
        confidence: detectConfidence(speech, parsed.label),
      };
    } catch {
      return fallback;
    }
  });
