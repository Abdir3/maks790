import { useCallback, useEffect, useRef, useState } from "react";
import {
  blankDraft,
  draftKey,
  parseDraft,
  type CaseDefinition,
  type CaseDraft,
} from "@/lib/case-model";

export function useCaseDraft(definition: CaseDefinition) {
  const [draft, setDraft] = useState(() => blankDraft(definition));
  const current = useRef(draft);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const writable = useRef(true);

  useEffect(() => {
    let restored = blankDraft(definition);
    try {
      restored = parseDraft(localStorage.getItem(draftKey(definition.id)), definition);
    } catch {
      // Do not silently overwrite an unreadable saved answer.
      writable.current = false;
      setRecoveryError(true);
    }
    current.current = restored;
    setDraft(restored);
    setReady(true);
  }, [definition]);

  const update = useCallback(
    (change: (value: CaseDraft) => CaseDraft) => {
      const next = change(current.current);
      current.current = next;
      setDraft(next);
      if (!writable.current) {
        setStorageError(true);
        return;
      }
      try {
        localStorage.setItem(draftKey(definition.id), JSON.stringify(next));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    },
    [definition.id],
  );

  const reset = useCallback(() => {
    writable.current = true;
    setRecoveryError(false);
    update(() => blankDraft(definition));
  }, [definition, update]);

  useEffect(() => {
    if (!storageError && !recoveryError) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [storageError, recoveryError]);

  return {
    draft,
    ready,
    update,
    reset,
    storageError: storageError || recoveryError,
    recoveryError,
  };
}
