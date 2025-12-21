'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  Play,
  TrendingUp,
  Filter,
  Quote,
  Calendar,
  Target,
  DollarSign,
  Clock,
  ExternalLink,
  Bot,
  Sparkles
} from 'lucide-react';

export default function CaseStudiesPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Industries' },
    { id: 'saas', label: 'SaaS' },
    { id: 'agency', label: 'Agencies' },
    { id: 'enterprise', label: 'Enterprise' },
    { id: 'startup', label: 'Startups' }
  ];

  const caseStudies = [
    {
      id: 1,
      company: "TechFlow SaaS",
      industry: "saas",
      companySize: "50-200 employees",
      logo: "TF",
      challenge: "Struggling to scale outbound sales with limited SDR team",
      solution: "Implemented ConnectLead to automate lead discovery and personalized outreach",
      results: {
        meetings: "300% increase in qualified meetings",
        revenue: "$2.1M additional ARR in 6 months",
        cost: "65% reduction in sales development costs",
        time: "Setup completed in 2 weeks"
      },
      metrics: [
        { label: "Meetings Booked", before: "12/month", after: "48/month", improvement: "+300%" },
        { label: "Response Rate", before: "2.1%", after: "8.7%", improvement: "+314%" },
        { label: "Cost per Meeting", before: "$450", after: "$95", improvement: "-79%" },
        { label: "Time to First Meeting", before: "6 weeks", after: "1 week", improvement: "-83%" }
      ],
      testimonial: {
        quote: "ConnectLead transformed our entire sales development process. We're now booking 4x more qualified meetings with half the manual effort. The ROI was immediate and continues to compound.",
        author: "Sarah Chen",
        title: "VP of Sales",
        avatar: "SC"
      },
      featured: true,
      videoUrl: "#"
    },
    {
      id: 2,
      company: "Growth Marketing Agency",
      industry: "agency",
      companySize: "20-50 employees",
      logo: "GMA",
      challenge: "Managing outreach for multiple clients with inconsistent results",
      solution: "Used ConnectLead's white-label solution for client campaigns",
      results: {
        meetings: "250% increase in client meeting bookings",
        revenue: "$500K new client revenue in Q1",
        cost: "40% reduction in campaign management time",
        time: "Onboarded 5 new clients in 30 days"
      },
      metrics: [
        { label: "Client Meetings", before: "85/month", after: "298/month", improvement: "+251%" },
        { label: "Campaign Setup Time", before: "2 weeks", after: "2 days", improvement: "-86%" },
        { label: "Client Retention", before: "78%", after: "94%", improvement: "+21%" },
        { label: "Profit Margin", before: "22%", after: "38%", improvement: "+73%" }
      ],
      testimonial: {
        quote: "ConnectLead allowed us to scale our agency without hiring more SDRs. Our clients are seeing incredible results, and we're able to take on 3x more accounts.",
        author: "Marcus Rodriguez",
        title: "Agency Founder",
        avatar: "MR"
      },
      featured: false,
      videoUrl: "#"
    },
    {
      id: 3,
      company: "Enterprise Solutions Corp",
      industry: "enterprise",
      companySize: "500+ employees",
      logo: "ESC",
      challenge: "Complex sales cycles and difficulty reaching decision makers",
      solution: "Leveraged ConnectLead's intent data and multi-touch sequences",
      results: {
        meetings: "180% increase in C-level meetings",
        revenue: "$5.2M pipeline generated in Q2",
        cost: "55% faster deal velocity",
        time: "Reduced sales cycle by 3 months"
      },
      metrics: [
        { label: "C-Level Meetings", before: "8/month", after: "22/month", improvement: "+175%" },
        { label: "Pipeline Value", before: "$2.1M", after: "$7.3M", improvement: "+248%" },
        { label: "Sales Cycle", before: "9 months", after: "6 months", improvement: "-33%" },
        { label: "Win Rate", before: "12%", after: "28%", improvement: "+133%" }
      ],
      testimonial: {
        quote: "The intent data and AI personalization helped us break through to executives we could never reach before. Our enterprise sales have completely transformed.",
        author: "Jennifer Walsh",
        title: "Chief Revenue Officer",
        avatar: "JW"
      },
      featured: true,
      videoUrl: "#"
    },
    {
      id: 4,
      company: "InnovateTech Startup",
      industry: "startup",
      companySize: "10-20 employees",
      logo: "IT",
      challenge: "Limited budget and no dedicated sales team",
      solution: "ConnectLead as their complete sales development solution",
      results: {
        meetings: "500% increase in demo bookings",
        revenue: "Achieved product-market fit in 4 months",
        cost: "90% less than hiring SDR team",
        time: "First paying customer in 3 weeks"
      },
      metrics: [
        { label: "Demo Bookings", before: "3/month", after: "18/month", improvement: "+500%" },
        { label: "Customer Acquisition", before: "$2,400", after: "$180", improvement: "-92%" },
        { label: "Time to Revenue", before: "6 months", after: "3 weeks", improvement: "-95%" },
        { label: "Founder Time Saved", before: "60 hrs/week", after: "5 hrs/week", improvement: "-92%" }
      ],
      testimonial: {
        quote: "As a bootstrapped startup, ConnectLead was a game-changer. We got our first customers faster than we ever imagined possible, and at a fraction of the cost.",
        author: "David Kim",
        title: "Co-Founder & CEO",
        avatar: "DK"
      },
      featured: false,
      videoUrl: "#"
    }
  ];

  const filteredCaseStudies = selectedFilter === 'all' 
    ? caseStudies 
    : caseStudies.filter(study => study.industry === selectedFilter);

  const featuredStudy = caseStudies.find(study => study.featured);

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
          <div className="space-y-6">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
              <Sparkles className="w-4 h-4 mr-2" />
              Case Studies
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
              <span className="text-white">Real Results from</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Real Companies</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
              See how companies across industries are using ConnectLead to transform their sales development and achieve remarkable growth.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      {featuredStudy && (
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 mb-4">
                Featured Success Story
              </Badge>
              <h2 className="text-3xl font-bold text-white">
                How {featuredStudy.company} Achieved {featuredStudy.results.meetings}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Video/Visual */}
              <div className="relative">
                <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="aspect-video flex items-center justify-center relative">
                    <Button 
                      size="lg" 
                      className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full w-20 h-20 relative z-10 border border-white/20"
                    >
                      <Play className="h-8 w-8" />
                    </Button>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-2xl font-bold">{featuredStudy.company}</div>
                      <div className="text-sm text-gray-400">{featuredStudy.companySize}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">The Challenge</h3>
                  <p className="text-gray-400 text-lg">{featuredStudy.challenge}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">The Solution</h3>
                  <p className="text-gray-400 text-lg">{featuredStudy.solution}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">The Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                      <TrendingUp className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <div className="font-bold text-emerald-400">{featuredStudy.results.meetings}</div>
                      <div className="text-xs text-gray-400">Qualified Meetings</div>
                    </div>
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-center">
                      <DollarSign className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                      <div className="font-bold text-violet-400">{featuredStudy.results.revenue}</div>
                      <div className="text-xs text-gray-400">Additional Revenue</div>
                    </div>
                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl p-4 text-center">
                      <Target className="h-6 w-6 text-fuchsia-400 mx-auto mb-2" />
                      <div className="font-bold text-fuchsia-400">{featuredStudy.results.cost}</div>
                      <div className="text-xs text-gray-400">Cost Reduction</div>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                      <Clock className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                      <div className="font-bold text-cyan-400">{featuredStudy.results.time}</div>
                      <div className="text-xs text-gray-400">Implementation</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <Quote className="h-8 w-8 text-violet-400 mb-4" />
                  <blockquote className="text-lg text-gray-300 italic mb-4">
                    "{featuredStudy.testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {featuredStudy.testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{featuredStudy.testimonial.author}</div>
                      <div className="text-sm text-gray-400">{featuredStudy.testimonial.title}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant="outline"
                onClick={() => setSelectedFilter(filter.id)}
                className={selectedFilter === filter.id 
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                }
              >
                <Filter className="mr-2 h-4 w-4" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCaseStudies.map((study) => (
              <div key={study.id} className="bg-white/[0.02] rounded-2xl border border-white/10 p-8 hover:border-violet-500/30 transition-all duration-300 hover-lift">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {study.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{study.company}</h3>
                      <p className="text-sm text-gray-400">{study.companySize}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/5 text-gray-400 border-white/10 capitalize">
                    {study.industry}
                  </Badge>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {study.metrics.slice(0, 2).map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{metric.improvement}</div>
                      <div className="text-sm text-gray-400">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Challenge & Solution */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Challenge</h4>
                    <p className="text-sm text-gray-400">{study.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Solution</h4>
                    <p className="text-sm text-gray-400">{study.solution}</p>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-6">
                  <blockquote className="text-sm text-gray-300 italic mb-3">
                    "{study.testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {study.testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{study.testimonial.author}</div>
                      <div className="text-xs text-gray-400">{study.testimonial.title}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Video
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-gradient-to-b from-transparent via-violet-600/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Proven Results Across Industries
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Aggregate results from 200+ companies using ConnectLead
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8 text-center hover:border-violet-500/30 transition-all duration-300">
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">3.2x</div>
              <div className="text-lg font-semibold text-white mb-2">Average Meeting Increase</div>
              <div className="text-sm text-gray-400">Across all customers</div>
            </div>
            
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8 text-center hover:border-emerald-500/30 transition-all duration-300">
              <div className="text-4xl font-bold text-emerald-400 mb-2">68%</div>
              <div className="text-lg font-semibold text-white mb-2">Average Cost Reduction</div>
              <div className="text-sm text-gray-400">vs traditional SDR teams</div>
            </div>
            
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8 text-center hover:border-fuchsia-500/30 transition-all duration-300">
              <div className="text-4xl font-bold text-fuchsia-400 mb-2">$2.1M</div>
              <div className="text-lg font-semibold text-white mb-2">Total Revenue Generated</div>
              <div className="text-sm text-gray-400">In the last 12 months</div>
            </div>
            
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8 text-center hover:border-cyan-500/30 transition-all duration-300">
              <div className="text-4xl font-bold text-cyan-400 mb-2">96%</div>
              <div className="text-lg font-semibold text-white mb-2">Customer Satisfaction</div>
              <div className="text-sm text-gray-400">Would recommend to others</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl animate-glow-pulse"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Write Your Success Story?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join these successful companies and transform your sales development with ConnectLead.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link href="/signup">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-violet-500/25">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 py-6 text-lg">
                    Book Demo
                    <Calendar className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                14-day free trial • No credit card required • Results in 30 days
              </p>
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
