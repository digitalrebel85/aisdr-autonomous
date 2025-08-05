'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight,
  Target,
  Users,
  Building2,
  Repeat,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  Star,
  Zap,
  Brain,
  Shield,
  Globe,
  BarChart3,
  Search,
  Filter,
  Rocket
} from 'lucide-react';

export default function SolutionsByUseCasePage() {
  const [selectedUseCase, setSelectedUseCase] = useState('lead-generation');

  const useCases = [
    {
      id: 'lead-generation',
      title: 'Lead Generation',
      icon: Target,
      description: 'Generate high-quality leads at scale',
      color: 'blue'
    },
    {
      id: 'account-based-sales',
      title: 'Account-Based Sales',
      icon: Building2,
      description: 'Target and penetrate key accounts',
      color: 'purple'
    },
    {
      id: 'customer-expansion',
      title: 'Customer Expansion',
      icon: TrendingUp,
      description: 'Grow revenue from existing customers',
      color: 'green'
    },
    {
      id: 'event-follow-up',
      title: 'Event Follow-up',
      icon: Calendar,
      description: 'Convert event leads into opportunities',
      color: 'orange'
    },
    {
      id: 'sales-acceleration',
      title: 'Sales Acceleration',
      icon: Zap,
      description: 'Speed up your sales cycles',
      color: 'red'
    },
    {
      id: 'market-expansion',
      title: 'Market Expansion',
      icon: Globe,
      description: 'Enter new markets and territories',
      color: 'indigo'
    }
  ];

  const useCaseDetails = {
    'lead-generation': {
      title: 'Lead Generation',
      subtitle: 'Generate a consistent pipeline of qualified prospects',
      description: 'Transform your lead generation with AI-powered prospecting that identifies, qualifies, and engages your ideal customers automatically.',
      challenges: [
        'Inconsistent lead quality and volume',
        'Time-consuming manual prospecting',
        'Low response rates from cold outreach',
        'Difficulty identifying buying intent',
        'Scaling personalization efforts'
      ],
      workflow: [
        {
          step: 1,
          title: 'AI Prospect Discovery',
          description: 'AI scans millions of companies to find prospects matching your ideal customer profile',
          icon: Search,
          time: 'Continuous'
        },
        {
          step: 2,
          title: 'Intent Signal Detection',
          description: 'Identify prospects showing buying intent through behavior and company signals',
          icon: Brain,
          time: 'Real-time'
        },
        {
          step: 3,
          title: 'Personalized Outreach',
          description: 'Generate hyper-personalized emails that resonate with each prospect',
          icon: Mail,
          time: '< 1 minute'
        },
        {
          step: 4,
          title: 'Multi-Channel Follow-up',
          description: 'Coordinate follow-up across email, LinkedIn, and phone automatically',
          icon: Repeat,
          time: 'Automated'
        }
      ],
      results: [
        { metric: '5x More Qualified Leads', description: 'AI identifies prospects with 95% accuracy' },
        { metric: '85% Time Savings', description: 'Automate manual prospecting tasks' },
        { metric: '4x Higher Response Rates', description: 'Personalized messaging drives engagement' },
        { metric: '60% Faster Pipeline Growth', description: 'Consistent lead flow accelerates growth' }
      ],
      features: [
        'AI-powered prospect discovery',
        'Intent data integration',
        'Personalized email generation',
        'Multi-channel orchestration',
        'Real-time lead scoring',
        'Automated follow-up sequences'
      ],
      testimonial: {
        quote: "ConnectLead transformed our lead generation. We went from 20 qualified leads per month to over 100, with much higher quality prospects.",
        author: "Sarah Chen",
        title: "VP of Sales",
        company: "TechFlow SaaS"
      }
    },
    'account-based-sales': {
      title: 'Account-Based Sales',
      subtitle: 'Penetrate target accounts with coordinated, multi-stakeholder campaigns',
      description: 'Execute sophisticated account-based sales strategies with AI-powered research, stakeholder mapping, and coordinated multi-touch campaigns.',
      challenges: [
        'Difficulty identifying all decision makers',
        'Coordinating outreach across stakeholders',
        'Personalizing at account level',
        'Long enterprise sales cycles',
        'Competing for executive attention'
      ],
      workflow: [
        {
          step: 1,
          title: 'Account Intelligence',
          description: 'Deep research on target accounts including org charts, initiatives, and pain points',
          icon: Building2,
          time: '< 5 minutes'
        },
        {
          step: 2,
          title: 'Stakeholder Mapping',
          description: 'Identify all decision makers and influencers within the target account',
          icon: Users,
          time: 'Automated'
        },
        {
          step: 3,
          title: 'Coordinated Campaigns',
          description: 'Multi-stakeholder campaigns with account-specific messaging',
          icon: Target,
          time: 'Orchestrated'
        },
        {
          step: 4,
          title: 'Executive Engagement',
          description: 'AI-crafted executive-level messaging that gets C-suite attention',
          icon: Shield,
          time: 'Strategic'
        }
      ],
      results: [
        { metric: '3x Account Penetration', description: 'Reach more stakeholders per account' },
        { metric: '45% Faster Deal Cycles', description: 'Coordinated approach accelerates decisions' },
        { metric: '2x Executive Meetings', description: 'AI messaging resonates with C-suite' },
        { metric: '180% Larger Deal Sizes', description: 'Multi-stakeholder buy-in increases value' }
      ],
      features: [
        'Account intelligence & research',
        'Stakeholder identification',
        'Org chart mapping',
        'Multi-stakeholder campaigns',
        'Executive-level messaging',
        'Account-based analytics'
      ],
      testimonial: {
        quote: "Our enterprise deal velocity improved by 45% using ConnectLead's account-based approach. We're now reaching C-level executives we could never access before.",
        author: "Jennifer Walsh",
        title: "Chief Revenue Officer",
        company: "Enterprise Solutions Corp"
      }
    },
    'customer-expansion': {
      title: 'Customer Expansion',
      subtitle: 'Grow revenue from your existing customer base',
      description: 'Identify expansion opportunities within your customer base and execute targeted campaigns to drive upsells, cross-sells, and renewals.',
      challenges: [
        'Identifying expansion opportunities',
        'Timing outreach for renewals',
        'Cross-selling to new departments',
        'Maintaining customer relationships',
        'Proving additional value'
      ],
      workflow: [
        {
          step: 1,
          title: 'Usage Analytics',
          description: 'Analyze customer usage patterns to identify expansion signals',
          icon: BarChart3,
          time: 'Continuous'
        },
        {
          step: 2,
          title: 'Opportunity Scoring',
          description: 'AI scores expansion opportunities based on usage, growth, and behavior',
          icon: Target,
          time: 'Real-time'
        },
        {
          step: 3,
          title: 'Expansion Campaigns',
          description: 'Targeted campaigns for upsells, cross-sells, and new department penetration',
          icon: TrendingUp,
          time: 'Automated'
        },
        {
          step: 4,
          title: 'Renewal Management',
          description: 'Proactive renewal campaigns with value reinforcement messaging',
          icon: Repeat,
          time: 'Scheduled'
        }
      ],
      results: [
        { metric: '40% Revenue Growth', description: 'From existing customer base' },
        { metric: '95% Renewal Rate', description: 'Proactive renewal management' },
        { metric: '3x Cross-sell Success', description: 'AI identifies perfect timing' },
        { metric: '25% Larger Contracts', description: 'Expansion opportunities captured' }
      ],
      features: [
        'Customer usage analytics',
        'Expansion opportunity scoring',
        'Renewal risk detection',
        'Cross-sell campaign automation',
        'Value reinforcement messaging',
        'Customer success integration'
      ],
      testimonial: {
        quote: "ConnectLead helped us grow our existing customer revenue by 40% in one year. The expansion opportunities it identified were spot-on.",
        author: "Marcus Rodriguez",
        title: "VP of Customer Success",
        company: "Growth SaaS Co"
      }
    },
    'event-follow-up': {
      title: 'Event Follow-up',
      subtitle: 'Convert trade show and event leads into qualified opportunities',
      description: 'Maximize ROI from events with AI-powered lead qualification and personalized follow-up campaigns that convert attendees into customers.',
      challenges: [
        'Overwhelming volume of event leads',
        'Qualifying leads quickly',
        'Personalizing follow-up at scale',
        'Competing with other vendors',
        'Proving event ROI'
      ],
      workflow: [
        {
          step: 1,
          title: 'Lead Import & Enrichment',
          description: 'Import event leads and enrich with company and contact data',
          icon: Filter,
          time: '< 1 hour'
        },
        {
          step: 2,
          title: 'AI Lead Scoring',
          description: 'Score leads based on company fit, role, and engagement signals',
          icon: Brain,
          time: 'Instant'
        },
        {
          step: 3,
          title: 'Personalized Follow-up',
          description: 'AI generates personalized follow-up referencing specific event interactions',
          icon: Mail,
          time: '< 24 hours'
        },
        {
          step: 4,
          title: 'Meeting Scheduling',
          description: 'Automated meeting scheduling with qualified prospects',
          icon: Calendar,
          time: 'Automated'
        }
      ],
      results: [
        { metric: '10x Faster Follow-up', description: 'Reach out within hours, not weeks' },
        { metric: '5x Meeting Conversion', description: 'Personalized approach drives meetings' },
        { metric: '300% Event ROI', description: 'Convert more leads to customers' },
        { metric: '90% Lead Coverage', description: 'Follow up with every qualified lead' }
      ],
      features: [
        'Event lead import & enrichment',
        'AI lead scoring & prioritization',
        'Event-specific personalization',
        'Automated follow-up sequences',
        'Meeting scheduling integration',
        'Event ROI tracking'
      ],
      testimonial: {
        quote: "After implementing ConnectLead for event follow-up, our trade show ROI increased by 300%. We're now converting leads we used to lose.",
        author: "David Kim",
        title: "Marketing Director",
        company: "EventTech Solutions"
      }
    },
    'sales-acceleration': {
      title: 'Sales Acceleration',
      subtitle: 'Speed up your sales cycles and close deals faster',
      description: 'Accelerate every stage of your sales process with AI-powered insights, automated follow-up, and intelligent deal progression.',
      challenges: [
        'Long sales cycles',
        'Deals stalling in pipeline',
        'Inconsistent follow-up',
        'Missing buying signals',
        'Poor deal visibility'
      ],
      workflow: [
        {
          step: 1,
          title: 'Deal Intelligence',
          description: 'AI analyzes deal progression and identifies acceleration opportunities',
          icon: Brain,
          time: 'Real-time'
        },
        {
          step: 2,
          title: 'Buying Signal Detection',
          description: 'Detect and act on buying signals from prospects and accounts',
          icon: Zap,
          time: 'Instant'
        },
        {
          step: 3,
          title: 'Automated Nurturing',
          description: 'Keep deals moving with intelligent, timely follow-up',
          icon: Repeat,
          time: 'Continuous'
        },
        {
          step: 4,
          title: 'Close Acceleration',
          description: 'AI-powered recommendations to accelerate deal closure',
          icon: Target,
          time: 'Strategic'
        }
      ],
      results: [
        { metric: '45% Faster Sales Cycles', description: 'Accelerate deal progression' },
        { metric: '35% Higher Win Rates', description: 'Better timing and messaging' },
        { metric: '60% More Pipeline Velocity', description: 'Deals move faster through stages' },
        { metric: '25% Larger Deal Sizes', description: 'Optimize deal value' }
      ],
      features: [
        'Deal progression analytics',
        'Buying signal detection',
        'Automated deal nurturing',
        'Pipeline velocity tracking',
        'Close probability scoring',
        'Next best action recommendations'
      ],
      testimonial: {
        quote: "ConnectLead cut our average sales cycle from 6 months to 3.5 months. Our team is closing deals faster than ever before.",
        author: "Lisa Thompson",
        title: "Sales Director",
        company: "AccelSales Inc"
      }
    },
    'market-expansion': {
      title: 'Market Expansion',
      subtitle: 'Successfully enter new markets and territories',
      description: 'Expand into new markets with confidence using AI-powered market research, localized messaging, and territory-specific campaigns.',
      challenges: [
        'Understanding new market dynamics',
        'Localizing messaging and approach',
        'Identifying key players',
        'Building market presence',
        'Competing with established players'
      ],
      workflow: [
        {
          step: 1,
          title: 'Market Intelligence',
          description: 'AI research on market dynamics, competitors, and opportunities',
          icon: Globe,
          time: '< 1 week'
        },
        {
          step: 2,
          title: 'Localization Strategy',
          description: 'Adapt messaging and approach for local market preferences',
          icon: Target,
          time: 'Customized'
        },
        {
          step: 3,
          title: 'Territory Campaigns',
          description: 'Launch targeted campaigns with market-specific messaging',
          icon: Rocket,
          time: 'Coordinated'
        },
        {
          step: 4,
          title: 'Market Penetration',
          description: 'Build presence and establish relationships in new territory',
          icon: Building2,
          time: 'Progressive'
        }
      ],
      results: [
        { metric: '3x Faster Market Entry', description: 'Accelerate expansion timeline' },
        { metric: '70% Higher Local Response', description: 'Localized messaging resonates' },
        { metric: '2x Market Share Growth', description: 'Establish strong market position' },
        { metric: '50% Lower Expansion Costs', description: 'Efficient market entry' }
      ],
      features: [
        'Market research & intelligence',
        'Competitive landscape analysis',
        'Localized messaging & campaigns',
        'Territory-specific targeting',
        'Market penetration tracking',
        'Local compliance management'
      ],
      testimonial: {
        quote: "ConnectLead enabled us to successfully expand into 3 new markets in 6 months. The localized approach was key to our success.",
        author: "Robert Chen",
        title: "VP of International Sales",
        company: "GlobalTech Corp"
      }
    }
  };

  const currentUseCase = useCaseDetails[selectedUseCase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Solutions by Use Case
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              AI Sales Development for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Every Scenario</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how ConnectLead solves your specific sales challenges with purpose-built AI workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Use Case Selector */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => {
              const IconComponent = useCase.icon;
              const isSelected = selectedUseCase === useCase.id;
              return (
                <Card 
                  key={useCase.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedUseCase(useCase.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      useCase.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      useCase.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      useCase.color === 'green' ? 'bg-green-100 text-green-600' :
                      useCase.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                      useCase.color === 'red' ? 'bg-red-100 text-red-600' :
                      'bg-indigo-100 text-indigo-600'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                    <p className="text-sm text-gray-600">{useCase.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Case Details */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {currentUseCase.subtitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              {currentUseCase.description}
            </p>
          </div>

          {/* Challenges & Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Challenges */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Common Challenges</h3>
              <div className="space-y-4">
                {currentUseCase.challenges.map((challenge, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                    <p className="text-gray-700">{challenge}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">AI-Powered Workflow</h3>
              <div className="space-y-6">
                {currentUseCase.workflow.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {step.time}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Expected Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentUseCase.results.map((result, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{result.metric}</div>
                      <div className="text-gray-600">{result.description}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Key Features for {currentUseCase.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentUseCase.features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-md">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">{feature}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 mb-20">
            <CardContent className="p-12 text-center">
              <div className="max-w-4xl mx-auto">
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-6" />
                <blockquote className="text-2xl text-gray-700 italic mb-8">
                  "{currentUseCase.testimonial.quote}"
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUseCase.testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{currentUseCase.testimonial.author}</div>
                    <div className="text-gray-600">{currentUseCase.testimonial.title}</div>
                    <div className="text-sm text-gray-500">{currentUseCase.testimonial.company}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Ready to Optimize Your {currentUseCase.title}?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                See how ConnectLead can transform your specific use case with AI-powered automation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    Book Custom Demo
                    <Calendar className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600">
                14-day free trial • No credit card required • Custom setup for your use case
              </p>
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
                ConnectLead
              </h3>
              <p className="text-gray-400">
                AI-powered sales development for every use case and scenario.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/solutions/by-role" className="hover:text-white transition-colors">By Role</Link></li>
                <li><Link href="/solutions/by-size" className="hover:text-white transition-colors">By Company Size</Link></li>
                <li><Link href="/solutions/by-use-case" className="hover:text-white transition-colors">By Use Case</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
                <li><Link href="/roi-calculator" className="hover:text-white transition-colors">ROI Calculator</Link></li>
                <li><Link href="/compare/apollo" className="hover:text-white transition-colors">vs Apollo</Link></li>
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
