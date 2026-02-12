'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Rocket, 
  Loader2, 
  ArrowRight,
  Users,
  Target,
  FileText,
  Zap,
  MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  campaignCreated?: any;
  timestamp: Date;
}

export default function CampaignAgentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for the API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/campaigns/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        toolCalls: data.toolCalls,
        campaignCreated: data.campaignCreated,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    {
      icon: Rocket,
      label: 'Create a campaign',
      prompt: 'I want to create a new outreach campaign. What do I have to work with?'
    },
    {
      icon: Target,
      label: 'Target high-score leads',
      prompt: 'Create a campaign targeting my highest ICP-scored leads with a meeting booking objective.'
    },
    {
      icon: Users,
      label: 'Reach new leads',
      prompt: 'I have new leads I haven\'t contacted yet. Set up a campaign to reach them.'
    },
    {
      icon: Zap,
      label: 'Quick demo campaign',
      prompt: 'Set up a quick demo-booking campaign using my best offer and top 20 leads.'
    }
  ];

  // Render markdown-like content (bold, lists, etc.)
  const renderContent = (content: string) => {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/g, '').replace(/```$/g, '');
        return (
          <pre key={i} className="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto text-sm text-gray-300 border border-white/10">
            <code>{code}</code>
          </pre>
        );
      }

      // Process inline markdown
      const lines = part.split('\n');
      return lines.map((line, j) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={`${i}-${j}`} className="text-lg font-bold text-white mt-3 mb-1">{processInline(line.slice(4))}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={`${i}-${j}`} className="text-xl font-bold text-white mt-3 mb-1">{processInline(line.slice(3))}</h2>;
        }
        // Bullet points
        if (line.match(/^[-*] /)) {
          return (
            <div key={`${i}-${j}`} className="flex items-start gap-2 ml-2 my-0.5">
              <span className="text-violet-400 mt-1 text-xs">●</span>
              <span>{processInline(line.slice(2))}</span>
            </div>
          );
        }
        // Numbered lists
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <div key={`${i}-${j}`} className="flex items-start gap-2 ml-2 my-0.5">
              <span className="text-violet-400 font-semibold text-sm min-w-[1.2rem]">{num}.</span>
              <span>{processInline(line.replace(/^\d+\.\s*/, ''))}</span>
            </div>
          );
        }
        // Empty lines
        if (line.trim() === '') {
          return <div key={`${i}-${j}`} className="h-2" />;
        }
        // Regular text
        return <p key={`${i}-${j}`} className="my-0.5">{processInline(line)}</p>;
      });
    });
  };

  const processInline = (text: string) => {
    // Bold
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Inline code
      const codeParts = part.split(/(`[^`]+`)/g);
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
          return <code key={`${i}-${j}`} className="bg-white/10 px-1.5 py-0.5 rounded text-violet-300 text-sm">{cp.slice(1, -1)}</code>;
        }
        return cp;
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Campaign Agent</h1>
                <p className="text-sm text-gray-500">Describe what you want. I'll build it.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  GPT-4o
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl flex items-center justify-center border border-violet-500/20">
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">What campaign should I build?</h2>
              <p className="text-gray-500 text-center max-w-md mb-8">
                Tell me your goal and I'll handle the rest — picking the right ICP, selecting leads, choosing a framework, and creating the campaign.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt.prompt);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] hover:border-violet-500/30 transition-all text-left group"
                  >
                    <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                      <prompt.icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{prompt.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-violet-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl px-5 py-3.5 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                        : 'bg-white/[0.05] border border-white/10 text-gray-300'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          {renderContent(msg.content)}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Tool call indicators */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.toolCalls.map((tc: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs text-gray-500">
                            {tc.function === 'get_leads' && <Users className="w-3 h-3" />}
                            {tc.function === 'get_icp_profiles' && <Target className="w-3 h-3" />}
                            {tc.function === 'get_offers' && <FileText className="w-3 h-3" />}
                            {tc.function === 'get_campaign_history' && <Rocket className="w-3 h-3" />}
                            {tc.function === 'create_campaign' && <Zap className="w-3 h-3 text-emerald-400" />}
                            <span>{tc.function.replace('get_', '').replace('_', ' ')}</span>
                            {tc.result?.count !== undefined && (
                              <span className="text-violet-400">({tc.result.count})</span>
                            )}
                            {tc.result?.returned !== undefined && (
                              <span className="text-violet-400">({tc.result.returned})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Campaign created banner */}
                    {msg.campaignCreated && (
                      <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                              <Rocket className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{msg.campaignCreated.campaign_name}</p>
                              <p className="text-xs text-gray-400">
                                {msg.campaignCreated.leads_count} leads · {msg.campaignCreated.touches} touches · {msg.campaignCreated.framework}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(msg.campaignCreated.url)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                          >
                            View Campaign
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 mt-1.5 px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what campaign to build..."
                rows={1}
                className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none overflow-hidden transition-all"
                style={{ minHeight: '52px', maxHeight: '150px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 150) + 'px';
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
