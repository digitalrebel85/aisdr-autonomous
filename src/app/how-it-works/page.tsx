import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight,
  CheckCircle,
  Play,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Zap,
  Target,
  Bot,
  MessageSquare,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  Database,
  Brain,
  Workflow
} from 'lucide-react';

export default function HowItWorksPage() {
  const processSteps = [
    {
      step: "01",
      title: "Connect Your Tools",
      description: "Integrate ConnectLead with your CRM, email platforms, and existing sales tools in minutes.",
      details: [
        "One-click integrations with HubSpot, Salesforce, Pipedrive",
        "Email platform connections (Gmail, Outlook, SendGrid)",
        "Calendar integration for automatic meeting booking",
        "Webhook setup for real-time data sync"
      ],
      icon: Globe,
      time: "5 minutes"
    },
    {
      step: "02", 
      title: "AI Learns Your Business",
      description: "Our AI agents analyze your ideal customer profile and successful outreach patterns.",
      details: [
        "Upload your existing prospect lists and successful emails",
        "AI analyzes your best-performing messaging patterns",
        "Machine learning identifies your ideal customer signals",
        "Custom AI training based on your industry and use case"
      ],
      icon: Brain,
      time: "15 minutes"
    },
    {
      step: "03",
      title: "Automated Lead Discovery",
      description: "ConnectLead continuously finds and enriches high-quality prospects using intent data.",
      details: [
        "Real-time visitor tracking on your website",
        "Intent data analysis from multiple sources",
        "Company and contact enrichment with 95% accuracy",
        "Buying signal detection and lead scoring"
      ],
      icon: Target,
      time: "Continuous"
    },
    {
      step: "04",
      title: "Personalized Outreach",
      description: "AI writes and sends highly personalized emails that get responses, not spam folders.",
      details: [
        "GPT-4 powered personalization based on prospect data",
        "Industry-specific messaging and pain points",
        "A/B testing of subject lines and content",
        "Deliverability optimization and inbox warming"
      ],
      icon: Mail,
      time: "Automated"
    },
    {
      step: "05",
      title: "Intelligent Follow-ups",
      description: "Smart sequences adapt based on prospect engagement and automatically handle replies.",
      details: [
        "Dynamic follow-up timing based on engagement",
        "AI-powered reply classification and routing",
        "Automatic meeting booking for qualified prospects",
        "Escalation to human reps when appropriate"
      ],
      icon: Bot,
      time: "24/7"
    },
    {
      step: "06",
      title: "Results & Optimization",
      description: "Track performance, analyze results, and continuously improve your sales development ROI.",
      details: [
        "Real-time analytics and conversion tracking",
        "A/B testing insights and recommendations",
        "ROI reporting and pipeline attribution",
        "Continuous AI optimization based on results"
      ],
      icon: TrendingUp,
      time: "Ongoing"
    }
  ];

  const keyFeatures = [
    {
      title: "Intent Data Intelligence",
      description: "Identify prospects showing buying signals across the web",
      icon: Database,
      benefits: ["Higher conversion rates", "Shorter sales cycles", "Better lead quality"]
    },
    {
      title: "AI-Powered Personalization", 
      description: "Generate unique, relevant messages for every prospect",
      icon: Brain,
      benefits: ["3x higher response rates", "Reduced spam complaints", "Authentic messaging"]
    },
    {
      title: "Automated Workflows",
      description: "End-to-end automation from discovery to meeting booking",
      icon: Workflow,
      benefits: ["70% cost reduction", "24/7 operation", "Scalable growth"]
    },
    {
      title: "Smart Analytics",
      description: "Deep insights into what's working and what needs improvement",
      icon: BarChart3,
      benefits: ["Data-driven decisions", "Continuous optimization", "Clear ROI tracking"]
    }
  ];

  const results = [
    { metric: "3x", label: "More Qualified Demos", description: "Compared to traditional SDR teams" },
    { metric: "70%", label: "Cost Reduction", description: "Lower than hiring and training SDRs" },
    { metric: "95%", label: "Data Accuracy", description: "Real-time prospect enrichment" },
    { metric: "24/7", label: "Operation", description: "Never miss an opportunity" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              How It Works
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              From Setup to Success
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> in 6 Simple Steps</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See exactly how ConnectLead transforms your sales development process with AI automation that actually works.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  See Live Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {processSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:grid-flow-col-dense'}`}>
                  {/* Content */}
                  <div className={`space-y-6 ${isEven ? '' : 'lg:col-start-2'}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">{step.step}</span>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.time}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-3xl font-bold text-gray-900">{step.title}</h3>
                      <p className="text-xl text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                    
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Visual */}
                  <div className={`${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                    <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="p-12 text-center">
                        <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <IconComponent className="h-12 w-12 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h4>
                        <p className="text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The technology behind ConnectLead that makes it all possible
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {keyFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                          <p className="text-gray-600">{feature.description}</p>
                        </div>
                        <div className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              The Results Speak for Themselves
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real metrics from companies using ConnectLead
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {results.map((result, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">
                    {result.metric}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {result.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.description}
                  </div>
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
              Ready to Transform Your Sales Development?
            </h2>
            <p className="text-xl text-blue-100">
              Join 200+ companies already using ConnectLead to automate their SDR processes and book 3x more qualified demos.
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
                  Book Live Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-200">
              14-day free trial • No credit card required • Setup in 30 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ConnectLead
              </h3>
              <p className="text-gray-400">
                AI-powered sales development that books more qualified demos automatically.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
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
            <p>&copy; 2025 ConnectLead. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
