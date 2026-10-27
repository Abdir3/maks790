// Best-effort per-instance concurrency guard; not a distributed quota or rate limiter.
const active = new Set<string>();
export async function withCaseOperation<T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (active.has(userId))
    throw new Error("En case eller tilbakemelding behandles allerede. Vent til den er ferdig.");
  active.add(userId);
  try {
    return await operation();
  } finally {
    active.delete(userId);
  }
}
