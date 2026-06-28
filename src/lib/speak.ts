import { textToSpeech } from "@/lib/ai.functions";

let currentAudio: HTMLAudioElement | null = null;

export async function speak(text: string, lang: string = "en-US") {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const result = await textToSpeech({ data: { text, lang } });

    const audio = new Audio(`data:${result.mimeType};base64,${result.audioBase64}`);
    currentAudio = audio;
    await audio.play();
    currentAudio = null;
  } catch (e) {
    console.error("Audio playback failed:", e);
    alert("Audio not available. Please try again.");
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
