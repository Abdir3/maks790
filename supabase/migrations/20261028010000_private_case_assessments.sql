BEGIN;

-- Keep the archived rows and the following public cleanup on one stable set.
-- The old application must not insert a case between those two statements.
-- Fail promptly if the coordinated cutover cannot obtain the lock.
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.generated_cases IN ACCESS EXCLUSIVE MODE;

-- The learner can read the case, but the answer basis and diagnostic history
-- are only accessible to the authenticated application server.
CREATE TABLE public.case_assessments (
  case_id UUID PRIMARY KEY REFERENCES public.generated_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version IN (2, 3)),
  definition JSONB NOT NULL,
  assessment JSONB,
  semantic JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT current_case_requires_assessment
    CHECK (version <> 3 OR (assessment IS NOT NULL AND jsonb_typeof(assessment) = 'object'))
);
CREATE INDEX case_assessments_user_created_idx
  ON public.case_assessments (user_id, created_at DESC);
ALTER TABLE public.case_assessments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.case_assessments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_assessments TO service_role;

-- Preserve old cases and local-draft IDs. The old assessment is archived, not
-- upgraded or used to pretend that an old case passed the new clinical checks.
INSERT INTO public.case_assessments
  (case_id, user_id, version, definition, legacy_payload, created_at)
SELECT id, user_id, 2, definition - '_assessment',
  jsonb_build_object(
    'assessment', definition -> '_assessment',
    'diagnosisFamily', diagnosis_family,
    'engine', engine,
    'presentation', presentation,
    'patientProfile', patient_profile
  ), created_at
FROM public.generated_cases;

UPDATE public.generated_cases
SET definition = definition - '_assessment',
    diagnosis_family = NULL,
    engine = 'legacy',
    presentation = 'legacy',
    patient_profile = '';

ALTER TABLE public.generated_cases ADD CONSTRAINT generated_cases_no_private_basis
  CHECK (diagnosis_family IS NULL AND NOT (definition ? '_assessment'));

-- Public case writes now go through one atomic server-only operation.
-- Authenticated learners retain ownership-scoped read/delete access.
REVOKE INSERT, UPDATE ON public.generated_cases FROM authenticated;

CREATE FUNCTION public.create_case_with_assessment(
  p_id UUID,
  p_user_id UUID,
  p_format TEXT,
  p_definition JSONB,
  p_assessment JSONB,
  p_semantic JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_format NOT IN ('long', 'quick')
     OR p_definition ->> 'id' IS DISTINCT FROM 'gen-' || p_id::text
     OR p_definition #>> '{practice,version}' IS DISTINCT FROM '3'
     OR jsonb_typeof(p_assessment) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_semantic) IS DISTINCT FROM 'object'
     OR p_definition ? '_assessment'
     OR p_definition ? 'dossier'
     OR p_definition ? 'diagnosisFamily'
     OR p_definition ? 'rubric'
  THEN
    RAISE EXCEPTION 'Invalid case creation payload';
  END IF;

  INSERT INTO public.generated_cases
    (id, user_id, format, title, definition, engine, presentation,
     diagnosis_family, setting, patient_profile)
  VALUES
    (p_id, p_user_id, p_format, p_definition ->> 'title', p_definition,
     'curriculum-v3', 'case', NULL, '', '');

  INSERT INTO public.case_assessments
    (case_id, user_id, version, definition, assessment, semantic)
  VALUES (p_id, p_user_id, 3, p_definition, p_assessment, p_semantic);
END;
$$;

REVOKE ALL ON FUNCTION public.create_case_with_assessment(UUID, UUID, TEXT, JSONB, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_case_with_assessment(UUID, UUID, TEXT, JSONB, JSONB, JSONB)
  TO service_role;

COMMIT;
