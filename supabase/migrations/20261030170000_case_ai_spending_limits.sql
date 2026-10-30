BEGIN;

-- Conservative reservations are retained even after a failed request or deleted
-- account/case. A deletion must never restore a spending allowance. No prompts,
-- answers, provider IDs, credentials, or identifying profile data belong here.
CREATE TABLE public.case_ai_spend_reservations (
  job_id uuid NOT NULL,
  step integer NOT NULL CHECK (step BETWEEN 0 AND 5),
  user_id uuid NOT NULL,
  request_hash text NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  maximum_cost_usd numeric(12,6) NOT NULL CHECK (maximum_cost_usd > 0 AND maximum_cost_usd <= 0.50),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (job_id, step)
);
CREATE INDEX case_ai_spend_created ON public.case_ai_spend_reservations(created_at);
CREATE INDEX case_ai_spend_owner_created ON public.case_ai_spend_reservations(user_id, created_at);
ALTER TABLE public.case_ai_spend_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.case_ai_spend_reservations FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.case_ai_spend_reservations TO service_role;

CREATE FUNCTION public.reserve_case_ai_spend(
  p_job_id uuid,
  p_user_id uuid,
  p_lease uuid,
  p_step integer,
  p_request_hash text,
  p_maximum_cost_usd numeric,
  p_job_limit numeric DEFAULT 0.50,
  p_owner_limit numeric DEFAULT 1.00,
  p_project_limit numeric DEFAULT 2.00
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  current_job public.case_ai_jobs%ROWTYPE;
  existing public.case_ai_spend_reservations%ROWTYPE;
  reserved numeric;
  cutoff timestamptz := clock_timestamp() - interval '24 hours';
BEGIN
  -- A single transaction lock serialises allowance checks across every owner,
  -- worker and job. No client identity, deletion or overlapping worker can race
  -- the project-wide allowance. Server overrides can only lower fixed maxima.
  PERFORM pg_catalog.pg_advisory_xact_lock(790301700);
  IF p_step IS NULL OR p_step < 0 OR p_step > 5 OR
     p_request_hash IS NULL OR p_request_hash !~ '^[a-f0-9]{64}$' OR
     p_maximum_cost_usd IS NULL OR p_maximum_cost_usd <= 0 OR
     p_maximum_cost_usd::text IN ('NaN','Infinity','-Infinity') OR
     p_job_limit IS NULL OR p_owner_limit IS NULL OR p_project_limit IS NULL OR
     p_job_limit::text IN ('NaN','Infinity','-Infinity') OR
     p_owner_limit::text IN ('NaN','Infinity','-Infinity') OR
     p_project_limit::text IN ('NaN','Infinity','-Infinity')
  THEN RETURN jsonb_build_object('allowed', false, 'reason', 'invalid-reservation'); END IF;
  p_job_limit := greatest(0, least(0.50, p_job_limit));
  p_owner_limit := greatest(0, least(1.00, p_owner_limit));
  p_project_limit := greatest(0, least(2.00, p_project_limit));
  reserved := ceil(p_maximum_cost_usd * 1000000) / 1000000;

  SELECT * INTO current_job FROM public.case_ai_jobs
    WHERE id = p_job_id AND user_id = p_user_id AND status = 'pending'
      AND lease_token = p_lease AND lease_until > clock_timestamp()
      AND expires_at > clock_timestamp()
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid-job');
  END IF;
  IF (current_job.kind = 'generate' AND p_step >= 2) OR p_step >= 4 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'attempt-limit');
  END IF;

  SELECT * INTO existing FROM public.case_ai_spend_reservations
    WHERE job_id = p_job_id AND step = p_step;
  IF FOUND THEN
    IF existing.user_id <> p_user_id OR existing.request_hash <> p_request_hash OR
       existing.maximum_cost_usd <> reserved THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'reservation-mismatch');
    END IF;
    RETURN jsonb_build_object('allowed', true, 'reservedUsd', existing.maximum_cost_usd);
  END IF;

  IF reserved + (SELECT coalesce(sum(maximum_cost_usd),0)
      FROM public.case_ai_spend_reservations WHERE job_id = p_job_id) > p_job_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'job-limit');
  END IF;
  IF reserved + (SELECT coalesce(sum(maximum_cost_usd),0)
      FROM public.case_ai_spend_reservations WHERE user_id = p_user_id AND created_at > cutoff) > p_owner_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'owner-limit');
  END IF;
  IF reserved + (SELECT coalesce(sum(maximum_cost_usd),0)
      FROM public.case_ai_spend_reservations WHERE created_at > cutoff) > p_project_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'project-limit');
  END IF;
  INSERT INTO public.case_ai_spend_reservations(job_id,step,user_id,request_hash,maximum_cost_usd)
    VALUES (p_job_id,p_step,p_user_id,p_request_hash,reserved);
  RETURN jsonb_build_object('allowed', true, 'reservedUsd', reserved);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_case_ai_spend(uuid,uuid,uuid,integer,text,numeric,numeric,numeric,numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_case_ai_spend(uuid,uuid,uuid,integer,text,numeric,numeric,numeric,numeric)
  TO service_role;

COMMIT;
