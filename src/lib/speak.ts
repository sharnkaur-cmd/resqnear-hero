// Web Speech API helper

let speechSynthUtterance: SpeechSynthesisUtterance | null = null;
let voices: SpeechSynthesisVoice[] = [];

// Load voices when available
if (typeof window !== "undefined" && window.speechSynthesis) {
  // Load voices immediately if available
  voices = window.speechSynthesis.getVoices();

  // Also listen for voices changed event
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
    console.log("Voices loaded:", voices.length);
  };
}

export function speakText(text: string, lang: string = "en-US"): void {
  console.log("speakText() called:", { text: text.substring(0, 30), lang });

  try {
    // Cancel ongoing speech
    stopSpeaking();

    // Check if Web Speech API is supported
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthUtterance = utterance;

    // Try to find a voice for the selected language
    const langMap: Record<string, string> = {
      "en-US": "en-US",
      "en-IN": "en-IN",
      "hi-IN": "hi-IN",
      "pa-IN": "pa-IN",
    };

    const targetLang = langMap[lang] || "en-US";
    utterance.lang = targetLang;
    utterance.rate = 1;
    utterance.pitch = 1;

    // Try to select a specific voice if available
    const voice = voices.find((v) => v.lang.startsWith(targetLang.split("-")[0]));
    if (voice) {
      utterance.voice = voice;
      console.log("Using voice:", voice.name, voice.lang);
    }

    console.log("Speaking:", { text: text.substring(0, 50), lang: utterance.lang });

    utterance.onstart = () => {
      console.log("✓ Speech started");
    };

    utterance.onend = () => {
      console.log("✓ Speech finished");
      speechSynthUtterance = null;
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // Ignore benign errors caused by cancel()/new utterance starting
      const benign = ["interrupted", "canceled", "cancelled"];
      if (e.error && benign.includes(e.error)) {
        speechSynthUtterance = null;
        return;
      }
      console.error("✗ Speech error:", e.error || e);
      speechSynthUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
    console.log("✓ speechSynthesis.speak() called");
  } catch (e) {
    console.error("✗ Audio failed:", e);
    speechSynthUtterance = null;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    speechSynthUtterance = null;
  }
}
