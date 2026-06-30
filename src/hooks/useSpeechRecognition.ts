import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showSpeechError } from "@/services/speech";

const INACTIVITY_TIMEOUT_MS = 10000;
const TARGET_SAMPLE_RATE = 16000;

function isVoiceCaptureSupported() {
  return Boolean(
    typeof window !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof window.AudioContext === "function",
  );
}

function mergePcmChunks(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function downsamplePcm(input: Float32Array, inputRate: number, outputRate: number) {
  if (outputRate === inputRate) return input;
  if (outputRate > inputRate) return input;

  const ratio = inputRate / outputRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j] ?? 0;
      count += 1;
    }
    output[i] = count > 0 ? sum / count : 0;
  }

  return output;
}

function encodeWav(chunks: Float32Array[], inputSampleRate: number) {
  const pcm = downsamplePcm(mergePcmChunks(chunks), inputSampleRate, TARGET_SAMPLE_RATE);
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, pcm[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function readTranscriptionStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    const data = (await response.json().catch(() => null)) as { text?: string } | null;
    return data?.text?.trim() || "";
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let transcript = "";

  const consumeLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;

    try {
      const event = JSON.parse(data) as { type?: string; delta?: string; text?: string };
      if (event.type === "transcript.text.delta" && event.delta) {
        transcript += event.delta;
      }
      if (event.type === "transcript.text.done" && event.text) {
        transcript = event.text;
      }
      if (!event.type && event.text) {
        transcript = event.text;
      }
    } catch {
      // Ignore non-JSON keepalive lines.
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
  }

  if (buffer) consumeLine(buffer);
  return transcript.trim();
}

async function transcribeVoiceRecording(audio: Blob) {
  const formData = new FormData();
  formData.append("audio", audio, "voice-sos.wav");

  const response = await fetch("/api/public/voice-transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Voice transcription failed.");
    throw new Error(message || "Voice transcription failed.");
  }

  return readTranscriptionStream(response);
}

export function useSpeechRecognition(onTranscript?: (text: string) => void | Promise<void>) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(TARGET_SAMPLE_RATE);
  const lastTranscriptRef = useRef("");
  const inactivityTimerRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const recordingRef = useRef(false);
  const finishingRef = useRef(false);
  const finishRecordingRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = window.setTimeout(() => {
      if (recordingRef.current && listeningRef.current) {
        void finishRecordingRef.current?.();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const stopTracksAndNodes = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    gainRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    processorRef.current = null;
    sourceRef.current = null;
    gainRef.current = null;
    streamRef.current = null;
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const abortRecording = useCallback(() => {
    recordingRef.current = false;
    finishingRef.current = false;
    clearInactivityTimer();
    stopTracksAndNodes();
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    chunksRef.current = [];
    setListening(false);
  }, [clearInactivityTimer, stopTracksAndNodes]);

  const finishRecording = useCallback(async () => {
    if (finishingRef.current) return;
    if (!recordingRef.current) {
      setListening(false);
      return;
    }

    finishingRef.current = true;
    recordingRef.current = false;
    clearInactivityTimer();

    const chunks = chunksRef.current;
    const sampleRate = sampleRateRef.current;
    chunksRef.current = [];

    stopTracksAndNodes();
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    await audioContext?.close().catch(() => undefined);

    try {
      const audio = encodeWav(chunks, sampleRate);
      if (audio.size < 2048 || chunks.length === 0) {
        throw new Error("No speech detected. Please try again.");
      }

      const transcript = (await transcribeVoiceRecording(audio)).trim();
      if (!transcript) {
        throw new Error("No speech detected. Please try again.");
      }

      if (transcript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = transcript;
        if (typeof console !== "undefined") {
          console.info("[VoiceSOS] transcript:", transcript);
        }
        if (onTranscript) await onTranscript(transcript);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to process speech right now.";
      setError(message);
      showSpeechError(message);
    } finally {
      finishingRef.current = false;
      setListening(false);
    }
  }, [clearInactivityTimer, onTranscript, stopTracksAndNodes]);

  useEffect(() => {
    finishRecordingRef.current = finishRecording;
  }, [finishRecording]);

  const stopRecognition = useCallback(() => {
    void finishRecording();
  }, [finishRecording]);

  const startRecognition = useCallback(() => {
    if (typeof window === "undefined" || listeningRef.current || recordingRef.current) return;

    if (!isVoiceCaptureSupported()) {
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

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      .then(async (stream) => {
        const audioContext = new AudioContext();
        await audioContext.resume().catch(() => undefined);

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        const gain = audioContext.createGain();
        gain.gain.value = 0;

        chunksRef.current = [];
        sampleRateRef.current = audioContext.sampleRate;
        streamRef.current = stream;
        audioContextRef.current = audioContext;
        sourceRef.current = source;
        processorRef.current = processor;
        gainRef.current = gain;

        processor.onaudioprocess = (event) => {
          if (!recordingRef.current) return;
          const channel = event.inputBuffer.getChannelData(0);
          chunksRef.current.push(new Float32Array(channel));
        };

        source.connect(processor);
        processor.connect(gain);
        gain.connect(audioContext.destination);

        recordingRef.current = true;
        setListening(true);
        resetInactivityTimer();
      })
      .catch((err) => {
        const message = err instanceof DOMException ? err.name : "Could not start microphone.";
      setError(message);
      showSpeechError(message);
        stopTracksAndNodes();
      setListening(false);
      });
  }, [clearError, resetInactivityTimer, stopTracksAndNodes]);

  useEffect(() => {
    return () => {
      abortRecording();
    };
  }, [abortRecording]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(isVoiceCaptureSupported());
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
