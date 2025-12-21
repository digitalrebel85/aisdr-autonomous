'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Target, 
  BarChart3, 
  Calendar,
  Mail,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Inbox,
  Sparkles,
  Brain,
  Rocket
} from 'lucide-react';

export default function FeaturesPage() {
  const coreFeatures = [
    {
      icon: Bot,
      title: "AI Email Generation",
      description: "Advanced AI writes personalized emails that sound human and get responses",
      details: [
        "GPT-4 powered email copywriting",
        "Personalization based on company data",
        "A/B testing for optimal performance",
        "Industry-specific templates"
      ]
    },
    {
      icon: Target,
      title: "Visitor Intelligence",
      description: "Identify anonymous website visitors and convert them into qualified leads",
      details: [
        "Reverse IP lookup technology",
        "Company identification and enrichment",
        "Real-time visitor tracking",
        "Intent data analysis"
      ]
    },
    {
      icon: MessageSquare,
      title: "Reply Classification",
      description: "AI automatically categorizes and responds to prospect replies",
      details: [
        "Sentiment analysis and intent detection",
        "Automated follow-up scheduling",
        "Interest level scoring",
        "Human handoff triggers"
      ]
    },
    {
      icon: Calendar,
      title: "Smart Booking",
      description: "Seamless calendar integration for automatic meeting scheduling",
      details: [
        "Multi-calendar support (Google, Outlook)",
        "Timezone-aware scheduling",
        "Custom booking pages",
        "Automated confirmations"
      ]
    },
    {
      icon: Inbox,
      title: "Multi-Inbox Management",
      description: "Connect and manage multiple email accounts for maximum deliverability",
      details: [
        "Gmail and Outlook integration",
        "Inbox rotation and warming",
        "Deliverability optimization",
        "Send limit management"
      ]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into campaign performance and prospect engagement",
      details: [
        "Open and reply rate tracking",
        "Conversion funnel analysis",
        "ROI and cost-per-lead metrics",
        "Predictive lead scoring"
      ]
    }
  ];

  const automationFeatures = [
    {
      icon: Zap,
      title: "Automated Outreach",
      description: "Set up campaigns that run 24/7 with human-like timing and personalization"
    },
    {
      icon: Clock,
      title: "Timezone Optimization",
      description: "Send emails at optimal times based on prospect's local timezone"
    },
    {
      icon: TrendingUp,
      title: "Strategic Follow-ups",
      description: "AI determines the best follow-up strategy based on engagement patterns"
    },
    {
      icon: Shield,
      title: "Deliverability Protection",
      description: "Built-in safeguards to maintain sender reputation and inbox placement"
    }
  ];

  const integrations = [
    {
      name: "Google Workspace",
      description: "Full Gmail and Google Calendar integration"
    },
    {
      name: "Microsoft 365",
      description: "Outlook email and calendar connectivity"
    },
    {
      name: "Supabase",
      description: "Real-time data synchronization and storage"
    },
    {
      name: "OpenAI",
      description: "Advanced AI for email generation and analysis"
    },
    {
      name: "Nylas",
      description: "Enterprise-grade email and calendar APIs"
    },
    {
      name: "Apollo",
      description: "Company data enrichment and prospecting"
    }
  ];

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
              <Link href="/features" className="text-white font-medium">Features</Link>
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
      <section className="relative pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
              <Rocket className="w-4 h-4 mr-2" />
              Complete Sales Automation Platform
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
              <span className="text-white">Every Feature You Need to</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Automate Sales</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
              From visitor identification to meeting booking, ConnectLead provides a complete suite of AI-powered tools 
              to replace your entire sales development process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '300ms'}}>
              <Link href="/signup">
                <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-violet-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 py-6 text-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Core Features
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Identify, engage, and convert prospects automatically
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300 hover-lift"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-xl border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <IconComponent className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Automation Features */}
      <section className="relative py-20 bg-gradient-to-b from-transparent via-violet-600/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              <Zap className="w-4 h-4 mr-2" />
              Automation
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Advanced Automation
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Set it and forget it - our AI handles the complex sales workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {automationFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="group bg-white/[0.02] rounded-2xl border border-white/10 p-8 hover:border-cyan-500/30 transition-all duration-300 hover-lift">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-xl border border-cyan-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <IconComponent className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <Brain className="w-4 h-4 mr-2" />
              Integrations
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Powerful Integrations
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Connect with the tools you already use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white/[0.02] rounded-xl border border-white/10 p-6 text-center hover:border-emerald-500/30 transition-all duration-300 hover-lift">
                <h3 className="font-semibold text-white mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-400">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl animate-glow-pulse"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to See All Features in Action?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Get a personalized demo and see how ConnectLead can transform your sales process
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-violet-500/25">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 py-6 text-lg">
                    Book a Demo
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
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
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
