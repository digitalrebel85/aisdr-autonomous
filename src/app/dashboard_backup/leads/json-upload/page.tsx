'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import JSONLeadUpload from '@/components/JSONLeadUpload'

export default function JSONLeadUploadPage() {
  const router = useRouter()
  const [uploadResults, setUploadResults] = useState<any>(null)

  const handleUploadComplete = (results: any) => {
    setUploadResults(results)
    
    // Show success message and redirect after a delay
    setTimeout(() => {
      router.push('/dashboard/leads?tab=recent&source=json_upload')
    }, 3000)
  }

  const handleUploadStart = () => {
    setUploadResults(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  AI Lead Processing
                </h1>
                <p className="text-sm text-gray-500">
                  Upload unstructured lead data for intelligent processing
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/leads/upload')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Traditional CSV Upload
              </button>
              <button
                onClick={() => router.push('/dashboard/leads')}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Leads
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {uploadResults && uploadResults.status === 'completed' && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-green-400 text-2xl mr-3">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Processing Complete!
                </h3>
                <p className="text-green-700 mt-1">
                  Successfully processed {uploadResults.processed_count} leads. 
                  Redirecting to your leads dashboard...
                </p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-green-900">Total Processed</div>
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResults.processed_count}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-green-900">Success Rate</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((uploadResults.processed_count / uploadResults.total_count) * 100)}%
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-green-900">Errors</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {uploadResults.error_count || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-green-900">Status</div>
                    <div className="text-sm font-medium text-green-600 uppercase">
                      {uploadResults.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Comparison */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Why Choose AI Lead Processing?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-red-600 mb-3">❌ Traditional CSV Upload</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Requires specific column formatting</li>
                <li>• Manual data cleaning and validation</li>
                <li>• Limited to structured data only</li>
                <li>• No intelligent field extraction</li>
                <li>• Time-consuming data preparation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-600 mb-3">✅ AI JSON Processing</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Accepts any unstructured text format</li>
                <li>• Automatic data extraction and cleaning</li>
                <li>• Intelligent field recognition</li>
                <li>• Context-aware business insights</li>
                <li>• Copy-paste from any source</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        <JSONLeadUpload 
          onUploadComplete={handleUploadComplete}
          onUploadStart={handleUploadStart}
        />

        {/* Use Cases */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Perfect For These Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-medium mb-2">Conference Notes</h3>
              <p className="text-sm text-gray-600">
                Paste meeting notes, business card info, or conversation summaries
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">💼</div>
              <h3 className="font-medium mb-2">LinkedIn Exports</h3>
              <p className="text-sm text-gray-600">
                Copy LinkedIn profiles, connection lists, or search results
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-medium mb-2">Email Signatures</h3>
              <p className="text-sm text-gray-600">
                Extract contacts from email signatures or forwarded information
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-medium mb-2">CRM Migration</h3>
              <p className="text-sm text-gray-600">
                Import messy data from old CRM systems or spreadsheets
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="font-medium mb-2">Web Research</h3>
              <p className="text-sm text-gray-600">
                Process company directories, team pages, or research notes
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-medium mb-2">Social Media</h3>
              <p className="text-sm text-gray-600">
                Extract leads from social media posts, comments, or profiles
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">How Our AI Processing Works</h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">🧠</div>
              <h3 className="font-medium mb-1">AI Analysis</h3>
              <p className="text-gray-600">Natural language processing extracts structured data</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-medium mb-1">Entity Recognition</h3>
              <p className="text-gray-600">Identifies names, companies, emails, and titles</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-medium mb-1">Data Validation</h3>
              <p className="text-gray-600">Validates formats and assigns confidence scores</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-medium mb-1">Auto Enrichment</h3>
              <p className="text-gray-600">Enhances leads with additional data sources</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
