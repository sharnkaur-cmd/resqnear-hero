import { createFileRoute } from "@tanstack/react-router";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = new Set(["audio/wav", "audio/wave", "audio/x-wav"]);

function getAudioExtension(type: string) {
  const normalized = type.split(";")[0]?.toLowerCase() || "audio/wav";
  if (normalized === "audio/wav" || normalized === "audio/wave" || normalized === "audio/x-wav") {
    return "wav";
  }
  return "wav";
}

export const Route = createFileRoute("/api/public/voice-transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Voice transcription is not configured.", { status: 500 });
        }

        const contentType = request.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("multipart/form-data")) {
          return new Response("Expected multipart audio upload.", { status: 400 });
        }

        const formData = await request.formData();
        const audio = formData.get("audio");

        if (!(audio instanceof File)) {
          return new Response("Missing audio file.", { status: 400 });
        }

        const audioType = audio.type.split(";")[0]?.toLowerCase() || "audio/wav";
        if (!ACCEPTED_AUDIO_TYPES.has(audioType)) {
          return new Response("Unsupported audio format.", { status: 400 });
        }

        if (audio.size < 2048) {
          return new Response("Recording was empty. Please try again.", { status: 400 });
        }

        if (audio.size > MAX_AUDIO_BYTES) {
          return new Response("Recording is too large. Please keep it under 25 MB.", { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("language", "en");
        upstream.append("stream", "true");
        upstream.append("file", audio, `voice-sos.${getAudioExtension(audioType)}`);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: upstream,
        });

        if (!response.ok) {
          const message = await response.text().catch(() => "Voice transcription failed.");
          return new Response(message || "Voice transcription failed.", { status: response.status });
        }

        return new Response(response.body, {
          status: response.status,
          headers: {
            "content-type": response.headers.get("content-type") || "text/event-stream",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});