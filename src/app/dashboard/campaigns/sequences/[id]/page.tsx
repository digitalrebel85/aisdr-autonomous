'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Mail, 
  Sparkles, 
  Edit3, 
  Eye, 
  Check, 
  ArrowRight,
  Clock,
  Target,
  Save,
  Play
} from 'lucide-react';

interface SequenceStep {
  id: number;
  sequence_id: number;
  step_number: number;
  step_type: string;
  delay_days: number;
  ai_generation_prompt: string;
  subject_line?: string;
  email_body?: string;
  is_finalized: boolean;
}

interface Sequence {
  id: number;
  name: string;
  description: string;
  objective: string;
  messaging_framework: string;
  total_touches: number;
  status: string;
}

export default function SequenceBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const sequenceId = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState('');

  // Form state for active step
  const [subjectLine, setSubjectLine] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    fetchSequenceData();
  }, [sequenceId]);

  useEffect(() => {
    // Load active step data
    const step = steps.find(s => s.step_number === activeStep);
    if (step) {
      setSubjectLine(step.subject_line || '');
      setEmailBody(step.email_body || '');
    }
  }, [activeStep, steps]);

  const fetchSequenceData = async () => {
    try {
      // Fetch sequence with offer data
      const { data: seqData, error: seqError } = await supabase
        .from('campaign_sequences')
        .select('*, offers(*), icp_profiles(*)')
        .eq('id', sequenceId)
        .single();

      if (seqError) throw seqError;
      setSequence(seqData);

      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;
      setSteps(stepsData || []);

    } catch (err) {
      console.error('Error fetching sequence:', err);
      setError('Failed to load sequence');
    }
  };

  const generateEmailWithAI = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const step = steps.find(s => s.step_number === activeStep);
      if (!step) throw new Error('Step not found');

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL}/generate-sequence-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence_id: sequenceId,
          step_number: activeStep,
          framework: sequence?.messaging_framework,
          objective: sequence?.objective,
          prompt: step.ai_generation_prompt,
          previous_emails: steps
            .filter(s => s.step_number < activeStep && s.email_body)
            .map(s => ({ subject: s.subject_line, body: s.email_body }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      setSubjectLine(data.subject || '');
      setEmailBody(data.body || '');

    } catch (err) {
      console.error('Error generating email:', err);
      setError('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStep = async () => {
    setIsSaving(true);
    setError('');

    try {
      const step = steps.find(s => s.step_number === activeStep);
      if (!step) throw new Error('Step not found');

      const { error: updateError } = await supabase
        .from('sequence_steps')
        .update({
          subject_line: subjectLine,
          email_body: emailBody,
          is_finalized: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', step.id);

      if (updateError) throw updateError;

      // Update local state
      setSteps(steps.map(s => 
        s.step_number === activeStep 
          ? { ...s, subject_line: subjectLine, email_body: emailBody, is_finalized: true }
          : s
      ));

      // Move to next step if available
      if (activeStep < (sequence?.total_touches || 0)) {
        setActiveStep(activeStep + 1);
      }

    } catch (err) {
      console.error('Error saving step:', err);
      setError('Failed to save email template');
    } finally {
      setIsSaving(false);
    }
  };

  const proceedToLaunch = () => {
    // Check if all steps are finalized
    const allFinalized = steps.every(s => s.is_finalized);
    
    if (!allFinalized) {
      setError('Please finalize all email templates before launching');
      return;
    }

    router.push(`/dashboard/campaigns/launch/${sequenceId}`);
  };

  const allStepsFinalized = steps.every(s => s.is_finalized);
  const currentStepFinalized = steps.find(s => s.step_number === activeStep)?.is_finalized;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {sequence?.name || 'Sequence Builder'}
              </h1>
              <p className="text-gray-600">
                Customize your {sequence?.total_touches}-touch email sequence
              </p>
            </div>
            <button
              onClick={proceedToLaunch}
              disabled={!allStepsFinalized}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
            >
              <Play className="w-5 h-5" />
              <span>Launch Campaign</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sequence Progress</h3>
            <span className="text-sm text-gray-600">
              {steps.filter(s => s.is_finalized).length} of {steps.length} completed
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => setActiveStep(step.step_number)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                    activeStep === step.step_number
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : step.is_finalized
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.is_finalized ? <Check className="w-5 h-5" /> : step.step_number}
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step.is_finalized ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {steps.map(step => (
              <span key={step.id} className="flex-1 text-center">
                Day {step.delay_days}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Touch {activeStep} of {sequence?.total_touches}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {steps.find(s => s.step_number === activeStep)?.step_type || 'Email'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Day {steps.find(s => s.step_number === activeStep)?.delay_days || 0}</span>
                </div>
              </div>

              {/* AI Generation Prompt */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">AI Guidance</h4>
                    <p className="text-sm text-gray-700">
                      {steps.find(s => s.step_number === activeStep)?.ai_generation_prompt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateEmailWithAI}
                disabled={isGenerating}
                className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Email with AI</span>
                  </>
                )}
              </button>

              {/* Subject Line */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter email content..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>{previewMode ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={saveStep}
                  disabled={isSaving || !subjectLine || !emailBody}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Continue</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Preview Mode */}
            {previewMode && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Email Preview</h3>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Subject:</div>
                    <div className="font-semibold text-gray-900">{subjectLine || '(No subject)'}</div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800">
                      {emailBody || '(No content)'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Sequence Overview */}
          <div className="space-y-6">
            {/* Sequence Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sequence Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">Framework</dt>
                  <dd className="font-medium text-gray-900">{sequence?.messaging_framework}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Objective</dt>
                  <dd className="font-medium text-gray-900 capitalize">{sequence?.objective}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Total Touches</dt>
                  <dd className="font-medium text-gray-900">{sequence?.total_touches}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      allStepsFinalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {allStepsFinalized ? 'Ready to Launch' : 'In Progress'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* All Steps Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">All Touches</h3>
              <div className="space-y-3">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.step_number)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      activeStep === step.step_number
                        ? 'border-blue-600 bg-blue-50'
                        : step.is_finalized
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">Touch {step.step_number}</span>
                      {step.is_finalized && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600">Day {step.delay_days}</div>
                    {step.subject_line && (
                      <div className="text-xs text-gray-700 mt-1 truncate">
                        {step.subject_line}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Use AI to generate initial drafts, then customize
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Keep subject lines under 50 characters
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Each touch should build on the previous one
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Include clear CTAs in every email
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
