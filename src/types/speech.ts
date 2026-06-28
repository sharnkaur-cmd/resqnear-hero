export type SpeechLanguage = "en-US" | "en-IN" | "hi-IN" | "kn-IN" | "ta-IN" | "te-IN";

export interface SpeechRecognitionState {
  listening: boolean;
  supported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  language: SpeechLanguage;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  clear: () => void;
  setLanguage: (language: SpeechLanguage | string) => void;
}
