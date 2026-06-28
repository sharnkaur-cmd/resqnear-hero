import { createServerFn } from "@tanstack/react-start";

export type EmergencyAnalysis = {
  emergencyType: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  severityScore: number;
  recommendedAction: string;
  urgency: "Immediate" | "Urgent" | "Standard";
  firstAidSteps: string[];
  heroSkillNeeded: string;
  callNumber: string;
};

function fallback(type: string): EmergencyAnalysis {
  return {
    emergencyType: type,
    severity: "High",
    severityScore: 78,
    recommendedAction:
      "Keep the person calm and still. Call 112 immediately. Share your live location and follow the first-aid steps below until a hero arrives.",
    urgency: "Immediate",
    firstAidSteps: [
      "Check responsiveness — tap the shoulder and shout to confirm consciousness.",
      "Call 112 and share your exact location and the emergency type.",
      "Clear the area and place the person in a safe, comfortable position.",
      "Begin appropriate first-aid (CPR for cardiac, pressure for bleeding, recovery position otherwise).",
      "Do not leave the person. Talk to them until a trained hero or ambulance arrives.",
    ],
    heroSkillNeeded: "Doctor or Paramedic",
    callNumber: "112",
  };
}

export const analyzeEmergency = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { type: string; location?: string })
  .handler(async ({ data }): Promise<EmergencyAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return fallback(data.type);

    const prompt = `You are an emergency response AI for India. Analyze this emergency and respond in JSON only.
Emergency type: ${data.type}
Location: ${data.location ?? "Bengaluru, India"}

Respond with exactly this JSON structure (no markdown, no commentary, just JSON):
{
  "emergencyType": "string",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "severityScore": number between 0 and 100,
  "recommendedAction": "string max 50 words",
  "urgency": "Immediate" | "Urgent" | "Standard",
  "firstAidSteps": [exactly 5 short string steps],
  "heroSkillNeeded": "string",
  "callNumber": "112"
}
Never use 911. Always use 112 for India.`;

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
              content: "You are an emergency response AI for India. Return only valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return fallback(data.type);
      const j = await res.json();
      const text: string = j.choices?.[0]?.message?.content ?? "";
      const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned) as EmergencyAnalysis;
      parsed.callNumber = "112";
      if (!Array.isArray(parsed.firstAidSteps) || parsed.firstAidSteps.length === 0) {
        parsed.firstAidSteps = fallback(data.type).firstAidSteps;
      }
      return parsed;
    } catch {
      return fallback(data.type);
    }
  });

export type TtsResponse = {
  audioBase64: string;
  mimeType: string;
};

export const textToSpeech = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { text: string; lang?: string })
  .handler(async ({ data }): Promise<TtsResponse> => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("Missing Gemini API key - check .env file");
      throw new Error("Missing Gemini API key");
    }

    const lang = data.lang || "en-US";

    try {
      console.log("Calling Gemini TTS with:", { text: data.text, lang });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateSpeech?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: data.text },
            voice: { languageCode: "en-IN", name: "en-IN-Wavenet-C" },
            audioConfig: { audioEncoding: "MP3" },
          }),
        },
      );

      console.log("Gemini TTS response status:", res.status, res.statusText);

      if (!res.ok) {
        const errText = await res.text();
        console.error("TTS API error:", res.status, res.statusText);
        console.error("TTS API error body:", errText);
        throw new Error(`TTS API error: ${res.status} - ${errText}`);
      }

      const j = await res.json();
      console.log("Gemini TTS response keys:", Object.keys(j));

      // Check for audioContent in the response
      const audioContent = j.audioContent || j.data?.audioContent;

      if (!audioContent) {
        console.error("Gemini TTS full response (no audioContent):", JSON.stringify(j));
        throw new Error("No audio data in response");
      }

      return {
        audioBase64: audioContent,
        mimeType: "audio/mp3",
      };
    } catch (e) {
      console.error("TTS failed:", e);
      throw e;
    }
  });
