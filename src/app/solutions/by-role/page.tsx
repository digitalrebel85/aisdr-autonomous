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
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Zap,
  CheckCircle,
  Star,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Mail,
  Brain,
  Shield,
  Rocket
} from 'lucide-react';

export default function SolutionsByRolePage() {
  const [selectedRole, setSelectedRole] = useState('sales-teams');

  const roles = [
    {
      id: 'sales-teams',
      title: 'Sales Teams',
      icon: Target,
      description: 'Accelerate pipeline generation and close more deals',
      color: 'blue'
    },
    {
      id: 'marketing',
      title: 'Marketing Teams',
      icon: TrendingUp,
      description: 'Generate qualified leads and improve attribution',
      color: 'green'
    },
    {
      id: 'revops',
      title: 'Revenue Operations',
      icon: BarChart3,
      description: 'Optimize processes and maximize revenue efficiency',
      color: 'purple'
    },
    {
      id: 'executives',
      title: 'Sales Executives',
      icon: Users,
      description: 'Scale revenue growth without scaling headcount',
      color: 'orange'
    }
  ];

  const roleDetails = {
    'sales-teams': {
      title: 'Sales Teams',
      subtitle: 'Turn your sales team into a lead generation powerhouse',
      description: 'ConnectLead empowers sales teams to focus on what they do best - closing deals - while AI handles the heavy lifting of lead generation and initial outreach.',
      challenges: [
        'Spending too much time on prospecting instead of selling',
        'Inconsistent outreach quality across team members',
        'Difficulty reaching decision makers',
        'Low response rates from cold outreach',
        'Manual follow-up processes that leads slip through'
      ],
      solutions: [
        {
          title: 'AI-Powered Prospecting',
          description: 'Automatically identify and prioritize high-intent prospects using AI analysis of company signals and buyer behavior.',
          icon: Brain,
          benefits: ['3x more qualified leads', '85% time savings on research', 'Higher conversion rates']
        },
        {
          title: 'Personalized Outreach at Scale',
          description: 'Generate hyper-personalized emails that sound human and drive responses, customized for each prospect.',
          icon: Mail,
          benefits: ['4x higher response rates', 'Consistent messaging quality', 'Brand-compliant communications']
        },
        {
          title: 'Intelligent Follow-up Sequences',
          description: 'Never let a lead go cold with AI-driven follow-up timing and messaging based on engagement signals.',
          icon: Clock,
          benefits: ['35% more meetings booked', 'Zero leads slip through cracks', 'Optimal timing for each prospect']
        },
        {
          title: 'Real-time Sales Intelligence',
          description: 'Get instant insights on prospect behavior, company changes, and buying signals to time your outreach perfectly.',
          icon: Zap,
          benefits: ['Perfect timing on outreach', 'Higher close rates', 'Competitive advantage']
        }
      ],
      metrics: [
        { label: 'More Qualified Meetings', value: '3.2x', icon: Calendar },
        { label: 'Time Saved on Prospecting', value: '85%', icon: Clock },
        { label: 'Increase in Response Rate', value: '4x', icon: MessageSquare },
        { label: 'Faster Deal Velocity', value: '45%', icon: TrendingUp }
      ],
      testimonial: {
        quote: "ConnectLead transformed our sales process. Our reps are now spending 80% of their time selling instead of prospecting, and our pipeline has tripled.",
        author: "Sarah Chen",
        title: "VP of Sales, TechFlow",
        company: "TechFlow SaaS"
      },
      cta: {
        primary: "Start Free Trial",
        secondary: "Book Sales Demo"
      }
    },
    'marketing': {
      title: 'Marketing Teams',
      subtitle: 'Generate pipeline and prove marketing ROI with precision',
      description: 'ConnectLead bridges the gap between marketing and sales by turning marketing qualified leads into sales qualified opportunities through intelligent nurturing and outreach.',
      challenges: [
        'Low MQL to SQL conversion rates',
        'Difficulty proving marketing ROI',
        'Leads going cold between handoff to sales',
        'Inconsistent lead scoring and qualification',
        'Poor attribution and tracking of marketing efforts'
      ],
      solutions: [
        {
          title: 'Intelligent Lead Scoring',
          description: 'AI analyzes buyer behavior, company signals, and engagement patterns to score leads with 95% accuracy.',
          icon: Target,
          benefits: ['95% lead scoring accuracy', '60% better SQL conversion', 'Reduced sales friction']
        },
        {
          title: 'Automated Lead Nurturing',
          description: 'Keep leads warm with personalized, timely touchpoints that move prospects through the funnel automatically.',
          icon: Rocket,
          benefits: ['40% faster deal cycles', '3x engagement rates', 'Seamless sales handoff']
        },
        {
          title: 'Attribution & Analytics',
          description: 'Track every touchpoint from first visit to closed deal with complete attribution and ROI measurement.',
          icon: BarChart3,
          benefits: ['Complete attribution tracking', 'Prove marketing ROI', 'Optimize campaign performance']
        },
        {
          title: 'Account-Based Marketing',
          description: 'Coordinate multi-channel ABM campaigns with personalized outreach to key stakeholders at target accounts.',
          icon: Shield,
          benefits: ['Higher account penetration', 'Coordinated messaging', 'Faster enterprise deals']
        }
      ],
      metrics: [
        { label: 'MQL to SQL Conversion', value: '+180%', icon: TrendingUp },
        { label: 'Marketing Attribution', value: '100%', icon: BarChart3 },
        { label: 'Lead Response Time', value: '< 5 min', icon: Clock },
        { label: 'Campaign ROI Increase', value: '250%', icon: DollarSign }
      ],
      testimonial: {
        quote: "Our MQL to SQL conversion rate jumped from 12% to 34% in just 3 months. Finally, we can prove marketing's direct impact on revenue.",
        author: "Marcus Rodriguez",
        title: "CMO, Growth Marketing Co",
        company: "Growth Marketing Agency"
      },
      cta: {
        primary: "Start Free Trial",
        secondary: "Book Marketing Demo"
      }
    },
    'revops': {
      title: 'Revenue Operations',
      subtitle: 'Optimize the entire revenue engine with data-driven insights',
      description: 'ConnectLead provides RevOps teams with the tools and analytics needed to optimize every stage of the revenue process, from lead generation to deal closure.',
      challenges: [
        'Siloed data across sales and marketing tools',
        'Inconsistent processes across teams',
        'Difficulty forecasting and planning',
        'Manual reporting and analysis',
        'Poor visibility into revenue pipeline health'
      ],
      solutions: [
        {
          title: 'Unified Revenue Analytics',
          description: 'Consolidate data from all revenue tools into one dashboard with real-time insights and forecasting.',
          icon: BarChart3,
          benefits: ['Single source of truth', 'Real-time forecasting', 'Automated reporting']
        },
        {
          title: 'Process Automation',
          description: 'Standardize and automate revenue processes to ensure consistency and eliminate manual work.',
          icon: Settings,
          benefits: ['Consistent execution', '70% less manual work', 'Improved data quality']
        },
        {
          title: 'Performance Optimization',
          description: 'AI-powered recommendations to optimize conversion rates, deal velocity, and team performance.',
          icon: TrendingUp,
          benefits: ['Data-driven decisions', 'Continuous optimization', 'Predictable growth']
        },
        {
          title: 'Revenue Intelligence',
          description: 'Advanced analytics and AI insights to identify bottlenecks, opportunities, and growth levers.',
          icon: Brain,
          benefits: ['Identify growth opportunities', 'Predict revenue risks', 'Strategic planning support']
        }
      ],
      metrics: [
        { label: 'Revenue Predictability', value: '+95%', icon: BarChart3 },
        { label: 'Process Efficiency', value: '+70%', icon: Settings },
        { label: 'Forecast Accuracy', value: '98%', icon: Target },
        { label: 'Time to Insights', value: '< 1 min', icon: Clock }
      ],
      testimonial: {
        quote: "ConnectLead gave us the revenue visibility we never had before. Our forecasting accuracy improved from 65% to 98%, and we can now predict growth with confidence.",
        author: "Jennifer Walsh",
        title: "VP of Revenue Operations",
        company: "Enterprise Solutions Corp"
      },
      cta: {
        primary: "Start Free Trial",
        secondary: "Book RevOps Demo"
      }
    },
    'executives': {
      title: 'Sales Executives',
      subtitle: 'Scale revenue growth without scaling headcount',
      description: 'ConnectLead enables sales executives to achieve aggressive growth targets while maintaining lean teams and maximizing ROI on sales investments.',
      challenges: [
        'Pressure to grow revenue with limited budget',
        'Difficulty scaling sales team efficiently',
        'Inconsistent performance across reps',
        'Long sales cycles and unpredictable pipeline',
        'Need for better sales productivity and ROI'
      ],
      solutions: [
        {
          title: 'Revenue Acceleration',
          description: 'AI-powered sales development that generates 3x more qualified pipeline without adding headcount.',
          icon: Rocket,
          benefits: ['3x pipeline growth', '70% cost reduction', 'Faster time to revenue']
        },
        {
          title: 'Predictable Growth',
          description: 'Data-driven insights and automation create consistent, predictable revenue growth you can count on.',
          icon: BarChart3,
          benefits: ['Predictable pipeline', 'Consistent performance', 'Reliable forecasting']
        },
        {
          title: 'Competitive Advantage',
          description: 'Stay ahead of competitors with AI-powered sales intelligence and faster market response.',
          icon: Shield,
          benefits: ['Market leadership', 'Faster deal cycles', 'Higher win rates']
        },
        {
          title: 'Executive Dashboards',
          description: 'Real-time visibility into all revenue metrics with executive-level reporting and insights.',
          icon: BarChart3,
          benefits: ['Complete visibility', 'Strategic insights', 'Board-ready reports']
        }
      ],
      metrics: [
        { label: 'Revenue Growth', value: '+300%', icon: TrendingUp },
        { label: 'Cost per Acquisition', value: '-70%', icon: DollarSign },
        { label: 'Sales Cycle Reduction', value: '-45%', icon: Clock },
        { label: 'Team Productivity', value: '+250%', icon: Users }
      ],
      testimonial: {
        quote: "ConnectLead helped us achieve our most aggressive growth targets while actually reducing our sales development costs. It's been transformational for our business.",
        author: "David Kim",
        title: "Chief Revenue Officer",
        company: "InnovateTech"
      },
      cta: {
        primary: "Schedule Executive Demo",
        secondary: "View ROI Calculator"
      }
    }
  };

  const currentRole = roleDetails[selectedRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Solutions by Role
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              AI Sales Development for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Every Team</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how ConnectLead transforms sales development for your specific role and team needs.
            </p>
          </div>
        </div>
      </section>

      {/* Role Selector */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role) => {
              const IconComponent = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <Card 
                  key={role.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      role.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      role.color === 'green' ? 'bg-green-100 text-green-600' :
                      role.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.title}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Details */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {currentRole.subtitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              {currentRole.description}
            </p>
          </div>

          {/* Challenges & Solutions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Challenges */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Common Challenges</h3>
              <div className="space-y-4">
                {currentRole.challenges.map((challenge, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                    <p className="text-gray-700">{challenge}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">ConnectLead Solutions</h3>
              <div className="space-y-6">
                {currentRole.solutions.map((solution, index) => {
                  const IconComponent = solution.icon;
                  return (
                    <Card key={index} className="border-0 shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{solution.title}</h4>
                            <p className="text-gray-600 mb-3">{solution.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {solution.benefits.map((benefit, benefitIndex) => (
                                <Badge key={benefitIndex} variant="outline" className="text-xs">
                                  {benefit}
                                </Badge>
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
              Results You Can Expect
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentRole.metrics.map((metric, index) => {
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

          {/* Testimonial */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 mb-20">
            <CardContent className="p-12 text-center">
              <div className="max-w-4xl mx-auto">
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-6" />
                <blockquote className="text-2xl text-gray-700 italic mb-8">
                  "{currentRole.testimonial.quote}"
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentRole.testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{currentRole.testimonial.author}</div>
                    <div className="text-gray-600">{currentRole.testimonial.title}</div>
                    <div className="text-sm text-gray-500">{currentRole.testimonial.company}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Ready to Transform Your {currentRole.title}?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg">
                    {currentRole.cta.primary}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    {currentRole.cta.secondary}
                    <Calendar className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600">
                14-day free trial • No credit card required • Setup in minutes
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
                AI-powered sales development that books more qualified demos automatically.
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
