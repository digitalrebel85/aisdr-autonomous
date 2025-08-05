'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight,
  Users,
  Building2,
  Rocket,
  Shield,
  CheckCircle,
  Star,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Settings,
  Brain,
  Mail,
  Globe,
  Lock
} from 'lucide-react';

export default function SolutionsBySizePage() {
  const [selectedSize, setSelectedSize] = useState('startup');

  const companySizes = [
    {
      id: 'startup',
      title: 'Startups',
      subtitle: '1-50 employees',
      icon: Rocket,
      description: 'Fast growth with limited resources',
      color: 'green'
    },
    {
      id: 'smb',
      title: 'Small & Medium Business',
      subtitle: '50-500 employees',
      icon: Building2,
      description: 'Scaling operations and processes',
      color: 'blue'
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      subtitle: '500+ employees',
      icon: Shield,
      description: 'Complex needs and compliance requirements',
      color: 'purple'
    }
  ];

  const sizeDetails = {
    'startup': {
      title: 'Startups',
      subtitle: 'Launch faster, grow smarter, compete with giants',
      description: 'ConnectLead gives startups the sales development power of a Fortune 500 company at a fraction of the cost. Get your first customers faster and achieve product-market fit with AI-powered outreach.',
      keyNeeds: [
        'Limited budget for sales team',
        'Need to prove product-market fit quickly',
        'Founders wearing multiple hats',
        'Competing against established players',
        'Rapid iteration and testing required'
      ],
      solutions: [
        {
          title: 'Instant Sales Team',
          description: 'Get a full sales development team for the cost of one junior SDR. Start generating leads from day one.',
          icon: Users,
          benefits: ['90% cost savings vs hiring', 'Immediate lead generation', 'No training required'],
          pricing: 'Starting at $99/month'
        },
        {
          title: 'Product-Market Fit Acceleration',
          description: 'Rapidly test messaging and identify ideal customer profiles with AI-powered A/B testing.',
          icon: Target,
          benefits: ['Faster PMF discovery', 'Data-driven messaging', 'Rapid iteration cycles'],
          pricing: 'Built into all plans'
        },
        {
          title: 'Founder-Friendly Setup',
          description: 'Get up and running in 15 minutes with no technical setup. Focus on building, not prospecting.',
          icon: Rocket,
          benefits: ['15-minute setup', 'No technical skills needed', 'Founder time savings'],
          pricing: 'Free setup & onboarding'
        },
        {
          title: 'Competitive Intelligence',
          description: 'Monitor competitor moves and market opportunities to stay ahead despite resource constraints.',
          icon: Brain,
          benefits: ['Market opportunity alerts', 'Competitor monitoring', 'Strategic advantages'],
          pricing: 'Available on Growth plan'
        }
      ],
      metrics: [
        { label: 'Time to First Customer', value: '3 weeks', icon: Clock },
        { label: 'Cost vs Hiring SDR', value: '-90%', icon: DollarSign },
        { label: 'Founder Time Saved', value: '40 hrs/week', icon: Users },
        { label: 'Pipeline Growth', value: '500%', icon: TrendingUp }
      ],
      testimonial: {
        quote: "ConnectLead was a game-changer for our startup. We got our first 10 customers in 6 weeks and achieved product-market fit faster than we ever imagined.",
        author: "David Kim",
        title: "Co-Founder & CEO",
        company: "InnovateTech",
        results: "First paying customer in 3 weeks, $100K ARR in 6 months"
      },
      caseStudy: {
        company: "TechStart",
        industry: "SaaS",
        challenge: "Bootstrapped startup needed customers fast with zero sales budget",
        result: "Generated $250K ARR in first year with 95% less cost than traditional sales hiring",
        metrics: ["18 customers in 90 days", "500% ROI in year 1", "2 founders saved 60 hrs/week"]
      },
      pricing: {
        plan: "Startup Plan",
        price: "$99/month",
        features: ["Up to 1,000 prospects/month", "AI email generation", "Basic analytics", "Email support"]
      }
    },
    'smb': {
      title: 'Small & Medium Business',
      subtitle: 'Scale efficiently without scaling headcount',
      description: 'ConnectLead helps SMBs compete with enterprise companies by automating sales development processes and maximizing team productivity. Scale your revenue without proportionally scaling your costs.',
      keyNeeds: [
        'Need to scale revenue efficiently',
        'Limited sales development resources',
        'Competing with larger companies',
        'Process standardization requirements',
        'ROI accountability and measurement'
      ],
      solutions: [
        {
          title: 'Revenue Team Amplification',
          description: 'Multiply your existing sales team\'s output with AI-powered lead generation and qualification.',
          icon: Users,
          benefits: ['3x team productivity', 'Consistent performance', 'Scalable processes'],
          pricing: 'Growth plan recommended'
        },
        {
          title: 'Process Standardization',
          description: 'Implement consistent, repeatable sales processes that work across your entire organization.',
          icon: Settings,
          benefits: ['Standardized messaging', 'Consistent quality', 'Predictable results'],
          pricing: 'Included in Growth plan'
        },
        {
          title: 'Multi-Channel Orchestration',
          description: 'Coordinate email, LinkedIn, and phone outreach across multiple team members and campaigns.',
          icon: Globe,
          benefits: ['Multi-channel reach', 'Coordinated messaging', 'Higher response rates'],
          pricing: 'Professional plan feature'
        },
        {
          title: 'Advanced Analytics & Reporting',
          description: 'Get detailed insights into team performance, campaign effectiveness, and ROI measurement.',
          icon: BarChart3,
          benefits: ['Team performance insights', 'Campaign optimization', 'ROI measurement'],
          pricing: 'Professional plan feature'
        }
      ],
      metrics: [
        { label: 'Revenue Growth', value: '+180%', icon: TrendingUp },
        { label: 'Team Productivity', value: '+250%', icon: Users },
        { label: 'Cost per Lead', value: '-65%', icon: DollarSign },
        { label: 'Sales Cycle', value: '-30%', icon: Clock }
      ],
      testimonial: {
        quote: "ConnectLead helped us scale from $2M to $8M ARR without adding a single SDR. Our existing team is now 3x more productive.",
        author: "Sarah Chen",
        title: "VP of Sales",
        company: "TechFlow SaaS",
        results: "300% revenue growth with same team size"
      },
      caseStudy: {
        company: "GrowthCorp",
        industry: "B2B Services",
        challenge: "50-person company needed to triple revenue without tripling sales headcount",
        result: "Achieved 280% revenue growth with only 50% increase in sales team",
        metrics: ["$2M to $7.6M ARR", "15 to 23 sales team members", "65% improvement in efficiency"]
      },
      pricing: {
        plan: "Professional Plan",
        price: "$299/month",
        features: ["Up to 5,000 prospects/month", "Multi-channel campaigns", "Advanced analytics", "Priority support"]
      }
    },
    'enterprise': {
      title: 'Enterprise',
      subtitle: 'Enterprise-grade AI sales development at scale',
      description: 'ConnectLead provides enterprise organizations with the security, compliance, and scalability needed for large-scale sales development operations while maintaining the agility to adapt quickly to market changes.',
      keyNeeds: [
        'Security and compliance requirements',
        'Large-scale coordination across teams',
        'Integration with existing tech stack',
        'Advanced customization and control',
        'Dedicated support and success management'
      ],
      solutions: [
        {
          title: 'Enterprise Security & Compliance',
          description: 'SOC 2 Type II, GDPR compliance, SSO integration, and enterprise-grade security controls.',
          icon: Shield,
          benefits: ['SOC 2 compliance', 'SSO integration', 'Advanced permissions'],
          pricing: 'Enterprise plan feature'
        },
        {
          title: 'Advanced Integrations',
          description: 'Deep integrations with Salesforce, HubSpot, Microsoft, and custom APIs for seamless workflows.',
          icon: Settings,
          benefits: ['Salesforce sync', 'Custom integrations', 'Workflow automation'],
          pricing: 'Custom integration available'
        },
        {
          title: 'Multi-Team Orchestration',
          description: 'Coordinate sales development across multiple teams, regions, and business units with centralized control.',
          icon: Globe,
          benefits: ['Multi-team coordination', 'Centralized governance', 'Regional customization'],
          pricing: 'Enterprise plan feature'
        },
        {
          title: 'Dedicated Success Management',
          description: 'White-glove onboarding, dedicated customer success manager, and strategic consulting services.',
          icon: Users,
          benefits: ['Dedicated CSM', 'Strategic consulting', 'Priority support'],
          pricing: 'Included in Enterprise'
        }
      ],
      metrics: [
        { label: 'Enterprise Accounts Closed', value: '+150%', icon: Building2 },
        { label: 'Compliance Score', value: '100%', icon: Shield },
        { label: 'Team Coordination', value: '+200%', icon: Users },
        { label: 'Integration Efficiency', value: '+300%', icon: Settings }
      ],
      testimonial: {
        quote: "ConnectLead's enterprise features allowed us to standardize sales development across 12 global offices while maintaining local customization. The results have been extraordinary.",
        author: "Jennifer Walsh",
        title: "Chief Revenue Officer",
        company: "Global Enterprise Corp",
        results: "Standardized processes across 12 offices, 40% increase in global pipeline"
      },
      caseStudy: {
        company: "Fortune 500 Tech",
        industry: "Enterprise Software",
        challenge: "Needed to coordinate sales development across 15 global teams with strict compliance requirements",
        result: "Unified global sales development with 45% increase in qualified pipeline",
        metrics: ["15 teams coordinated", "45% pipeline increase", "100% compliance maintained"]
      },
      pricing: {
        plan: "Enterprise Plan",
        price: "Custom pricing",
        features: ["Unlimited prospects", "Custom integrations", "Dedicated CSM", "SLA guarantees"]
      }
    }
  };

  const currentSize = sizeDetails[selectedSize];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Solutions by Company Size
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Right-Sized AI Sales Development for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Every Stage</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From startup to enterprise, ConnectLead scales with your business needs and growth stage.
            </p>
          </div>
        </div>
      </section>

      {/* Size Selector */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {companySizes.map((size) => {
              const IconComponent = size.icon;
              const isSelected = selectedSize === size.id;
              return (
                <Card 
                  key={size.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedSize(size.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      size.color === 'green' ? 'bg-green-100 text-green-600' :
                      size.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{size.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{size.subtitle}</p>
                    <p className="text-sm text-gray-600">{size.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Size Details */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {currentSize.subtitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              {currentSize.description}
            </p>
          </div>

          {/* Key Needs & Solutions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Key Needs */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Key Challenges</h3>
              <div className="space-y-4">
                {currentSize.keyNeeds.map((need, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    </div>
                    <p className="text-gray-700">{need}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Tailored Solutions</h3>
              <div className="space-y-6">
                {currentSize.solutions.map((solution, index) => {
                  const IconComponent = solution.icon;
                  return (
                    <Card key={index} className="border-0 shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{solution.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {solution.pricing}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{solution.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {solution.benefits.map((benefit, benefitIndex) => (
                                <div key={benefitIndex} className="flex items-center space-x-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-gray-600">{benefit}</span>
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
          </div>

          {/* Metrics */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Results for {currentSize.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentSize.metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg text-center">
                    <CardContent className="p-6">
                      <IconComponent className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</div>
                      <div className="text-sm text-gray-600">{metric.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Case Study */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Testimonial */}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-8">
                <Star className="h-8 w-8 text-yellow-500 mb-6" />
                <blockquote className="text-lg text-gray-700 italic mb-6">
                  "{currentSize.testimonial.quote}"
                </blockquote>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentSize.testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{currentSize.testimonial.author}</div>
                    <div className="text-gray-600">{currentSize.testimonial.title}</div>
                    <div className="text-sm text-gray-500">{currentSize.testimonial.company}</div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {currentSize.testimonial.results}
                </Badge>
              </CardContent>
            </Card>

            {/* Case Study */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Success Story</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">{currentSize.caseStudy.company}</h5>
                    <Badge variant="outline">{currentSize.caseStudy.industry}</Badge>
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-700 mb-1">Challenge</h6>
                    <p className="text-gray-600 text-sm">{currentSize.caseStudy.challenge}</p>
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-700 mb-1">Result</h6>
                    <p className="text-gray-600 text-sm">{currentSize.caseStudy.result}</p>
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Key Metrics</h6>
                    <div className="space-y-2">
                      {currentSize.caseStudy.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-blue-50 mb-20">
            <CardContent className="p-12 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Recommended for {currentSize.title}
              </h3>
              <div className="max-w-md mx-auto">
                <div className="text-4xl font-bold text-blue-600 mb-2">{currentSize.pricing.price}</div>
                <div className="text-lg font-semibold text-gray-900 mb-6">{currentSize.pricing.plan}</div>
                <div className="space-y-2 mb-8">
                  {currentSize.pricing.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <Link href="/signup">
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button variant="outline" size="lg" className="w-full">
                      Book Demo
                      <Calendar className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Ready to Scale Your {currentSize.title}?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join thousands of companies using ConnectLead to accelerate their sales development and achieve predictable growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    View All Plans
                    <DollarSign className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600">
                14-day free trial • No credit card required • Cancel anytime
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
                AI-powered sales development that scales with your business.
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
