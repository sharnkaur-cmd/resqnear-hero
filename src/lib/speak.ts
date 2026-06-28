let cachedVoices: SpeechSynthesisVoice[] | null = null;
let pendingResolvers: (() => void)[] = [];

function ensureVoices(): Promise<void> {
  if (cachedVoices) return Promise.resolve();

  const current = window.speechSynthesis.getVoices();
  if (current.length > 0) {
    cachedVoices = current;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    pendingResolvers.push(resolve);
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = null;
      pendingResolvers.forEach((r) => r());
      pendingResolvers = [];
    };
  });
}

export async function speak(text: string, lang: string = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  await ensureVoices();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.lang = lang;

  if (cachedVoices) {
    const match = cachedVoices.find((v) => v.lang === lang);
    if (match) utter.voice = match;
  }

  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
