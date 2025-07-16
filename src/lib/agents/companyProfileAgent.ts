// --- Type Definitions ---
export type CompanyProfileAgentInput = {
  companyDomain: string;
};

export type CompanyProfileAgentOutput = {
  companyName: string | null;
  industry: string | null;
  companySize: string | null; // e.g. "201-500"
  description: string | null; // short company blurb
  fundingStage: string | null; // Series A, Bootstrapped, etc.
  technographics: string[]; // technologies array (empty if none)
};

// A subset of the raw response from Apollo's Enrichment API
type ApolloCompanyResponse = {
  name: string | null;
  domain: string;
  industry: string | null;
  linkedin_url: string | null;
  employee_count: number | null;
  short_description: string | null;
  funding_stage: string | null;
  technologies: string[] | null;
};

// --- Helper Functions ---

/**
 * Parses an employee count number into a human-readable size bucket.
 * @param count The number of employees.
 * @returns A string representing the size bucket (e.g., "11-50").
 */
function getCompanySizeBucket(count: number | null | undefined): string | null {
  if (count === null || typeof count === 'undefined') return null;
  if (count <= 10) return '1-10';
  if (count <= 50) return '11-50';
  if (count <= 200) return '51-200';
  if (count <= 500) return '201-500';
  if (count <= 1000) return '501-1000';
  if (count <= 5000) return '1001-5000';
  if (count <= 10000) return '5001-10000';
  return '10001+';
}

/**
 * Builds the request configuration for the Apollo Enrichment API.
 * @param domain The company domain to enrich.
 * @returns A RequestInit object for the fetch call.
 */
export function buildApolloRequest(domain: string): RequestInit {
  if (!process.env.APOLLO_API_KEY) {
    throw new Error('APOLLO_API_KEY environment variable is not set.');
  }
  const url = `https://api.apollo.io/v1/companies/enrich?domain=${domain}&api_key=${process.env.APOLLO_API_KEY}`;
  return {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  };
}

const mockProfile: CompanyProfileAgentOutput = {
  companyName: 'SolarEdge (Mock)',
  industry: 'Renewables & Environment',
  companySize: '1001-5000',
  description: 'SolarEdge provides smart energy solutions that power our lives and drive future progress.',
  fundingStage: 'Public',
  technographics: ['Salesforce', 'HubSpot', 'AWS', 'Google Analytics'],
};

// --- Main Agent Function ---

/**
 * Fetches a company's profile using Apollo's Enrichment API.
 * @param input An object containing the companyDomain to look up.
 * @returns A promise that resolves to the company's profile.
 */
export async function runCompanyProfileAgent(
  input: CompanyProfileAgentInput
): Promise<CompanyProfileAgentOutput> {
  if (process.env.MOCK === 'true') {
    console.log('--- Using Mock Company Profile ---');
    return mockProfile;
  }

  const { companyDomain } = input;
  const requestConfig = buildApolloRequest(companyDomain);
  const url = `https://api.apollo.io/v1/companies/enrich?domain=${companyDomain}&api_key=${process.env.APOLLO_API_KEY}`;

  try {
    const response = await fetch(url, requestConfig);
    if (!response.ok) {
      throw new Error(`Apollo API request failed with status ${response.status}`);
    }
    const data = await response.json();

    // The actual company data is nested in the 'company' property
    const company: ApolloCompanyResponse = data.company;

    if (!company) {
      throw new Error('No company data found in Apollo response.');
    }

    return {
      companyName: company.name,
      industry: company.industry,
      companySize: getCompanySizeBucket(company.employee_count),
      description: company.short_description,
      fundingStage: company.funding_stage,
      technographics: company.technologies || [],
    };
  } catch (error) {
    console.error('Error running CompanyProfileAgent:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
