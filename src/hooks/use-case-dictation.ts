import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeAudio } from "@/lib/transcribe.functions";

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Kunne ikke lese lydopptaket."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export function useCaseDictation(append: (questionId: string, text: string) => void) {
  const transcribe = useServerFn(transcribeAudio);
  const appendRef = useRef(append);
  appendRef.current = append;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const busyRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "recording" | "transcribing">(
    "idle",
  );
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      setStatus("transcribing");
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(
    async (target: string) => {
      if (busyRef.current) return;
      setMessage("");
      if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMessage("Diktering støttes ikke i denne nettleseren. Du kan skrive svaret ditt.");
        return;
      }
      busyRef.current = true;
      setQuestionId(target);
      setStatus("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!alive.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          if (!alive.current) return;
          setStatus("transcribing");
          try {
            const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
            if (!blob.size) throw new Error("Empty recording");
            const audio = await blobToBase64(blob);
            const result = await transcribe({
              data: { audio, mimeType: blob.type, languageCode: "nor" },
            });
            if (!alive.current) return;
            if (result.text.trim()) appendRef.current(target, result.text.trim());
            else setMessage("Ingen tale ble registrert. Prøv igjen eller skriv svaret.");
          } catch {
            if (alive.current)
              setMessage("Dikteringen kunne ikke fullføres. Teksten du har skrevet er beholdt.");
          } finally {
            busyRef.current = false;
            if (alive.current) setStatus("idle");
          }
        };
        recorder.onerror = () => {
          recorder.onstop = null;
          if (recorder.state === "recording") recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          busyRef.current = false;
          if (alive.current) {
            setStatus("idle");
            setMessage("Lydopptaket ble avbrutt. Prøv igjen eller skriv svaret.");
          }
        };
        recorderRef.current = recorder;
        recorder.start();
        setStatus("recording");
      } catch {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        busyRef.current = false;
        if (alive.current) {
          setStatus("idle");
          setMessage(
            "Fikk ikke tilgang til mikrofonen. Sjekk nettlesertillatelsene eller skriv svaret.",
          );
        }
      }
    },
    [transcribe],
  );

  return { status, questionId, message, start, stop, busy: status !== "idle" };
}
