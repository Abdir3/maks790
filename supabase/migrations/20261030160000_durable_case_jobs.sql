BEGIN;

-- Scheduling metadata and public choices are separate from private checkpoints,
-- which are erased after completion. No browser access or JWT storage is added.
ALTER TABLE public.case_ai_jobs
  ADD COLUMN generation_options jsonb,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN metrics jsonb,
  ADD COLUMN needs_next_request boolean NOT NULL DEFAULT false,
  ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3);
UPDATE public.case_ai_jobs
SET generation_options = context -> 'action' -> 'data'
WHERE kind = 'generate' AND context -> 'action' ->> 'action' = 'generate';
CREATE INDEX case_ai_jobs_ready ON public.case_ai_jobs(next_attempt_at)
  WHERE status = 'pending';

-- The lease outlives one bounded provider call and database checkpoints. A
-- crashed worker can be recovered; overlapping cron calls cannot buy duplicates.
CREATE OR REPLACE FUNCTION public.claim_case_ai_job(p_id uuid, p_user_id uuid, p_lease uuid)
RETURNS SETOF public.case_ai_jobs
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  UPDATE public.case_ai_jobs
  SET lease_token = p_lease, lease_until = now() + interval '120 seconds'
  WHERE id = p_id AND user_id = p_user_id AND status = 'pending'
    AND expires_at > now() AND next_attempt_at <= now()
    AND (lease_until IS NULL OR lease_until < now())
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_case_ai_job(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_case_ai_job(uuid, uuid, uuid) TO service_role;

COMMIT;
