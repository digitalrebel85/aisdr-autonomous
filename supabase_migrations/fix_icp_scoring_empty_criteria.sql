-- Fix ICP scoring: empty/unconfigured criteria should give full points, not zero
-- When a user doesn't specify company_sizes, locations, technologies, or revenue,
-- those categories should not penalize the lead score.

CREATE OR REPLACE FUNCTION calculate_icp_score(
  lead_data JSONB,
  icp_criteria JSONB,
  weights JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  score INTEGER := 0;
  max_score INTEGER := 100;
  industry_score INTEGER := 0;
  company_size_score INTEGER := 0;
  job_title_score INTEGER := 0;
  geography_score INTEGER := 0;
  technology_score INTEGER := 0;
  revenue_score INTEGER := 0;
  scoring_weights JSONB;
  match_details JSONB;
  lead_employee_count INTEGER;
  icp_employee_min INTEGER;
  icp_employee_max INTEGER;
  
  -- Track which criteria are actually configured
  has_industry_criteria BOOLEAN := FALSE;
  has_company_size_criteria BOOLEAN := FALSE;
  has_job_title_criteria BOOLEAN := FALSE;
  has_geography_criteria BOOLEAN := FALSE;
  has_technology_criteria BOOLEAN := FALSE;
  has_revenue_criteria BOOLEAN := FALSE;
  
  -- For weighted redistribution
  configured_weight_total INTEGER := 0;
  weight_multiplier NUMERIC := 1.0;
BEGIN
  -- Use provided weights or defaults
  scoring_weights := COALESCE(weights, '{
    "industry": 25,
    "company_size": 20,
    "job_title": 20,
    "geography": 15,
    "technology": 10,
    "revenue": 10
  }'::jsonb);

  -- Determine which criteria are actually configured (non-empty)
  has_industry_criteria := (
    icp_criteria->'industries' IS NOT NULL 
    AND icp_criteria->'industries' != '[]'::jsonb 
    AND jsonb_array_length(icp_criteria->'industries') > 0
  );
  
  has_job_title_criteria := (
    icp_criteria->'job_titles' IS NOT NULL 
    AND icp_criteria->'job_titles' != '[]'::jsonb 
    AND jsonb_array_length(icp_criteria->'job_titles') > 0
  );
  
  has_geography_criteria := (
    icp_criteria->'locations' IS NOT NULL 
    AND icp_criteria->'locations' != '[]'::jsonb 
    AND jsonb_array_length(icp_criteria->'locations') > 0
  );
  
  has_technology_criteria := (
    icp_criteria->'technologies' IS NOT NULL 
    AND icp_criteria->'technologies' != '[]'::jsonb 
    AND jsonb_array_length(icp_criteria->'technologies') > 0
  );
  
  has_company_size_criteria := (
    (icp_criteria->>'employee_count_min') IS NOT NULL 
    OR (icp_criteria->>'employee_count_max') IS NOT NULL
    OR (icp_criteria->'company_sizes' IS NOT NULL 
        AND icp_criteria->'company_sizes' != '[]'::jsonb 
        AND jsonb_array_length(icp_criteria->'company_sizes') > 0)
  );
  
  has_revenue_criteria := (
    (icp_criteria->>'revenue_min') IS NOT NULL 
    OR (icp_criteria->>'revenue_max') IS NOT NULL
  );

  -- Calculate total weight of configured criteria only
  IF has_industry_criteria THEN
    configured_weight_total := configured_weight_total + (scoring_weights->>'industry')::INTEGER;
  END IF;
  IF has_company_size_criteria THEN
    configured_weight_total := configured_weight_total + (scoring_weights->>'company_size')::INTEGER;
  END IF;
  IF has_job_title_criteria THEN
    configured_weight_total := configured_weight_total + (scoring_weights->>'job_title')::INTEGER;
  END IF;
  IF has_geography_criteria THEN
    configured_weight_total := configured_weight_total + (scoring_weights->>'geography')::INTEGER;
  END IF;
  IF has_technology_criteria THEN
    configured_weight_total := configured_weight_total + (scoring_weights->>'technology')::INTEGER;
  END IF;
  IF has_revenue_criteria THEN
    configured_weight_total := configured_weight_total + (scoring_weights->>'revenue')::INTEGER;
  END IF;

  -- If no criteria configured at all, return 50 as neutral score
  IF configured_weight_total = 0 THEN
    RETURN jsonb_build_object(
      'total_score', 50,
      'breakdown', jsonb_build_object(
        'industry', jsonb_build_object('score', 0, 'max', 0, 'skipped', true),
        'company_size', jsonb_build_object('score', 0, 'max', 0, 'skipped', true),
        'job_title', jsonb_build_object('score', 0, 'max', 0, 'skipped', true),
        'geography', jsonb_build_object('score', 0, 'max', 0, 'skipped', true),
        'technology', jsonb_build_object('score', 0, 'max', 0, 'skipped', true),
        'revenue', jsonb_build_object('score', 0, 'max', 0, 'skipped', true)
      ),
      'note', 'No ICP criteria configured',
      'scored_at', now()
    );
  END IF;

  -- Calculate multiplier to scale configured criteria scores to 100
  -- e.g. if only industry(25) + job_title(20) = 45 configured, multiplier = 100/45 = 2.22
  weight_multiplier := 100.0 / configured_weight_total;

  -- Industry matching
  IF has_industry_criteria THEN
    IF lead_data->>'industry' IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(icp_criteria->'industries') AS icp_ind
        WHERE LOWER(lead_data->>'industry') LIKE '%' || LOWER(icp_ind) || '%'
           OR LOWER(icp_ind) LIKE '%' || LOWER(lead_data->>'industry') || '%'
      ) THEN
        industry_score := ROUND((scoring_weights->>'industry')::INTEGER * weight_multiplier)::INTEGER;
      END IF;
    END IF;
  END IF;

  -- Company size matching using employee count range
  IF has_company_size_criteria THEN
    -- First try to get employee count from enriched_data
    lead_employee_count := COALESCE(
      (lead_data->'enriched_data'->>'employee_count')::INTEGER,
      (lead_data->'enriched_data'->'company_profile'->>'employee_count')::INTEGER,
      NULL
    );
    
    -- If no enriched employee count, try to parse from company_size bucket
    IF lead_employee_count IS NULL AND lead_data->>'company_size' IS NOT NULL THEN
      DECLARE
        size_text TEXT := lead_data->>'company_size';
        parts TEXT[];
      BEGIN
        IF size_text LIKE '%+' THEN
          lead_employee_count := REPLACE(size_text, '+', '')::INTEGER;
        ELSIF size_text LIKE '%-%' THEN
          parts := string_to_array(size_text, '-');
          IF array_length(parts, 1) = 2 THEN
            lead_employee_count := (parts[1]::INTEGER + parts[2]::INTEGER) / 2;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        lead_employee_count := NULL;
      END;
    END IF;
    
    -- Check if lead employee count falls within ICP range
    icp_employee_min := (icp_criteria->>'employee_count_min')::INTEGER;
    icp_employee_max := (icp_criteria->>'employee_count_max')::INTEGER;
    
    IF lead_employee_count IS NOT NULL THEN
      IF (icp_employee_min IS NULL OR lead_employee_count >= icp_employee_min) AND
         (icp_employee_max IS NULL OR lead_employee_count <= icp_employee_max) THEN
        company_size_score := ROUND((scoring_weights->>'company_size')::INTEGER * weight_multiplier)::INTEGER;
      END IF;
    END IF;
  END IF;

  -- Job title matching (fuzzy, case-insensitive)
  IF has_job_title_criteria THEN
    IF lead_data->>'title' IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(icp_criteria->'job_titles') AS icp_title
        WHERE LOWER(lead_data->>'title') LIKE '%' || LOWER(icp_title) || '%'
           OR LOWER(icp_title) LIKE '%' || LOWER(lead_data->>'title') || '%'
      ) THEN
        job_title_score := ROUND((scoring_weights->>'job_title')::INTEGER * weight_multiplier)::INTEGER;
      END IF;
    END IF;
  END IF;

  -- Geography matching
  IF has_geography_criteria THEN
    IF lead_data->>'location' IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(icp_criteria->'locations') AS icp_location
        WHERE LOWER(lead_data->>'location') LIKE '%' || LOWER(icp_location) || '%'
           OR LOWER(icp_location) LIKE '%' || LOWER(lead_data->>'location') || '%'
      ) THEN
        geography_score := ROUND((scoring_weights->>'geography')::INTEGER * weight_multiplier)::INTEGER;
      END IF;
    END IF;
  END IF;

  -- Technology matching
  IF has_technology_criteria THEN
    IF lead_data->'enriched_data'->'company_profile'->'techStack' IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(icp_criteria->'technologies') AS icp_tech
        WHERE lead_data->'enriched_data'->'company_profile'->'techStack' @> to_jsonb(ARRAY[icp_tech])
      ) THEN
        technology_score := ROUND((scoring_weights->>'technology')::INTEGER * weight_multiplier)::INTEGER;
      END IF;
    END IF;
  END IF;

  -- Revenue matching
  IF has_revenue_criteria THEN
    IF lead_data->'enriched_data'->>'revenue' IS NOT NULL THEN
      DECLARE
        lead_revenue BIGINT := (lead_data->'enriched_data'->>'revenue')::BIGINT;
        min_revenue BIGINT := (icp_criteria->>'revenue_min')::BIGINT;
        max_revenue BIGINT := (icp_criteria->>'revenue_max')::BIGINT;
      BEGIN
        IF (min_revenue IS NULL OR lead_revenue >= min_revenue) AND
           (max_revenue IS NULL OR lead_revenue <= max_revenue) THEN
          revenue_score := ROUND((scoring_weights->>'revenue')::INTEGER * weight_multiplier)::INTEGER;
        END IF;
      END;
    END IF;
  END IF;

  -- Calculate total score (capped at 100)
  score := LEAST(100, industry_score + company_size_score + job_title_score + 
           geography_score + technology_score + revenue_score);

  -- Build match details
  match_details := jsonb_build_object(
    'total_score', score,
    'breakdown', jsonb_build_object(
      'industry', jsonb_build_object(
        'score', industry_score, 
        'max', CASE WHEN has_industry_criteria THEN ROUND((scoring_weights->>'industry')::INTEGER * weight_multiplier)::INTEGER ELSE 0 END,
        'skipped', NOT has_industry_criteria
      ),
      'company_size', jsonb_build_object(
        'score', company_size_score, 
        'max', CASE WHEN has_company_size_criteria THEN ROUND((scoring_weights->>'company_size')::INTEGER * weight_multiplier)::INTEGER ELSE 0 END,
        'employee_count', lead_employee_count,
        'skipped', NOT has_company_size_criteria
      ),
      'job_title', jsonb_build_object(
        'score', job_title_score, 
        'max', CASE WHEN has_job_title_criteria THEN ROUND((scoring_weights->>'job_title')::INTEGER * weight_multiplier)::INTEGER ELSE 0 END,
        'skipped', NOT has_job_title_criteria
      ),
      'geography', jsonb_build_object(
        'score', geography_score, 
        'max', CASE WHEN has_geography_criteria THEN ROUND((scoring_weights->>'geography')::INTEGER * weight_multiplier)::INTEGER ELSE 0 END,
        'skipped', NOT has_geography_criteria
      ),
      'technology', jsonb_build_object(
        'score', technology_score, 
        'max', CASE WHEN has_technology_criteria THEN ROUND((scoring_weights->>'technology')::INTEGER * weight_multiplier)::INTEGER ELSE 0 END,
        'skipped', NOT has_technology_criteria
      ),
      'revenue', jsonb_build_object(
        'score', revenue_score, 
        'max', CASE WHEN has_revenue_criteria THEN ROUND((scoring_weights->>'revenue')::INTEGER * weight_multiplier)::INTEGER ELSE 0 END,
        'skipped', NOT has_revenue_criteria
      )
    ),
    'configured_criteria', jsonb_build_object(
      'industry', has_industry_criteria,
      'company_size', has_company_size_criteria,
      'job_title', has_job_title_criteria,
      'geography', has_geography_criteria,
      'technology', has_technology_criteria,
      'revenue', has_revenue_criteria
    ),
    'weight_multiplier', weight_multiplier,
    'scored_at', now()
  );

  RETURN match_details;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION calculate_icp_score TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_icp_score TO service_role;
