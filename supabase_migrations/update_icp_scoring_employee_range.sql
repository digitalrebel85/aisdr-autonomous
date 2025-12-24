-- Update ICP scoring to use employee count range instead of bucket matching
-- This provides more flexible company size matching

-- Update the calculate_icp_score function to use employee_count_min/max
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

  -- Industry matching (25 points default)
  IF lead_data->>'industry' IS NOT NULL AND icp_criteria->'industries' IS NOT NULL THEN
    IF icp_criteria->'industries' @> to_jsonb(ARRAY[lead_data->>'industry']) THEN
      industry_score := (scoring_weights->>'industry')::INTEGER;
    END IF;
  END IF;

  -- Company size matching using employee count range (20 points default)
  -- First try to get employee count from enriched_data
  lead_employee_count := COALESCE(
    (lead_data->'enriched_data'->>'employee_count')::INTEGER,
    (lead_data->'enriched_data'->'company_profile'->>'employee_count')::INTEGER,
    NULL
  );
  
  -- If no enriched employee count, try to parse from company_size bucket
  IF lead_employee_count IS NULL AND lead_data->>'company_size' IS NOT NULL THEN
    -- Parse bucket format like "51-200" or "1001-5000" or "10001+"
    DECLARE
      size_text TEXT := lead_data->>'company_size';
      parts TEXT[];
    BEGIN
      IF size_text LIKE '%+' THEN
        -- Handle "10001+" format - use the number as minimum
        lead_employee_count := REPLACE(size_text, '+', '')::INTEGER;
      ELSIF size_text LIKE '%-%' THEN
        -- Handle "51-200" format - use midpoint
        parts := string_to_array(size_text, '-');
        IF array_length(parts, 1) = 2 THEN
          lead_employee_count := (parts[1]::INTEGER + parts[2]::INTEGER) / 2;
        END IF;
      END IF;
    END;
  END IF;
  
  -- Check if lead employee count falls within ICP range
  icp_employee_min := (icp_criteria->>'employee_count_min')::INTEGER;
  icp_employee_max := (icp_criteria->>'employee_count_max')::INTEGER;
  
  IF lead_employee_count IS NOT NULL THEN
    IF (icp_employee_min IS NULL OR lead_employee_count >= icp_employee_min) AND
       (icp_employee_max IS NULL OR lead_employee_count <= icp_employee_max) THEN
      company_size_score := (scoring_weights->>'company_size')::INTEGER;
    END IF;
  END IF;

  -- Job title matching (20 points default)
  IF lead_data->>'title' IS NOT NULL AND icp_criteria->'job_titles' IS NOT NULL THEN
    -- Check if any ICP job title is contained in the lead's title (case-insensitive)
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(icp_criteria->'job_titles') AS icp_title
      WHERE LOWER(lead_data->>'title') LIKE '%' || LOWER(icp_title) || '%'
    ) THEN
      job_title_score := (scoring_weights->>'job_title')::INTEGER;
    END IF;
  END IF;

  -- Geography matching (15 points default)
  IF lead_data->>'location' IS NOT NULL AND icp_criteria->'locations' IS NOT NULL THEN
    -- Check if any ICP location is contained in the lead's location
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(icp_criteria->'locations') AS icp_location
      WHERE LOWER(lead_data->>'location') LIKE '%' || LOWER(icp_location) || '%'
    ) THEN
      geography_score := (scoring_weights->>'geography')::INTEGER;
    END IF;
  END IF;

  -- Technology matching (10 points default)
  IF lead_data->'enriched_data'->'company_profile'->'techStack' IS NOT NULL 
     AND icp_criteria->'technologies' IS NOT NULL THEN
    -- Check if any ICP technology matches the lead's tech stack
    IF EXISTS (
      SELECT 1 
      FROM jsonb_array_elements_text(icp_criteria->'technologies') AS icp_tech
      WHERE lead_data->'enriched_data'->'company_profile'->'techStack' @> to_jsonb(ARRAY[icp_tech])
    ) THEN
      technology_score := (scoring_weights->>'technology')::INTEGER;
    END IF;
  END IF;

  -- Revenue matching (10 points default)
  -- This is a range check if revenue data is available in enriched_data
  IF lead_data->'enriched_data'->>'revenue' IS NOT NULL 
     AND icp_criteria->>'revenue_min' IS NOT NULL 
     AND icp_criteria->>'revenue_max' IS NOT NULL THEN
    DECLARE
      lead_revenue BIGINT := (lead_data->'enriched_data'->>'revenue')::BIGINT;
      min_revenue BIGINT := (icp_criteria->>'revenue_min')::BIGINT;
      max_revenue BIGINT := (icp_criteria->>'revenue_max')::BIGINT;
    BEGIN
      IF lead_revenue >= min_revenue AND lead_revenue <= max_revenue THEN
        revenue_score := (scoring_weights->>'revenue')::INTEGER;
      END IF;
    END;
  END IF;

  -- Calculate total score
  score := industry_score + company_size_score + job_title_score + 
           geography_score + technology_score + revenue_score;

  -- Build match details
  match_details := jsonb_build_object(
    'total_score', score,
    'breakdown', jsonb_build_object(
      'industry', jsonb_build_object('score', industry_score, 'max', (scoring_weights->>'industry')::INTEGER),
      'company_size', jsonb_build_object('score', company_size_score, 'max', (scoring_weights->>'company_size')::INTEGER, 'employee_count', lead_employee_count),
      'job_title', jsonb_build_object('score', job_title_score, 'max', (scoring_weights->>'job_title')::INTEGER),
      'geography', jsonb_build_object('score', geography_score, 'max', (scoring_weights->>'geography')::INTEGER),
      'technology', jsonb_build_object('score', technology_score, 'max', (scoring_weights->>'technology')::INTEGER),
      'revenue', jsonb_build_object('score', revenue_score, 'max', (scoring_weights->>'revenue')::INTEGER)
    ),
    'scored_at', now()
  );

  RETURN match_details;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the score_leads_with_icp function to pass employee_count_min/max
CREATE OR REPLACE FUNCTION score_leads_with_icp(icp_profile_id_param BIGINT, user_id_param UUID)
RETURNS TABLE (
  lead_id BIGINT,
  score INTEGER,
  match_details JSONB
) AS $$
DECLARE
  icp_record RECORD;
  icp_criteria JSONB;
  scoring_weights JSONB;
BEGIN
  -- Get the ICP profile
  SELECT * INTO icp_record
  FROM public.icp_profiles
  WHERE id = icp_profile_id_param AND user_id = user_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ICP profile not found or access denied';
  END IF;

  -- Build ICP criteria object with employee count range
  icp_criteria := jsonb_build_object(
    'industries', icp_record.industries,
    'company_sizes', icp_record.company_sizes,
    'locations', icp_record.locations,
    'job_titles', icp_record.job_titles,
    'technologies', icp_record.technologies,
    'revenue_min', icp_record.revenue_min,
    'revenue_max', icp_record.revenue_max,
    'employee_count_min', icp_record.employee_count_min,
    'employee_count_max', icp_record.employee_count_max
  );

  scoring_weights := icp_record.scoring_weights;

  -- Score all leads for this user
  RETURN QUERY
  SELECT 
    l.id,
    (calculate_icp_score(
      jsonb_build_object(
        'industry', l.industry,
        'company_size', l.company_size,
        'title', l.title,
        'location', l.location,
        'enriched_data', l.enriched_data
      ),
      icp_criteria,
      scoring_weights
    )->>'total_score')::INTEGER AS score,
    calculate_icp_score(
      jsonb_build_object(
        'industry', l.industry,
        'company_size', l.company_size,
        'title', l.title,
        'location', l.location,
        'enriched_data', l.enriched_data
      ),
      icp_criteria,
      scoring_weights
    ) AS match_details
  FROM public.leads l
  WHERE l.user_id = user_id_param;

  -- Update ICP profile usage stats
  UPDATE public.icp_profiles
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = icp_profile_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_icp_score TO authenticated;
GRANT EXECUTE ON FUNCTION score_leads_with_icp TO authenticated;
