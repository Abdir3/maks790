import { createClientOnlyFn } from "@tanstack/react-start";
import { callCaseApi } from "./case-api.client";

export const transcribeAudio = createClientOnlyFn(
  ({
    data,
  }: {
    data: {
      audio: string;
      mimeType: string;
      languageCode?: string;
    };
  }) => callCaseApi<{ text: string }>({ action: "transcribe", data }),
);
