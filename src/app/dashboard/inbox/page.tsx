'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';

// Define types for our data to ensure type safety
type Lead = {
  email: string;
  name: string;
};

type Reply = {
  id: string;
  sentiment: string;
  summary: string;
  action: string;
  next_step_prompt: string;
  leads: Lead;
};

export default function InboxPage() {
  const supabase = createClient();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<{ [key: string]: string }>({});
  const [draftLoading, setDraftLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchReplies = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('replies')
          .select(`
            *,
            leads ( email, name )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching replies:', error);
        } else {
          setReplies(data as Reply[]);
        }
      }
      setLoading(false);
    };

    fetchReplies();
  }, [supabase]);

  const handleGenerateDraft = async (replyId: string, prompt: string) => {
    setDraftLoading(prev => ({ ...prev, [replyId]: true }));
    setDrafts(prev => ({ ...prev, [replyId]: '' })); // Clear previous draft

    try {
      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setDrafts(prev => ({ ...prev, [replyId]: (prev[replyId] || '') + chunkValue }));
      }

    } catch (error) {
      console.error('Error generating draft:', error);
      setDrafts(prev => ({ ...prev, [replyId]: 'Error generating draft. Please check the console.' }));
    } finally {
      setDraftLoading(prev => ({ ...prev, [replyId]: false }));
    }
  };

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-500';
      case 'neutral': return 'bg-gray-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">AI-Powered Inbox</h1>
      
      <div className="space-y-4">
        {replies && replies.length > 0 ? (
          replies.map(reply => (
            <div key={reply.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{reply.leads.name || 'Unknown Sender'}</h2>
                  <p className="text-sm text-gray-400">{reply.leads.email}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${getSentimentClass(reply.sentiment)}`}>
                  {reply.sentiment}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-300 font-semibold">Summary:</p>
                <p className="italic text-gray-400">{reply.summary}</p>
              </div>
              <div className="mt-4">
                <p className="text-gray-300 font-semibold">Suggested Action:</p>
                <p className="text-gray-400">{reply.action}</p>
              </div>
              <div className="mt-4 p-4 bg-gray-900 rounded">
                <p className="text-gray-300 font-semibold">AI Prompt for Next Step:</p>
                <p className="text-purple-400 font-mono text-sm mt-2">{reply.next_step_prompt}</p>
              </div>

              <div className="mt-4">
                <button 
                  onClick={() => handleGenerateDraft(reply.id, reply.next_step_prompt)}
                  disabled={draftLoading[reply.id]}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {draftLoading[reply.id] ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : 'Generate Draft with OpenAI'}
                </button>
              </div>

              {drafts[reply.id] && (
                <div className="mt-4 p-4 bg-gray-700 rounded">
                  <p className="text-gray-300 font-semibold">Generated Draft:</p>
                  <textarea 
                    readOnly 
                    className="w-full p-2 mt-2 bg-gray-800 text-white rounded-md font-mono text-sm" 
                    rows={8}
                    value={drafts[reply.id]}
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No analyzed replies yet.</p>
            <p className="text-gray-500 mt-2">When a lead replies to an email, the analysis will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
