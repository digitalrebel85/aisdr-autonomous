'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UserProfile {
  id: string
  full_name: string | null
  company: string | null
  role: string | null
  timezone: string
  onboarding_completed: boolean
  onboarding_step: number
}

const ONBOARDING_STEPS = [
  { id: 1, title: 'Welcome', description: 'Tell us about yourself' },
  { id: 2, title: 'API Keys', description: 'Configure enrichment providers' },
  { id: 3, title: 'First Lead', description: 'Add your first lead' },
  { id: 4, title: 'Email Setup', description: 'Connect your email' },
  { id: 5, title: 'Calendar', description: 'Set up booking links' },
  { id: 6, title: 'Complete', description: 'You\'re all set!' }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get or create user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading profile:', error)
        setError('Failed to load profile')
        return
      }

      if (profile) {
        setProfile(profile)
        setCurrentStep(profile.onboarding_step || 1)
        setFullName(profile.full_name || '')
        setCompany(profile.company || '')
        setRole(profile.role || '')
        setTimezone(profile.timezone || 'UTC')

        // If already completed, redirect to dashboard
        if (profile.onboarding_completed) {
          router.push('/dashboard')
          return
        }
      } else {
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{ id: user.id }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          setError('Failed to create profile')
          return
        }

        setProfile(newProfile)
      }
    } catch (err) {
      console.error('Error in loadUserProfile:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (stepData: Partial<UserProfile>) => {
    if (!profile) return false

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(stepData)
        .eq('id', profile.id)

      if (error) {
        console.error('Error saving profile:', error)
        setError('Failed to save profile')
        return false
      }

      setProfile({ ...profile, ...stepData })
      return true
    } catch (err) {
      console.error('Error in saveProfile:', err)
      setError('An unexpected error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    let stepData: Partial<UserProfile> = { onboarding_step: currentStep + 1 }

    // Save step-specific data
    switch (currentStep) {
      case 1:
        if (!fullName.trim()) {
          setError('Please enter your full name')
          return
        }
        stepData = {
          ...stepData,
          full_name: fullName,
          company: company || null,
          role: role || null,
          timezone
        }
        break
      case 6:
        stepData = { ...stepData, onboarding_completed: true }
        break
    }

    const success = await saveProfile(stepData)
    if (!success) return

    if (currentStep === 6) {
      router.push('/dashboard')
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = async () => {
    const stepData: Partial<UserProfile> = { onboarding_step: currentStep + 1 }
    const success = await saveProfile(stepData)
    if (success) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkipOnboarding = async () => {
    const stepData: Partial<UserProfile> = { 
      onboarding_completed: true,
      onboarding_step: 6
    }
    const success = await saveProfile(stepData)
    if (success) {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AISDR
            </Link>
            <button
              onClick={handleSkipOnboarding}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip setup →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Account Setup</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2">
            {ONBOARDING_STEPS.map((step) => (
              <div key={step.id} className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.id}
                </div>
                <p className="text-xs text-gray-500 mt-1">{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AISDR!</h2>
              <p className="text-gray-600 mb-8">Let's get your account set up so you can start closing more deals.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select your role</option>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Founder/CEO">Founder/CEO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Configure API Keys</h2>
              <p className="text-gray-600 mb-8">
                Connect your enrichment providers to get the most out of AISDR. You can skip this for now and configure later.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Why API Keys?</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Use your own provider accounts for better cost control</li>
                  <li>• Access premium data from Apollo, Clearbit, Hunter, and more</li>
                  <li>• Higher rate limits and better data quality</li>
                  <li>• You can configure these later in Settings</li>
                </ul>
              </div>
              
              <div className="text-center">
                <Link
                  href="/settings"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Configure API Keys Now
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  Or skip and configure later
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your First Lead</h2>
              <p className="text-gray-600 mb-8">
                Let's add your first lead to get started. You can import more leads later via CSV.
              </p>
              
              <div className="text-center">
                <Link
                  href="/dashboard/leads"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Leads Page
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  Or skip and add leads later
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Email</h2>
              <p className="text-gray-600 mb-8">
                Connect your email to enable AI-powered inbox management and automated responses.
              </p>
              
              <div className="text-center">
                <Link
                  href="/dashboard/inbox"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Up Email Integration
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  Or skip and configure later
                </p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Up Calendar Booking</h2>
              <p className="text-gray-600 mb-8">
                Create booking links to make it easy for prospects to schedule meetings with you.
              </p>
              
              <div className="text-center">
                <Link
                  href="/dashboard/bookings"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Booking Links
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  Or skip and configure later
                </p>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h2>
              <p className="text-gray-600 mb-8">
                Welcome to AISDR! Your account is ready and you can start using all the features.
              </p>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Import Leads</h4>
                    <p className="text-sm text-gray-600">Upload your lead list via CSV or add them manually</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Configure API Keys</h4>
                    <p className="text-sm text-gray-600">Set up enrichment providers for better data</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Create Campaigns</h4>
                    <p className="text-sm text-gray-600">Build automated outreach sequences</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Set Up Calendar</h4>
                    <p className="text-sm text-gray-600">Create booking links for easy scheduling</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-3">
              {currentStep < 6 && (
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : currentStep === 6 ? (
                  'Go to Dashboard'
                ) : (
                  'Next →'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
