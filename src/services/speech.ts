import { toast } from "sonner";
import type { SpeechLanguage } from "@/types/speech";

export const SPEECH_LANGUAGES: Array<{ value: SpeechLanguage; label: string }> = [
  { value: "en-US", label: "English" },
  { value: "en-IN", label: "English (India)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ta-IN", label: "Tamil" },
  { value: "te-IN", label: "Telugu" },
];

export function getSpeechRecognitionLanguage(language: string): SpeechLanguage {
  return SPEECH_LANGUAGES.some((item) => item.value === language)
    ? (language as SpeechLanguage)
    : "en-US";
}

export function mapSpeechError(error: string): string {
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "Microphone permission was denied.";
    case "no-speech":
      return "No speech detected. Please try again.";
    case "network":
      return "Network error while processing speech.";
    case "not-supported":
      return "Speech recognition is not supported in this browser.";
    case "service-not-allowed":
      return "Microphone access is blocked for this site.";
    case "audio-capture":
      return "Microphone unavailable.";
    case "timeout":
      return "Speech recognition timed out.";
    default:
      return error || "Unable to process speech right now.";
  }
}

export function showSpeechError(error: string) {
  toast.error(mapSpeechError(error));
}

export async function submitTranscriptToAssistant(text: string) {
  return text.trim();
}
