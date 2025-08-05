'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  Filter,
  Star,
  Quote,
  Calendar,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  ExternalLink
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Case Studies
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Real Results from
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Real Companies</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how companies across industries are using ConnectLead to transform their sales development and achieve remarkable growth.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      {featuredStudy && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 mb-4">
                Featured Success Story
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">
                How {featuredStudy.company} Achieved {featuredStudy.results.meetings}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Video/Visual */}
              <div className="relative">
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <Button 
                      size="lg" 
                      className="bg-white text-blue-600 hover:bg-gray-100 rounded-full w-20 h-20 relative z-10"
                    >
                      <Play className="h-8 w-8" />
                    </Button>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-2xl font-bold">{featuredStudy.company}</div>
                      <div className="text-sm opacity-90">{featuredStudy.companySize}</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Results */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">The Challenge</h3>
                  <p className="text-gray-600 text-lg">{featuredStudy.challenge}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">The Solution</h3>
                  <p className="text-gray-600 text-lg">{featuredStudy.solution}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">The Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-0 shadow-md bg-green-50">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="font-bold text-green-600">{featuredStudy.results.meetings}</div>
                        <div className="text-xs text-gray-600">Qualified Meetings</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-blue-50">
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="font-bold text-blue-600">{featuredStudy.results.revenue}</div>
                        <div className="text-xs text-gray-600">Additional Revenue</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-purple-50">
                      <CardContent className="p-4 text-center">
                        <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <div className="font-bold text-purple-600">{featuredStudy.results.cost}</div>
                        <div className="text-xs text-gray-600">Cost Reduction</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-orange-50">
                      <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="font-bold text-orange-600">{featuredStudy.results.time}</div>
                        <div className="text-xs text-gray-600">Implementation</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="border-0 shadow-md bg-gray-50">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-blue-600 mb-4" />
                    <blockquote className="text-lg text-gray-700 italic mb-4">
                      "{featuredStudy.testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {featuredStudy.testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{featuredStudy.testimonial.author}</div>
                        <div className="text-sm text-gray-600">{featuredStudy.testimonial.title}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter.id)}
                className={selectedFilter === filter.id ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Filter className="mr-2 h-4 w-4" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCaseStudies.map((study) => (
              <Card key={study.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {study.logo}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{study.company}</h3>
                        <p className="text-sm text-gray-600">{study.companySize}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {study.industry}
                    </Badge>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {study.metrics.slice(0, 2).map((metric, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{metric.improvement}</div>
                        <div className="text-sm text-gray-600">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Challenge & Solution */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Challenge</h4>
                      <p className="text-sm text-gray-600">{study.challenge}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Solution</h4>
                      <p className="text-sm text-gray-600">{study.solution}</p>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <Card className="border border-gray-200 bg-gray-50 mb-6">
                    <CardContent className="p-4">
                      <blockquote className="text-sm text-gray-700 italic mb-3">
                        "{study.testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {study.testimonial.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{study.testimonial.author}</div>
                          <div className="text-xs text-gray-600">{study.testimonial.title}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      Watch Video
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Proven Results Across Industries
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Aggregate results from 200+ companies using ConnectLead
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-blue-600 mb-2">3.2x</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Average Meeting Increase</div>
                <div className="text-sm text-gray-600">Across all customers</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-green-600 mb-2">68%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Average Cost Reduction</div>
                <div className="text-sm text-gray-600">vs traditional SDR teams</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-purple-600 mb-2">2.1M</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Total Revenue Generated</div>
                <div className="text-sm text-gray-600">In the last 12 months</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-orange-600 mb-2">96%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Customer Satisfaction</div>
                <div className="text-sm text-gray-600">Would recommend to others</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-blue-100">
              Join these successful companies and transform your sales development with ConnectLead.
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
                  Book Demo
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-200">
              14-day free trial • No credit card required • Results in 30 days
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
                <li><Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/roi-calculator" className="hover:text-white transition-colors">ROI Calculator</Link></li>
                <li><Link href="/compare/apollo" className="hover:text-white transition-colors">vs Apollo</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/webinars" className="hover:text-white transition-colors">Webinars</Link></li>
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
