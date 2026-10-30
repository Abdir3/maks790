import { useCallback, useEffect, useRef, useState } from "react";
import { getGenerationStatus, startCaseGeneration } from "@/lib/cases.functions";
import { readGenerationProgress } from "@/lib/case-generation-progress";
import type { GenerationJob } from "@/lib/case-generation-job";
import type { GenerateOptions } from "@/lib/case-api-contract";

// Generation belongs to the account, not the lifetime of a browser tab.
export function useGenerationJob(owner: string | undefined, ready: boolean) {
  const [state, setState] = useState<{
    owner: string | undefined;
    job: GenerationJob | null;
    error: string | null;
    checked: boolean;
    updatedAt: number | null;
  }>({ owner: undefined, job: null, error: null, checked: false, updatedAt: null });
  const [starting, setStarting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(0);
  const [localStart, setLocalStart] = useState<{ id: string; at: number } | null>(null);
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const generation = useRef(0);
  const submitting = useRef(false);
  const refreshing = useRef<symbol | null>(null);
  const job = state.owner === owner ? state.job : null;
  const currentJob = useRef(job);
  currentJob.current = job;
  const lastPoll = useRef(0);
  const startFailure = useRef<{ owner: string; previousId: string | null; message: string } | null>(
    null,
  );
  const refresh = useCallback(async () => {
    if (!ready || !owner || refreshing.current || submitting.current) return;
    const request = Symbol("generation-status");
    refreshing.current = request;
    lastPoll.current = Date.now();
    const revision = generation.current;
    try {
      const next = await getGenerationStatus(owner);
      if (currentOwner.current === owner && revision === generation.current) {
        const failure = startFailure.current;
        const error =
          failure?.owner === owner && failure.previousId === (next?.id ?? null)
            ? failure.message
            : null;
        if (!error) startFailure.current = null;
        setState({ owner, job: next, error, checked: true, updatedAt: Date.now() });
      }
    } catch (error) {
      if (currentOwner.current === owner && revision === generation.current)
        setState((previous) => ({
          owner,
          job: previous.owner === owner ? previous.job : null,
          checked: false,
          updatedAt: previous.owner === owner ? previous.updatedAt : null,
          error: error instanceof Error ? error.message : "Kunne ikke hente status for casen.",
        }));
    } finally {
      if (refreshing.current === request) refreshing.current = null;
    }
  }, [owner, ready]);

  useEffect(() => {
    generation.current++;
    submitting.current = false;
    refreshing.current = null;
    setStarting(false);
    setSubmittedAt(0);
    setLocalStart(null);
    startFailure.current = null;
    setState({ owner, job: null, error: null, checked: false, updatedAt: null });
    if (!ready || !owner) return;
    void refresh();
    const onReturn = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    // This only observes. The server continues even with every browser closed.
    const timer = setInterval(() => {
      const interval = currentJob.current?.status === "pending" ? 2500 : 15000;
      if (Date.now() - lastPoll.current >= interval) onReturn();
    }, 2500);
    return () => {
      // This ref is a request epoch, not a DOM ref; invalidate all in-flight replies.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      clearInterval(timer);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [owner, ready, refresh]);

  const start = async (options: GenerateOptions) => {
    if (
      !owner ||
      !ready ||
      !state.checked ||
      state.owner !== owner ||
      submitting.current ||
      job?.status === "pending"
    )
      return job;
    submitting.current = true;
    startFailure.current = null;
    setStarting(true);
    const buttonPressedAt = Date.now();
    setSubmittedAt(buttonPressedAt);
    const requestId = crypto.randomUUID();
    const revision = ++generation.current;
    try {
      const response = await startCaseGeneration({ data: options, requestId, owner });
      if (currentOwner.current !== owner || revision !== generation.current) return null;
      if (response.status !== "pending" && response.status !== "completed")
        throw new Error("Ugyldig svar fra casetjenesten.");
      const next: GenerationJob = {
        id: response.jobId ?? requestId,
        status: response.status,
        format: response.format ?? options.format,
        createdAt: response.createdAt ?? new Date().toISOString(),
        progress: readGenerationProgress(response.progress) ?? { phase: "queued" },
        options,
        ...(response.result?.definition ? { definition: response.result.definition } : {}),
      };
      setState({ owner, job: next, error: null, checked: true, updatedAt: Date.now() });
      setLocalStart({ id: next.id, at: buttonPressedAt });
      return next;
    } catch (error) {
      if (currentOwner.current === owner && revision === generation.current) {
        startFailure.current = {
          owner,
          previousId: job?.id ?? null,
          message: error instanceof Error ? error.message : "Kunne ikke starte casen.",
        };
        setState((previous) => ({
          owner,
          job: previous.owner === owner ? previous.job : null,
          checked: false,
          updatedAt: previous.owner === owner ? previous.updatedAt : null,
          error: error instanceof Error ? error.message : "Kunne ikke starte casen.",
        }));
      }
      return null;
    } finally {
      if (currentOwner.current === owner && revision === generation.current) {
        submitting.current = false;
        setStarting(false);
        // The server may have accepted a request whose reply was lost.
        void refresh();
      }
    }
  };
  return {
    job,
    starting,
    submittedAt,
    startedAt:
      job && localStart && job.id === localStart.id
        ? localStart.at
        : job
          ? Date.parse(job.createdAt)
          : submittedAt,
    start,
    refresh,
    updatedAt: state.owner === owner ? state.updatedAt : null,
    checked: state.owner === owner && state.checked,
    error: state.owner === owner ? state.error : null,
  };
}
