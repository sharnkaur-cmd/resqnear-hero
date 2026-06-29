import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showSpeechError } from "@/services/speech";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike> & {
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorLike = {
  error?: string;
};

type SpeechRecognitionInstanceLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionInstanceLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

const INACTIVITY_TIMEOUT_MS = 10000;

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(onTranscript?: (text: string) => void | Promise<void>) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const finalTranscriptRef = useRef("");
  const lastTranscriptRef = useRef("");
  const inactivityTimerRef = useRef<number | null>(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = window.setTimeout(() => {
      if (recognitionRef.current && listeningRef.current) {
        recognitionRef.current.stop();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // noop
    }
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    setListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    lastTranscriptRef.current = "";
  }, []);

  const startRecognition = useCallback(() => {
    if (typeof window === "undefined" || listeningRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      const message = "Speech recognition is not supported in this browser.";
      setError(message);
      showSpeechError(message);
      setSupported(false);
      return;
    }

    if (!window.isSecureContext) {
      const message = "Use HTTPS or localhost for microphone access.";
      setError(message);
      showSpeechError(message);
      setSupported(false);
      return;
    }

    setSupported(true);
    clearError();
    clearTranscript();

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const piece = result.transcript || "";
        if (result.isFinal) {
          finalChunk += piece;
        }
      }

      if (finalChunk) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk}`.trim();
        const combined = finalTranscriptRef.current.trim();
        if (combined && combined !== lastTranscriptRef.current) {
          lastTranscriptRef.current = combined;
          if (onTranscript) {
            void onTranscript(combined);
          }
        }
      }

      resetInactivityTimer();
    };

    recognition.onerror = (event) => {
      const message = event.error || "speech-error";
      setError(message);
      showSpeechError(message);
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.onend = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
      resetInactivityTimer();
    } catch {
      const message = "Could not start microphone.";
      setError(message);
      showSpeechError(message);
      recognitionRef.current = null;
      setListening(false);
    }
  }, [clearError, clearTranscript, onTranscript, resetInactivityTimer]);

  useEffect(() => {
    return () => {
      stopRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [stopRecognition]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = getSpeechRecognitionCtor();
    setSupported(Boolean(Ctor));
  }, []);

  const controller = useMemo(
    () => ({
      start: startRecognition,
      stop: stopRecognition,
    }),
    [startRecognition, stopRecognition],
  );

  return {
    listening,
    supported,
    error,
    controller,
  };
}
