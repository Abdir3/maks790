BEGIN;

-- Private checkpoints let short Edge Function calls resume long Astra workflows.
-- Neither prompts, answer keys nor provider response IDs are readable by clients.
CREATE TABLE public.case_ai_jobs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('generate', 'assess', 'model')),
  case_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  request_hash text NOT NULL,
  context jsonb NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  result jsonb,
  error text,
  lease_token uuid,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '25 minutes'
);
CREATE UNIQUE INDEX case_ai_jobs_one_active_user ON public.case_ai_jobs(user_id)
  WHERE status = 'pending';
CREATE INDEX case_ai_jobs_user_created ON public.case_ai_jobs(user_id, created_at DESC);
ALTER TABLE public.case_ai_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.case_ai_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_ai_jobs TO service_role;

CREATE FUNCTION public.claim_case_ai_job(p_id uuid, p_user_id uuid, p_lease uuid)
RETURNS SETOF public.case_ai_jobs
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  UPDATE public.case_ai_jobs
  SET lease_token = p_lease, lease_until = now() + interval '120 seconds'
  WHERE id = p_id AND user_id = p_user_id AND status = 'pending'
    AND expires_at > now() AND (lease_until IS NULL OR lease_until < now())
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_case_ai_job(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_case_ai_job(uuid, uuid, uuid) TO service_role;

COMMIT;
