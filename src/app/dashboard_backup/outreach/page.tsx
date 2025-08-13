'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Define types for our data
type Lead = {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  pain_points: string[]; // Correctly type as an array of strings
  offer: string;
  hook_snippet: string;
};

type Draft = {
  subject: string;
  body: string;
};

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch leads and connected inboxes on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);
        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
          setError('Failed to fetch leads.');
        } else {
          setLeads(leadsData || []);
        }

        // Fetch connected inboxes to get a sender email
        const { data: inboxesData, error: inboxesError } = await supabase
          .from('connected_inboxes')
          .select('email_address')
          .eq('user_id', user.id)
          .limit(1);
        
        if (inboxesError) {
            console.error('Error fetching inboxes:', inboxesError);
            setError('Could not find a connected inbox to send from. Please connect an inbox in Settings.');
        } else if (inboxesData && inboxesData.length > 0) {
            setSenderEmail(inboxesData[0].email_address);
        } else {
          setError('No connected inbox found. Please connect an inbox in Settings to send emails.');
        }
      }
    };
    fetchInitialData();
  }, [supabase]);

  const handleGenerateDraft = async () => {
    if (!selectedLead) return;

    setIsLoading(true);
    setError(null);
    setDraft(null);

    try {
      const response = await fetch('/api/outreach/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedLead,
          pain_points: selectedLead.pain_points.join(', '),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft. Please try again.');
      }

      const data = await response.json();
      setDraft(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while generating the draft.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!draft || !selectedLead) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedLead.email,
          subject: draft.subject,
          body: draft.body,
          lead_id: selectedLead.id,
          sender_email: senderEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email. Please check the connected inbox and try again.');
      }

      // Reset state on success
      alert('Email sent successfully!');
      setDraft(null);
      setSelectedLead(null);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while sending the email.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">New Outreach</h1>
      <p className="text-gray-400 mb-8">Select a lead, generate a personalized outreach email, and send it.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Lead Selection & Draft Generation */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">1. Select Lead</h2>
          <select
            onChange={(e) => {
              const lead = leads.find(lead => String(lead.id) === e.target.value) || null;
              setSelectedLead(lead);
            }}
            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
            disabled={leads.length === 0}
          >
            <option value="">{leads.length > 0 ? 'Select a lead...' : 'No leads found'}</option>
            {leads.map(lead => (
              <option key={lead.id} value={lead.id}>{lead.name} - {lead.company}</option>
            ))}
          </select>

          {selectedLead && (
            <div className="bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="font-bold">{selectedLead.name}</h3>
              <p className="text-sm text-gray-400">{selectedLead.title} at {selectedLead.company}</p>
              <p className="text-sm text-gray-400">{selectedLead.email}</p>
            </div>
          )}

          <button
            onClick={handleGenerateDraft}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
            disabled={!selectedLead || isLoading}
          >
            {isLoading ? 'Generating...' : '2. Generate Draft'}
          </button>
        </div>

        {/* Right Column: Draft Preview & Sending */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">3. Review and Send</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {draft ? (
            <div>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                className="w-full p-2 rounded bg-gray-700 text-white mb-4"
                placeholder="Subject"
              />
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                className="w-full p-2 rounded bg-gray-700 text-white mb-4 h-64"
                placeholder="Email body"
              />
              <button
                onClick={handleSendEmail}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
                disabled={isSending || !draft || !senderEmail}
              >
                {isSending ? 'Sending...' : '4. Send Email'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 pt-16">
              <p>Generate a draft to see it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
