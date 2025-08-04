/**
 * CSV to JSON Converter for AI Lead Processing
 * Converts traditional CSV uploads to AI-processable JSON format
 * Specially optimized for Apollo exports with snippet and tech_stack fields
 */

interface CSVRow {
  [key: string]: string;
}

interface JSONLeadData {
  raw_data: string;
  source: string;
  metadata: {
    original_csv_data: CSVRow;
    apollo_fields?: {
      snippet?: string;
      tech_stack?: string;
      industry?: string;
      funding_stage?: string;
    };
  };
  notes?: string;
}

export class CSVToJSONConverter {
  
  /**
   * Convert CSV string to AI-processable JSON format
   */
  static convertCSVToJSON(csvData: string, source: string = 'csv_upload'): JSONLeadData[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse headers (case-insensitive)
    const headers = this.parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
    const jsonData: JSONLeadData[] = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVRow(lines[i]);
      
      if (values.length !== headers.length || values.every(v => !v.trim())) {
        continue; // Skip invalid or empty rows
      }

      // Create row object
      const rowData: CSVRow = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index]?.trim() || '';
      });

      // Convert to AI-processable format
      const jsonLead = this.convertRowToJSONLead(rowData, source);
      if (jsonLead) {
        jsonData.push(jsonLead);
      }
    }

    return jsonData;
  }

  /**
   * Parse CSV row handling quoted values and commas
   */
  private static parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(val => val.replace(/^"|"$/g, '')); // Remove surrounding quotes
  }

  /**
   * Convert single CSV row to JSON lead format
   */
  private static convertRowToJSONLead(rowData: CSVRow, source: string): JSONLeadData | null {
    // Must have email to be valid
    const email = this.findFieldValue(rowData, ['email', 'email_address', 'e-mail']);
    if (!email) {
      return null;
    }

    // Extract standard fields
    const firstName = this.findFieldValue(rowData, ['first_name', 'firstname', 'fname', 'given_name']);
    const lastName = this.findFieldValue(rowData, ['last_name', 'lastname', 'lname', 'surname', 'family_name']);
    const fullName = this.findFieldValue(rowData, ['name', 'full_name', 'fullname', 'contact_name']);
    const company = this.findFieldValue(rowData, ['company', 'company_name', 'organization', 'org']);
    const title = this.findFieldValue(rowData, ['title', 'job_title', 'position', 'role']);
    const phone = this.findFieldValue(rowData, ['phone', 'phone_number', 'mobile', 'tel']);
    const linkedin = this.findFieldValue(rowData, ['linkedin', 'linkedin_url', 'linkedin_profile']);
    const location = this.findFieldValue(rowData, ['location', 'city', 'address', 'region']);
    
    // Apollo-specific fields
    const snippet = this.findFieldValue(rowData, ['snippet', 'description', 'company_description', 'about']);
    const techStack = this.findFieldValue(rowData, ['tech_stack', 'technology', 'technologies', 'tools']);
    const industry = this.findFieldValue(rowData, ['industry', 'sector', 'vertical']);
    const fundingStage = this.findFieldValue(rowData, ['funding_stage', 'funding', 'investment_stage']);
    const notes = this.findFieldValue(rowData, ['notes', 'comments', 'remarks', 'additional_info']);

    // Build raw_data string for AI processing
    const rawDataParts: string[] = [];
    
    // Add name information
    if (fullName) {
      rawDataParts.push(fullName);
    } else if (firstName || lastName) {
      rawDataParts.push([firstName, lastName].filter(Boolean).join(' '));
    }
    
    // Add professional info
    if (title && company) {
      rawDataParts.push(`${title} at ${company}`);
    } else if (title) {
      rawDataParts.push(title);
    } else if (company) {
      rawDataParts.push(`works at ${company}`);
    }
    
    // Add contact info
    rawDataParts.push(email);
    if (phone) rawDataParts.push(phone);
    if (linkedin) rawDataParts.push(linkedin);
    if (location) rawDataParts.push(`located in ${location}`);
    
    // Add Apollo intelligence
    if (snippet) {
      rawDataParts.push(`Company context: ${snippet}`);
    }
    
    if (techStack) {
      rawDataParts.push(`Technology stack: ${techStack}`);
    }
    
    if (industry) {
      rawDataParts.push(`Industry: ${industry}`);
    }
    
    if (fundingStage) {
      rawDataParts.push(`Funding stage: ${fundingStage}`);
    }
    
    // Create JSON lead object
    const jsonLead: JSONLeadData = {
      raw_data: rawDataParts.join(', '),
      source: source,
      metadata: {
        original_csv_data: rowData
      }
    };

    // Add Apollo-specific metadata if present
    if (snippet || techStack || industry || fundingStage) {
      jsonLead.metadata.apollo_fields = {};
      if (snippet) jsonLead.metadata.apollo_fields.snippet = snippet;
      if (techStack) jsonLead.metadata.apollo_fields.tech_stack = techStack;
      if (industry) jsonLead.metadata.apollo_fields.industry = industry;
      if (fundingStage) jsonLead.metadata.apollo_fields.funding_stage = fundingStage;
    }

    // Add notes if present
    if (notes) {
      jsonLead.notes = notes;
    }

    return jsonLead;
  }

  /**
   * Find field value using multiple possible field names (case-insensitive)
   */
  private static findFieldValue(rowData: CSVRow, possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      const value = rowData[name.toLowerCase()];
      if (value && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  /**
   * Detect if CSV contains Apollo-style data
   */
  static detectApolloFormat(csvData: string): boolean {
    const firstLine = csvData.split('\n')[0].toLowerCase();
    const apolloIndicators = ['snippet', 'tech_stack', 'technology', 'funding_stage'];
    return apolloIndicators.some(indicator => firstLine.includes(indicator));
  }

  /**
   * Get preview of conversion without full processing
   */
  static getConversionPreview(csvData: string, maxRows: number = 3): {
    totalRows: number;
    isApolloFormat: boolean;
    preview: JSONLeadData[];
    headers: string[];
  } {
    const lines = csvData.trim().split('\n');
    const headers = this.parseCSVRow(lines[0]);
    const isApolloFormat = this.detectApolloFormat(csvData);
    
    // Convert first few rows for preview
    const previewData = lines.slice(0, Math.min(maxRows + 1, lines.length)).join('\n');
    const preview = this.convertCSVToJSON(previewData, 'csv_preview');
    
    return {
      totalRows: lines.length - 1, // Exclude header
      isApolloFormat,
      preview,
      headers
    };
  }

  /**
   * Validate CSV format and provide feedback
   */
  static validateCSV(csvData: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      const lines = csvData.trim().split('\n');
      
      if (lines.length < 2) {
        errors.push('CSV must have at least a header row and one data row');
        return { isValid: false, errors, warnings, suggestions };
      }

      const headers = this.parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
      
      // Check for required fields
      const hasEmail = headers.some(h => ['email', 'email_address', 'e-mail'].includes(h));
      if (!hasEmail) {
        errors.push('CSV must contain an email column (email, email_address, or e-mail)');
      }

      // Check for recommended fields
      const hasName = headers.some(h => ['name', 'first_name', 'last_name', 'full_name'].includes(h));
      if (!hasName) {
        warnings.push('Consider adding name fields (first_name, last_name, or full_name) for better results');
      }

      const hasCompany = headers.some(h => ['company', 'company_name', 'organization'].includes(h));
      if (!hasCompany) {
        warnings.push('Consider adding company field for better lead qualification');
      }

      // Apollo-specific suggestions
      if (this.detectApolloFormat(csvData)) {
        suggestions.push('Apollo format detected! Your snippet and tech_stack data will be used for enhanced email personalization');
      } else {
        suggestions.push('For enhanced AI processing, consider including fields like: snippet, tech_stack, industry');
      }

      // Check data consistency
      const sampleRows = lines.slice(1, Math.min(6, lines.length));
      const inconsistentRows = sampleRows.filter(row => {
        const values = this.parseCSVRow(row);
        return values.length !== headers.length;
      });

      if (inconsistentRows.length > 0) {
        warnings.push(`${inconsistentRows.length} rows have inconsistent column counts`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };

    } catch (error) {
      errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings, suggestions };
    }
  }
}

// Export utility functions
export const convertCSVToJSON = CSVToJSONConverter.convertCSVToJSON;
export const detectApolloFormat = CSVToJSONConverter.detectApolloFormat;
export const getConversionPreview = CSVToJSONConverter.getConversionPreview;
export const validateCSV = CSVToJSONConverter.validateCSV;
