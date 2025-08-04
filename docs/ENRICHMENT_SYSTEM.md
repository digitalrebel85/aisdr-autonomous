# Multi-Provider Lead Enrichment System

## Overview

The AISDR system now features a comprehensive lead enrichment system that leverages multiple data providers to gather detailed information about leads. The system is designed to be extensible and can easily accommodate new enrichment providers.

## Supported Providers

### 1. Apollo.io
- **API**: Person Enrichment API
- **Strengths**: Professional contact data, company information
- **Required**: `APOLLO_API_KEY`
- **Input**: Email or LinkedIn URL

### 2. PeopleDataLabs (PDL)
- **API**: Person Enrichment API  
- **Strengths**: Comprehensive professional profiles
- **Required**: `PDL_API_KEY`
- **Input**: Email or LinkedIn profile

### 3. Serper API
- **API**: Google Search API
- **Strengths**: Web search for public information
- **Required**: `SERPER_API_KEY`
- **Input**: Name, company, email for search queries

### 4. Clearbit
- **API**: Person API
- **Strengths**: B2B contact and company data
- **Required**: `CLEARBIT_API_KEY`
- **Input**: Email address

### 5. Hunter.io
- **API**: Email Finder API
- **Strengths**: Email discovery and verification
- **Required**: `HUNTER_API_KEY`
- **Input**: Company domain, first name, last name

## Architecture

```
Frontend (Next.js)
    ↓
Next.js API (/api/enrich-lead)
    ↓
Python CrewAI Service (/enrich-lead)
    ↓
Multi-Provider Enrichment Tool
    ↓
[Apollo] → [PDL] → [Clearbit] → [Serper] → [Hunter]
    ↓
Normalized Data Response
    ↓
Database Storage (Supabase)
```

## Provider Priority Order

The system attempts enrichment in the following order:

1. **Apollo** - Primary source for professional data
2. **PeopleDataLabs** - Fallback for comprehensive profiles
3. **Clearbit** - B2B focused enrichment
4. **Serper** - Web search for public information
5. **Hunter** - Email discovery and validation

The system stops at the first provider that returns useful data.

## Configuration

### User-Configurable API Keys

Unlike traditional systems that require environment variables, this enrichment system allows users to configure their own API keys through the Settings page. This provides:

- **User Control**: Each user manages their own API keys
- **Cost Control**: Users pay for their own API usage
- **Security**: API keys are stored encrypted per user
- **Flexibility**: Users can choose which providers to enable

### Environment Variables

```env
# Service Configuration (Required)
CREW_SERVICE_URL=http://localhost:8000

# API Keys are now user-configurable through Settings UI
# No longer required as environment variables:
# APOLLO_API_KEY=not_needed
# PDL_API_KEY=not_needed
# SERPER_API_KEY=not_needed
# CLEARBIT_API_KEY=not_needed
# HUNTER_API_KEY=not_needed
```

## Data Structure

### Input Data
```typescript
{
  leadId: number,
  email: string,
  companyDomain?: string,
  name?: string,
  company?: string,
  firstName?: string,
  lastName?: string,
  linkedinUrl?: string,
  // API keys are automatically fetched from user's settings
  // No longer passed in request
}
```

### Normalized Output
```json
{
  "name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "title": "VP of Sales",
  "company": "TechCorp Inc",
  "industry": "Software",
  "company_size": "51-200 employees",
  "location": "San Francisco, CA",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "phone": "+1-555-123-4567",
  "email": "john@techcorp.com",
  "source": "apollo",
  "primary_source": "apollo",
  "enrichment_timestamp": "2025-01-02T17:25:00Z",
  "input_data": {
    "email": "john@techcorp.com",
    "name": "John Doe",
    "company": "TechCorp"
  },
  "all_sources": {
    "apollo": { /* Apollo response */ },
    "pdl": { "error": "No data found" },
    "clearbit": { /* Not attempted */ }
  }
}
```

## Database Schema

### Enrichment Tracking Fields
```sql
-- Status tracking
enrichment_status: 'pending' | 'enriching' | 'completed' | 'failed'
enrichment_started_at: TIMESTAMPTZ
enrichment_completed_at: TIMESTAMPTZ
enrichment_error: TEXT

-- Enriched data storage
enriched_data: JSONB  -- Full response from providers

-- Extracted fields for easy querying
linkedin_url: TEXT
phone: TEXT
location: TEXT
industry: TEXT
company_size: TEXT
pain_points: TEXT[]  -- AI-generated from enriched data
```

## API Endpoints

### Next.js API
```typescript
POST /api/enrich-lead
{
  "leadId": 123,
  "email": "john@company.com",
  "companyDomain": "company.com",
  "name": "John Doe",
  "company": "Company Inc"
}
```

### Python CrewAI Service
```python
POST /enrich-lead
{
  "email": "john@company.com",
  "company_domain": "company.com",
  "lead_id": 123,
  "user_id": "uuid",
  "name": "John Doe",
  "company": "Company Inc",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "api_keys": {
    "apollo": "user_apollo_key",
    "pdl": "user_pdl_key",
    "serper": "user_serper_key",
    "clearbit": "user_clearbit_key",
    "hunter": "user_hunter_key"
  }
}
```

## Adding New Providers

To add a new enrichment provider:

### 1. Create Provider Tool
```python
@tool('New Provider Lookup')
def new_provider_lookup(email: str = None, **kwargs) -> dict:
    """Lookup person using New Provider API."""
    if not NEW_PROVIDER_API_KEY:
        return {"error": "API key not set", "provider": "new_provider"}
    
    # Implementation here
    try:
        response = requests.get(api_url, params=params)
        data = response.json()
        data['provider'] = 'new_provider'
        return data
    except Exception as e:
        return {"error": str(e), "provider": "new_provider"}
```

### 2. Add to Provider List
```python
providers = [
    ('apollo', lambda: apollo_person_lookup(email, linkedin_url)),
    ('pdl', lambda: pdl_person_lookup(email, linkedin_url)),
    ('new_provider', lambda: new_provider_lookup(email, name)),  # Add here
    # ... other providers
]
```

### 3. Add Normalization Logic
```python
def _normalize_provider_data(data: dict, provider: str) -> dict:
    # ... existing providers
    elif provider == 'new_provider':
        normalized.update({
            "name": data.get('full_name'),
            "email": data.get('email_address'),
            # ... map other fields
        })
```

### 4. Add Useful Data Check
```python
def _has_useful_data(data: dict, provider: str) -> bool:
    # ... existing providers
    elif provider == 'new_provider':
        return data.get('full_name') is not None
```

## Usage Examples

### Manual Enrichment
Users can click the "Enrich" button next to any lead in the leads table to trigger enrichment.

### Bulk Enrichment (Future)
```typescript
// Select multiple leads and enrich in batch
const enrichMultipleLeads = async (leadIds: number[]) => {
  for (const leadId of leadIds) {
    await enrichLead(leadId);
  }
};
```

### Automatic Enrichment (Future)
```typescript
// Auto-enrich on lead creation
const addLead = async (leadData) => {
  const lead = await createLead(leadData);
  await enrichLead(lead.id); // Auto-enrich
};
```

## AI Agent Integration

Enriched data is automatically available to AI agents:

```typescript
// AI agents can access enriched lead data
const { data: lead } = await supabase
  .from('leads')
  .select(`
    *, 
    enriched_data,
    pain_points,
    industry,
    company_size,
    linkedin_url,
    phone,
    location
  `)
  .eq('email', senderEmail)
  .single();

// Use enriched data for personalized responses
const context = `
Lead Profile:
- ${lead.name} (${lead.title} at ${lead.company})
- Industry: ${lead.industry}
- Company Size: ${lead.company_size}
- Pain Points: ${lead.pain_points?.join(', ')}
- LinkedIn: ${lead.linkedin_url}
`;
```

## Error Handling

The system includes comprehensive error handling:

- **API Timeouts**: 15-second timeout per provider
- **Rate Limiting**: Respects provider rate limits
- **Fallback Chain**: Tries multiple providers automatically
- **Graceful Degradation**: System works even if providers are down
- **Error Logging**: Detailed error tracking for debugging

## Monitoring & Analytics

Track enrichment performance:

```sql
-- Enrichment success rates by provider
SELECT 
  enriched_data->>'primary_source' as provider,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN enrichment_status = 'completed' THEN 1 END) as successful,
  ROUND(
    COUNT(CASE WHEN enrichment_status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate
FROM leads 
WHERE enrichment_status IN ('completed', 'failed')
GROUP BY enriched_data->>'primary_source';
```

## Best Practices

1. **API Key Management**: 
   - Users configure their own API keys through Settings UI
   - Keys are stored encrypted in the database with RLS policies
   - Each user controls their own provider access

2. **Rate Limiting**: 
   - Implement rate limiting to avoid hitting API limits
   - Users are responsible for their own API quotas
   - System respects provider rate limits automatically

3. **Data Privacy**: 
   - Ensure compliance with data protection regulations
   - User API keys are isolated per user account
   - Enriched data follows existing RLS policies

4. **Cost Management**: 
   - Users pay for their own API usage directly
   - Monitor API usage through provider dashboards
   - System provides clear feedback on enrichment success/failure

5. **Data Quality**: 
   - Validate enriched data before storage
   - Multi-provider fallback ensures data completeness
   - Source tracking for data provenance

6. **User Experience**:
   - Clear setup instructions and provider links in Settings
   - Visual feedback on API key status (saved/unsaved)
   - Graceful error handling when keys are missing

## Troubleshooting

### Common Issues

1. **No API Keys Configured**: 
   - Users see "No API keys configured" error
   - Direct users to Settings > Enrichment API Keys
   - At least one provider key must be configured

2. **Service Unavailable**: 
   - Check if Python CrewAI service is running
   - Verify CREW_SERVICE_URL environment variable
   - Check service logs for connection issues

3. **API Key Invalid**: 
   - Provider returns authentication errors
   - Users should verify keys in provider dashboards
   - Re-save keys in Settings if needed

4. **Rate Limits**: 
   - System automatically tries next provider
   - Users should monitor their API quotas
   - Consider upgrading provider plans if needed

5. **Data Quality**: 
   - System validates provider responses automatically
   - Multiple providers increase success rates
   - Check enriched_data field for detailed results

### Debug Mode
Enable verbose logging in the CrewAI agent:
```python
lead_enricher_agent = Agent(
    # ... other config
    verbose=True  # Enable detailed logging
)
```

This comprehensive multi-provider enrichment system ensures maximum data coverage while maintaining flexibility for future enhancements.
