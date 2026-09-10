import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  audio: z.string().min(1),
  mimeType: z.string().min(1),
  languageCode: z.string().optional(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    if (!apiKey) throw new Error("Transcription is not configured.");

    const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: data.mimeType });

    const form = new FormData();
    form.append("file", blob, "dictation.webm");
    form.append("model_id", "scribe_v2");
    form.append("tag_audio_events", "false");
    form.append("diarize", "false");
    if (data.languageCode) form.append("language_code", data.languageCode);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ElevenLabs STT failed [${response.status}]: ${errorBody}`);
      throw new Error(`Transcription failed [${response.status}]: ${errorBody}`);
    }

    const result = (await response.json()) as { text?: string };
    return { text: result.text ?? "" };
  });
