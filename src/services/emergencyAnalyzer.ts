// Client-side Gemini wrapper. Prefers server fn via Lovable AI Gateway when
// VITE_GEMINI_API_KEY is not set (keys should not be shipped to browsers).
export type AnalyzedEmergency = {
  emergencyType: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  severityScore: number;
  urgency: "Immediate" | "Urgent" | "Standard";
  recommendedAction: string;
  firstAidSteps: string[];
  callNumber: string;
  language: string;
};

export async function analyzeEmergency(
  type: string,
  description: string,
  location: string,
  language: "en-IN" | "hi-IN" = "en-IN",
): Promise<AnalyzedEmergency> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

  const prompt = `You are an emergency response AI for India.
Analyze this emergency and respond ONLY in JSON.
Emergency type: ${type}
Description: ${description}
Location: ${location}
Language preference: ${language}
Return exactly this JSON:
{
  "emergencyType": "${type}",
  "severity": "Critical or High or Medium or Low",
  "severityScore": 92,
  "urgency": "Immediate or Urgent or Standard",
  "recommendedAction": "max 30 words action",
  "firstAidSteps": ["step1","step2","step3","step4","step5"],
  "callNumber": "108",
  "language": "${language}"
}
Use Indian emergency numbers only. Never use 911.
Ambulance: 108, Emergency: 112, Fire: 101, Police: 100`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
