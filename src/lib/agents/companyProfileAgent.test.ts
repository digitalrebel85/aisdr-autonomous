import { runCompanyProfileAgent } from './companyProfileAgent';

// Mock the global fetch function
global.fetch = jest.fn();

describe('CompanyProfileAgent', () => {
  const mockFetch = fetch as jest.Mock;

  beforeEach(() => {
    // Clear mock history before each test
    mockFetch.mockClear();
    // Set the required environment variable for tests
    process.env.APOLLO_API_KEY = 'test-api-key';
  });

  it('should fetch and process company data correctly', async () => {
    // Arrange: Mock the successful Apollo API response
    const mockApolloResponse = {
      company: {
        name: 'TestCorp',
        domain: 'testcorp.com',
        industry: 'Technology',
        linkedin_url: 'https://linkedin.com/company/testcorp',
        employee_count: 350,
        short_description: 'A leading provider of innovative test solutions.',
        funding_stage: 'Series B',
        technologies: ['React', 'Node.js', 'AWS'],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApolloResponse),
    } as Response);

    // Act: Run the agent
    const result = await runCompanyProfileAgent({ companyDomain: 'testcorp.com' });

    // Assert: Check if the output matches the expected shape and transformations
    expect(result).toEqual({
      companyName: 'TestCorp',
      industry: 'Technology',
      companySize: '201-500', // Correctly bucketed from 350
      description: 'A leading provider of innovative test solutions.',
      fundingStage: 'Series B',
      technographics: ['React', 'Node.js', 'AWS'],
    });

    // Assert that fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.apollo.io/v1/companies/enrich?domain=testcorp.com&api_key=test-api-key',
      expect.any(Object)
    );
  });

  it('should handle cases where employee_count is null', async () => {
    // Arrange: Mock response with null employee_count
    const mockApolloResponse = {
      company: {
        name: 'NoEmployees Inc.',
        employee_count: null,
        // ... other fields
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApolloResponse),
    } as Response);

    // Act
    const result = await runCompanyProfileAgent({ companyDomain: 'noemployees.com' });

    // Assert
    expect(result.companySize).toBeNull();
  });

  it('should throw an error if the API request fails', async () => {
    // Arrange: Mock a failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    // Act & Assert: Expect the function to throw an error
    await expect(
      runCompanyProfileAgent({ companyDomain: 'fail.com' })
    ).rejects.toThrow('Apollo API request failed with status 500');
  });
});
