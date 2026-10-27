// AES-GCM protects the answer key even from an authenticated direct database read.
// AAD binds ciphertext to owner, case ID and canonical student-visible content.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function encode(bytes: Uint8Array) {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}
function decode(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function key(secret: string) {
  if (secret.length < 24) throw new Error("Vurderingstjenesten mangler sikker servernøkkel.");
  return crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
export function assessmentSecret() {
  const secret = process.env["CASE_ASSESSMENT_KEY"] || process.env["LOVABLE_API_KEY"];
  if (!secret) throw new Error("Vurderingstjenesten er ikke konfigurert på serveren.");
  return secret;
}
export async function sealAssessment(
  value: unknown,
  owner: string,
  definition: unknown,
  secret: string,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(canonical({ owner, definition }));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    await key(secret),
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return `v1.${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
}
export async function openAssessment(
  sealed: string,
  owner: string,
  definition: unknown,
  secret: string,
): Promise<unknown> {
  try {
    const [version, iv, body, extra] = sealed.split(".");
    if (version !== "v1" || !iv || !body || extra) throw new Error("version");
    const bytes = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(iv),
        additionalData: new TextEncoder().encode(canonical({ owner, definition })),
      },
      await key(secret),
      decode(body),
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error(
      "Vurderingsgrunnlaget kunne ikke bekreftes. Casen kan fortsatt brukes til egenøving.",
    );
  }
}
