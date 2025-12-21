'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ArrowRight,
  Plug,
  CheckCircle,
  Sparkles,
  Mail,
  Calendar,
  Database,
  Brain,
  BarChart3,
  Users
} from 'lucide-react';

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "Google Workspace",
      category: "Email & Calendar",
      description: "Full Gmail and Google Calendar integration for seamless email sending and meeting scheduling.",
      features: ["Gmail inbox connection", "Google Calendar sync", "OAuth authentication", "Real-time updates"],
      icon: Mail,
      color: "from-red-500/20 to-orange-500/20",
      borderColor: "border-red-500/30"
    },
    {
      name: "Microsoft 365",
      category: "Email & Calendar",
      description: "Connect Outlook email and calendar for enterprise-grade email automation.",
      features: ["Outlook integration", "Microsoft Calendar", "Azure AD support", "Enterprise security"],
      icon: Mail,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      name: "Salesforce",
      category: "CRM",
      description: "Sync leads, contacts, and activities with your Salesforce CRM automatically.",
      features: ["Lead sync", "Activity logging", "Custom fields", "Bi-directional sync"],
      icon: Database,
      color: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30"
    },
    {
      name: "HubSpot",
      category: "CRM",
      description: "Integrate with HubSpot for seamless lead management and pipeline tracking.",
      features: ["Contact sync", "Deal tracking", "Workflow triggers", "Custom properties"],
      icon: Database,
      color: "from-orange-500/20 to-red-500/20",
      borderColor: "border-orange-500/30"
    },
    {
      name: "OpenAI",
      category: "AI",
      description: "Powered by GPT-4 for intelligent email generation and response analysis.",
      features: ["Email copywriting", "Sentiment analysis", "Intent detection", "Personalization"],
      icon: Brain,
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30"
    },
    {
      name: "Apollo.io",
      category: "Data Enrichment",
      description: "Enrich your leads with company and contact data from Apollo's database.",
      features: ["Company data", "Contact info", "Intent signals", "Technographics"],
      icon: Users,
      color: "from-violet-500/20 to-purple-500/20",
      borderColor: "border-violet-500/30"
    },
    {
      name: "Calendly",
      category: "Scheduling",
      description: "Connect Calendly for automated meeting booking and scheduling.",
      features: ["Meeting links", "Availability sync", "Event types", "Notifications"],
      icon: Calendar,
      color: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      name: "Slack",
      category: "Notifications",
      description: "Get real-time notifications and updates directly in your Slack workspace.",
      features: ["Reply alerts", "Meeting notifications", "Daily summaries", "Custom channels"],
      icon: BarChart3,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30"
    }
  ];

  const categories = ["All", "Email & Calendar", "CRM", "AI", "Data Enrichment", "Scheduling", "Notifications"];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-3xl animate-float-reverse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-cyan-600/15 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">ConnectLead</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
            <Plug className="w-4 h-4 mr-2" />
            Integrations
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mt-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <span className="text-white">Connect With Your</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Favorite Tools</span>
          </h1>
          <p className="text-xl text-gray-400 mt-6 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
            ConnectLead integrates seamlessly with your existing tech stack to supercharge your sales workflow.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration, index) => {
              const IconComponent = integration.icon;
              return (
                <div 
                  key={index}
                  className="group bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300 hover-lift"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl ${integration.borderColor} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">
                      {integration.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                    {integration.name}
                  </h3>
                  <p className="text-gray-400 mb-4 text-sm">
                    {integration.description}
                  </p>
                  <ul className="space-y-2">
                    {integration.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Need a Custom Integration?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Our API allows you to build custom integrations for your specific needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25">
                    Contact Us
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ConnectLead</span>
              </div>
              <p className="text-gray-500">
                AI-powered sales development that books more qualified demos automatically.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-500">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-500">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-500">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 ConnectLead. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
