'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, CheckCircle, AlertCircle, Lightbulb, Users, Calendar } from 'lucide-react';

/**
 * 🚀 AI-Powered Unstructured Lead Capture
 * Transform natural conversations into structured leads
 */

interface ProcessedLead {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  company_domain?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  linkedin_url?: string;
  pain_points: string[];
  interests: string[];
  lead_temperature: string;
  confidence_score: number;
  extracted_fields: string[];
  missing_fields: string[];
  processing_notes: string[];
}

export default function UnstructuredLeadCapture() {
  const [rawText, setRawText] = useState('');
  const [source, setSource] = useState('');
  const [event, setEvent] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [followUpTiming, setFollowUpTiming] = useState('');
  const [userNotes, setUserNotes] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/leads/capture-unstructured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: rawText,
          source: source || 'manual_input',
          context: {
            event,
            location,
            urgency,
            follow_up_timing: followUpTiming,
          },
          user_notes: userNotes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      
      // Clear form on success
      if (data.success) {
        setRawText('');
        setSource('');
        setEvent('');
        setLocation('');
        setUrgency('medium');
        setFollowUpTiming('');
        setUserNotes('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 AI-Powered Lead Capture
        </h1>
        <p className="text-gray-600">
          Transform natural conversations into structured leads using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Natural Language Input
            </CardTitle>
            <CardDescription>
              Describe your lead interaction in natural language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Main Text Input */}
              <div>
                <Label htmlFor="rawText">Lead Information *</Label>
                <Textarea
                  id="rawText"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Example: Met Mike Jones from ABC Technologies at the trade show. He mentioned they're struggling with lead generation and their current system isn't working. Seemed interested in automation. Follow up next week. His email might be mjones@abctech.com"
                  className="min-h-[120px] mt-1"
                  required
                />
              </div>

              {/* Context Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Trade show, networking event, referral..."
                  />
                </div>
                <div>
                  <Label htmlFor="event">Event/Context</Label>
                  <Input
                    id="event"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    placeholder="SaaS Summit 2025, LinkedIn connection..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, Virtual meeting..."
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select value={urgency} onValueChange={(value: 'low' | 'medium' | 'high') => setUrgency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Follow up when convenient</SelectItem>
                      <SelectItem value="medium">Medium - Standard follow-up</SelectItem>
                      <SelectItem value="high">High - Priority follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="followUpTiming">Follow-up Timing</Label>
                <Input
                  id="followUpTiming"
                  value={followUpTiming}
                  onChange={(e) => setFollowUpTiming(e.target.value)}
                  placeholder="Next week, End of month, After their conference..."
                />
              </div>

              <div>
                <Label htmlFor="userNotes">Additional Notes</Label>
                <Textarea
                  id="userNotes"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Any additional context, personal notes, or observations..."
                  className="min-h-[80px]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={processing || !rawText.trim()}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Extract Lead Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Display */}
        <div className="space-y-6">
          {/* Example */}
          {!result && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Example Input
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p className="font-medium mb-2">Try this example:</p>
                  <p className="text-gray-700">
                    "Met Sarah Chen from TechStartup Inc at the SaaS Summit yesterday. 
                    She's the VP of Marketing and mentioned they're struggling with lead 
                    qualification and their conversion rates are only 2%. They're using 
                    HubSpot but not getting the results they want. She seemed very 
                    interested when I mentioned AI-powered lead scoring. Her email is 
                    sarah.chen@techstartup.com. Follow up this week while the 
                    conversation is fresh."
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Processing Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="space-y-4">
              {/* Success Header */}
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Lead Successfully Captured!
                  </CardTitle>
                  <CardDescription>
                    AI Confidence: <span className={getConfidenceColor(result.ai_extraction.confidence_score)}>
                      {Math.round(result.ai_extraction.confidence_score * 100)}%
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Extracted Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Extracted Lead Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.lead.name && (
                      <div>
                        <Label className="text-sm font-medium">Name</Label>
                        <p className="text-sm text-gray-700">{result.lead.name}</p>
                      </div>
                    )}
                    {result.lead.email && (
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-gray-700">{result.lead.email}</p>
                      </div>
                    )}
                    {result.lead.company && (
                      <div>
                        <Label className="text-sm font-medium">Company</Label>
                        <p className="text-sm text-gray-700">{result.lead.company}</p>
                      </div>
                    )}
                    {result.lead.title && (
                      <div>
                        <Label className="text-sm font-medium">Title</Label>
                        <p className="text-sm text-gray-700">{result.lead.title}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Insights */}
                  {result.lead.enriched_data?.unstructured_capture?.ai_extracted && (
                    <div className="mt-4 space-y-3">
                      {result.lead.enriched_data.unstructured_capture.ai_extracted.pain_points?.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Pain Points</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.lead.enriched_data.unstructured_capture.ai_extracted.pain_points.map((point: string, index: number) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.lead.enriched_data.unstructured_capture.ai_extracted.interests?.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Interests</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.lead.enriched_data.unstructured_capture.ai_extracted.interests.map((interest: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Lead Temperature</Label>
                        <Badge className={`ml-2 ${getTemperatureColor(result.lead.enriched_data.unstructured_capture.ai_extracted.lead_temperature)}`}>
                          {result.lead.enriched_data.unstructured_capture.ai_extracted.lead_temperature}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Follow-up Suggestions */}
              {result.follow_up_suggestions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Follow-up Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.follow_up_suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.next_steps?.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
