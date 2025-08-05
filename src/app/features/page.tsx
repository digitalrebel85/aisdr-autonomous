import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Target, 
  BarChart3, 
  Calendar,
  Mail,
  Users,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  MessageSquare,
  Globe,
  ArrowRight,
  CheckCircle,
  Brain,
  Eye,
  Inbox,
  Phone
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AISDR
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              🚀 Complete Sales Automation Platform
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Every Feature You Need to
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Automate Sales</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From visitor identification to meeting booking, AISDR provides a complete suite of AI-powered tools 
              to replace your entire sales development process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to identify, engage, and convert prospects automatically
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Automation Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Advanced Automation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Set it and forget it - our AI handles the complex sales workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {automationFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Powerful Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with the tools you already use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to See All Features in Action?
            </h2>
            <p className="text-xl text-blue-100">
              Get a personalized demo and see how AISDR can transform your sales process
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                AISDR
              </h3>
              <p className="text-gray-400">
                AI-powered sales development that books more qualified demos automatically.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/saas" className="hover:text-white transition-colors">SaaS Companies</Link></li>
                <li><Link href="/agencies" className="hover:text-white transition-colors">Agencies</Link></li>
                <li><Link href="/enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AISDR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
