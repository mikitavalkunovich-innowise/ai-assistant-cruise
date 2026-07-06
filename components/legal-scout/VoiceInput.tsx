"use client";

import { useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ value, onChange, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;

        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          const res = await fetch("/api/legal-scout/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Transcription failed");
          onChange(value ? `${value}\n${data.text}` : data.text);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied. Use the text field below.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          2 · Describe your situation
        </p>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={disabled || transcribing}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition",
            recording
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          )}
        >
          {transcribing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Transcribing...
            </>
          ) : recording ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              Stop recording
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              Record voice
            </>
          )}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Describe your legal question or problem... e.g. 'My employer wants to fire me without notice after 2 years — is this legal?'"
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 h-32"
      />

      {error && <p className="mt-1.5 text-xs text-amber-400">{error}</p>}
      <p className="mt-1.5 text-xs text-slate-600">
        Voice via Whisper, or type directly. Both work the same way.
      </p>
    </div>
  );
}
