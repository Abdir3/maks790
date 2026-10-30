// Deliberately fixed: an obsolete environment setting cannot enable a premium tier.
// Prices verified against https://developers.openai.com/api/docs/models/gpt-6.1-terra
export const CASE_MODEL = "gpt-6.1-terra";
export const CASE_SERVICE_TIER = "default";
export const MAX_REQUEST_BYTES = 160000;
export const MAX_OUTPUT_TOKENS = 22000;

export function requestBudget(
  content: { instructions: string; input: string; schema: Record<string, unknown> },
  requestedOutputTokens = 16000,
) {
  const inputBytes = new TextEncoder().encode(JSON.stringify(content)).byteLength;
  const maxOutputTokens = Math.max(
    1,
    Math.min(MAX_OUTPUT_TOKENS, Math.floor(requestedOutputTokens)),
  );
  if (inputBytes > MAX_REQUEST_BYTES || !Number.isFinite(maxOutputTokens)) return null;
  // Byte count deliberately overestimates text tokens. Extra headroom covers
  // schema/message formatting; cache writes use the highest standard input price
  // (12-hour cache retention), even when the provider charges the lower rate.
  // Output cap includes hidden reasoning tokens. No tools or premium processing.
  const maximumCostUsd = Math.ceil((inputBytes + 10000) * 2.5 + maxOutputTokens * 5) / 1000000;
  return { inputBytes, maxOutputTokens, maximumCostUsd };
}
