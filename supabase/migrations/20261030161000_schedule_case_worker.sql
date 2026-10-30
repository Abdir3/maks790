BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Set Vault case_worker_url and case_worker_secret during deployment. The latter
-- must match CASE_WORKER_SECRET in Edge secrets. Never put either into clients.
CREATE FUNCTION public.dispatch_case_worker()
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  worker_url text;
  worker_secret text;
  request_id bigint;
BEGIN
  -- Expire abandoned work even if the Edge worker is temporarily unavailable.
  UPDATE public.case_ai_jobs
  SET status = 'failed', error = 'Oppgaven er utløpt. Prøv igjen.',
      context = '{}'::jsonb, steps = '[]'::jsonb,
      lease_token = NULL, lease_until = NULL
  WHERE status = 'pending' AND expires_at <= now();
  IF NOT EXISTS (
    SELECT 1 FROM public.case_ai_jobs
    WHERE status = 'pending' AND next_attempt_at <= now()
      AND (lease_until IS NULL OR lease_until < now())
  ) THEN RETURN NULL; END IF;

  SELECT decrypted_secret INTO worker_url FROM vault.decrypted_secrets
    WHERE name = 'case_worker_url';
  SELECT decrypted_secret INTO worker_secret FROM vault.decrypted_secrets
    WHERE name = 'case_worker_secret';
  -- Missing configuration during rollout must not break job insertion.
  IF worker_url IS NULL OR worker_secret IS NULL OR length(worker_secret) < 32
    THEN RETURN NULL; END IF;
  SELECT net.http_post(
    url := worker_url,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                 'x-case-worker-secret', worker_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) INTO request_id;
  RETURN request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_case_worker() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_case_worker() TO service_role;

-- pg_net sends only after the insert transaction commits. This removes the first
-- cron interval from the common path; cron independently recovers interrupted work.
CREATE FUNCTION public.wake_case_worker()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.dispatch_case_worker();
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.wake_case_worker() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER case_ai_jobs_wake_worker AFTER INSERT ON public.case_ai_jobs
  FOR EACH STATEMENT EXECUTE FUNCTION public.wake_case_worker();

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'case-ai-worker';
SELECT cron.schedule('case-ai-worker', '5 seconds', 'SELECT public.dispatch_case_worker()');

COMMIT;
