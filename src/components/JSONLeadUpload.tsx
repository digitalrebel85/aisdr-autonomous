'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/utils/supabase/client'
import { CSVToJSONConverter } from '@/utils/csvToJsonConverter'

interface RawLeadData {
  raw_data?: string
  text?: string
  metadata?: Record<string, any>
  source?: string
  notes?: string
}

interface ProcessingStatus {
  processing_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  processed_count: number
  total_count: number
  error_count: number
  errors: string[]
  results_preview: Array<{
    email: string
    full_name: string
    company: string
    confidence_score: number
  }>
}

interface JSONLeadUploadProps {
  onUploadComplete?: (results: any) => void
  onUploadStart?: () => void
}

export default function JSONLeadUpload({ onUploadComplete, onUploadStart }: JSONLeadUploadProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'paste' | 'file' | 'examples'>('paste')
  const [autoEnrich, setAutoEnrich] = useState(true)
  const [csvPreview, setCsvPreview] = useState<any>(null)
  const [isApolloFormat, setIsApolloFormat] = useState(false)
  
  const supabase = createClient()

  // Example data for users to understand the format
  const exampleData = {
    simple_text: [
      "John Smith, CEO at TechCorp Inc, john@techcorp.com, San Francisco based startup focusing on AI solutions, 50 employees",
      "Jane Doe - CTO @ StartupIO (jane.doe@startup.io) - NYC - Series A funded fintech company",
      "Mike Johnson, VP Sales at DataFlow Systems, mike.j@dataflow.com, Boston, interested in lead generation tools"
    ],
    structured_format: [
      {
        "raw_data": "Sarah Wilson, Marketing Director at CloudTech Solutions, sarah@cloudtech.com, Denver-based cloud infrastructure company, 200+ employees, looking for marketing automation tools",
        "source": "conference_notes",
        "metadata": { "priority": "high", "event": "CloudCon 2024" },
        "notes": "Met at booth, very interested in our product demo"
      },
      {
        "raw_data": "Alex Chen - Founder & CEO @ AI Innovations (alex@aiinnovations.io) - Seattle - Seed funded AI startup focusing on computer vision, 15 team members",
        "source": "linkedin_connection",
        "metadata": { "connection_date": "2024-01-15", "mutual_connections": 5 },
        "notes": "Connected after webinar, wants to schedule a call"
      }
    ],
    mixed_format: [
      "Robert Taylor, CTO at FinanceFlow, robert.taylor@financeflow.com, Chicago",
      {
        "text": "Lisa Anderson - Head of Operations @ RetailMax - lisa@retailmax.com - Austin, TX - E-commerce platform with 500+ employees",
        "source": "email_signature",
        "notes": "Forwarded by existing customer"
      },
      {
        "raw_data": "David Park, Product Manager at TechStart Inc, david@techstart.com, San Diego startup, Series B, 75 employees, needs better analytics tools",
        "metadata": { "referral": "existing_customer", "urgency": "medium" }
      }
    ]
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          // Try to parse as JSON to validate
          JSON.parse(content)
          setJsonInput(content)
          setError(null)
        } catch (err) {
          setError('Invalid JSON file. Please check the format.')
        }
      }
      reader.readAsText(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    multiple: false
  })

  const handleExampleSelect = (exampleKey: keyof typeof exampleData) => {
    const example = exampleData[exampleKey]
    setJsonInput(JSON.stringify(example, null, 2))
    setUploadMode('paste')
  }

  const validateAndParseJSON = (input: string) => {
    try {
      const parsed = JSON.parse(input)
      
      // Handle different input formats
      if (Array.isArray(parsed)) {
        return parsed
      } else if (parsed.leads && Array.isArray(parsed.leads)) {
        return parsed.leads
      } else {
        // Single lead object
        return [parsed]
      }
    } catch (err) {
      throw new Error('Invalid JSON format')
    }
  }

  const handleUpload = async () => {
    if (!jsonInput.trim()) {
      setError('Please provide JSON data to process')
      return
    }

    try {
      setError(null)
      setIsProcessing(true)
      onUploadStart?.()

      // Validate and parse JSON
      const leads = validateAndParseJSON(jsonInput)

      if (leads.length === 0) {
        throw new Error('No leads found in the provided data')
      }

      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please log in to upload leads')
      }

      // Send to processing API
      const response = await fetch(`${process.env.NEXT_PUBLIC_CREW_SERVICE_URL}/api/leads/upload-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          leads: leads,
          processing_options: {
            batch_size: 10,
            confidence_threshold: 0.3
          },
          auto_enrich: autoEnrich
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const result = await response.json()
      
      // Start polling for status updates
      if (result.processing_id) {
        pollProcessingStatus(result.processing_id, session.access_token)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsProcessing(false)
    }
  }

  const pollProcessingStatus = async (processingId: string, token: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CREW_SERVICE_URL}/api/leads/processing-status/${processingId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.ok) {
          const status: ProcessingStatus = await response.json()
          setProcessingStatus(status)

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval)
            setIsProcessing(false)
            
            if (status.status === 'completed') {
              onUploadComplete?.(status)
            } else {
              setError(`Processing failed: ${status.errors.join(', ')}`)
            }
          }
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }, 2000) // Poll every 2 seconds

    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isProcessing) {
        setIsProcessing(false)
        setError('Processing timeout - please check status manually')
      }
    }, 300000)
  }

  const handleTestProcessing = async () => {
    if (!jsonInput.trim()) {
      setError('Please provide test data')
      return
    }

    try {
      setError(null)
      
      const testData = {
        raw_data: jsonInput,
        source: "test_ui",
        metadata: { test: true }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please log in to test processing')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_CREW_SERVICE_URL}/api/leads/test-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(testData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Test failed')
      }

      const result = await response.json()
      
      // Show test results in a modal or alert
      alert(`Test Results:\nConfidence: ${result.extraction_summary.confidence_score}\nExtracted: ${result.extraction_summary.extracted_fields.join(', ')}\nMissing: ${result.extraction_summary.missing_fields.join(', ')}`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🧠 AI-Powered Lead Upload
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload unstructured lead data in JSON format. Our AI will intelligently extract 
          contact information, company details, and business context from any text format.
        </p>
      </div>

      {/* Upload Mode Selector */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setUploadMode('paste')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            uploadMode === 'paste'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Paste JSON
        </button>
        <button
          onClick={() => setUploadMode('file')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            uploadMode === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setUploadMode('examples')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            uploadMode === 'examples'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Examples
        </button>
      </div>

      {/* Examples Section */}
      {uploadMode === 'examples' && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Example Formats</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Simple Text Array</h4>
              <p className="text-sm text-gray-600 mb-3">
                Just paste unstructured text, one lead per array item
              </p>
              <button
                onClick={() => handleExampleSelect('simple_text')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Use This Example →
              </button>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Structured Format</h4>
              <p className="text-sm text-gray-600 mb-3">
                Include metadata, source, and notes for better processing
              </p>
              <button
                onClick={() => handleExampleSelect('structured_format')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Use This Example →
              </button>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Mixed Format</h4>
              <p className="text-sm text-gray-600 mb-3">
                Combine different formats in a single upload
              </p>
              <button
                onClick={() => handleExampleSelect('mixed_format')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Use This Example →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {uploadMode === 'file' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop your JSON file here' : 'Drag & drop a JSON file'}
            </p>
            <p className="text-gray-500">or click to browse files</p>
            <p className="text-sm text-gray-400">Supports .json and .txt files</p>
          </div>
        </div>
      )}

      {/* JSON Input Section */}
      {uploadMode === 'paste' && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            JSON Lead Data
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`Paste your JSON data here. Examples:

Simple array:
["John Smith, CEO at TechCorp, john@techcorp.com, SF startup, 50 employees"]

Structured format:
[{"raw_data": "Jane Doe - CTO @ StartupIO", "source": "linkedin", "notes": "interested in demo"}]`}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between items-center">
            <button
              onClick={handleTestProcessing}
              disabled={isProcessing || !jsonInput.trim()}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Processing
            </button>
            <p className="text-sm text-gray-500">
              {jsonInput.length} characters
            </p>
          </div>
        </div>
      )}

      {/* Processing Options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-3">Processing Options</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoEnrich}
              onChange={(e) => setAutoEnrich(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Auto-enrich leads after processing</span>
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-blue-900">Processing Status</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              processingStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
              processingStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {processingStatus.status.toUpperCase()}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingStatus.progress * 100}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Progress:</span>
              <span className="ml-1 font-medium">{Math.round(processingStatus.progress * 100)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Processed:</span>
              <span className="ml-1 font-medium">{processingStatus.processed_count}/{processingStatus.total_count}</span>
            </div>
            <div>
              <span className="text-gray-600">Errors:</span>
              <span className="ml-1 font-medium">{processingStatus.error_count}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-1 font-medium capitalize">{processingStatus.status}</span>
            </div>
          </div>

          {/* Results Preview */}
          {processingStatus.results_preview.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Sample Results:</h4>
              <div className="space-y-2">
                {processingStatus.results_preview.slice(0, 3).map((result, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-sm">
                    <div className="font-medium">{result.full_name || 'Unknown Name'}</div>
                    <div className="text-gray-600">{result.email} • {result.company}</div>
                    <div className="text-xs text-blue-600">Confidence: {(result.confidence_score * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div className="text-center">
        <button
          onClick={handleUpload}
          disabled={isProcessing || !jsonInput.trim()}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Leads...
            </span>
          ) : (
            '🚀 Process Leads with AI'
          )}
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm">
        <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Upload unstructured lead data in any text format</li>
          <li>AI extracts names, emails, companies, titles, and business context</li>
          <li>Data is validated and assigned confidence scores</li>
          <li>Leads are automatically enriched with additional information</li>
          <li>Results are saved to your leads database</li>
        </ol>
      </div>
    </div>
  )
}
