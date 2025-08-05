import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Clock,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Building,
  Globe,
  Shield
} from 'lucide-react';

export default function SaaSPage() {
  const saasStats = [
    { value: "73%", label: "Average CAC Reduction" },
    { value: "4.2x", label: "Increase in Demo Bookings" },
    { value: "89%", label: "Lead Quality Improvement" },
    { value: "60%", label: "Faster Sales Cycles" }
  ];

  const saasChallenges = [
    {
      icon: DollarSign,
      title: "High Customer Acquisition Costs",
      problem: "SDR teams cost $200K+ annually with inconsistent results",
      solution: "AI automation reduces CAC by 70% while booking 3x more demos"
    },
    {
      icon: Target,
      title: "Poor Lead Quality",
      problem: "Sales teams waste time on unqualified prospects",
      solution: "AI identifies high-intent prospects and scores leads automatically"
    },
    {
      icon: Clock,
      title: "Long Sales Cycles",
      problem: "Manual outreach creates delays and missed opportunities",
      solution: "24/7 automated engagement accelerates pipeline velocity"
    },
    {
      icon: TrendingUp,
      title: "Scaling Growth",
      problem: "Hiring and training SDRs doesn't scale efficiently",
      solution: "AI scales instantly without hiring, training, or management overhead"
    }
  ];

  const saasFeatures = [
    {
      icon: Users,
      title: "Product-Led Growth Support",
      description: "Identify trial users showing buying intent and automatically nurture them to conversion"
    },
    {
      icon: BarChart3,
      title: "Usage-Based Targeting",
      description: "Target prospects based on their current tool usage and pain points"
    },
    {
      icon: Rocket,
      title: "Freemium Conversion",
      description: "Convert free users to paid plans with personalized upgrade campaigns"
    },
    {
      icon: Shield,
      title: "Compliance Ready",
      description: "GDPR and SOC2 compliant for enterprise SaaS requirements"
    }
  ];

  const testimonials = [
    {
      name: "David Kim",
      role: "VP Growth, CloudTech",
      company: "Series B SaaS",
      content: "AISDR helped us reduce our CAC from $2,400 to $720 while increasing demo bookings by 340%. Our sales team now focuses on closing instead of prospecting.",
      rating: 5,
      metrics: "340% more demos, 70% lower CAC"
    },
    {
      name: "Sarah Martinez",
      role: "Head of Sales, DataFlow",
      company: "Early Stage SaaS",
      content: "As a startup, we couldn't afford a full SDR team. AISDR gave us enterprise-level sales automation at a fraction of the cost.",
      rating: 5,
      metrics: "Replaced 3 SDRs, $180K annual savings"
    },
    {
      name: "Michael Chen",
      role: "CEO, ScaleUp",
      company: "Growth Stage SaaS",
      content: "The AI understands our ICP better than our human SDRs did. It's booking meetings with decision-makers, not just anyone who responds.",
      rating: 5,
      metrics: "89% qualified leads, 60% faster cycles"
    }
  ];

  const useCases = [
    {
      title: "Freemium to Paid Conversion",
      description: "Automatically identify free users showing upgrade signals and engage them with personalized conversion campaigns",
      results: ["45% higher conversion rates", "30% shorter time-to-upgrade", "Reduced churn by 25%"]
    },
    {
      title: "Enterprise Upselling",
      description: "Target existing customers for plan upgrades and expansion opportunities based on usage patterns",
      results: ["60% increase in expansion revenue", "Automated upsell campaigns", "Higher customer lifetime value"]
    },
    {
      title: "Competitor Displacement",
      description: "Identify prospects using competitor tools and engage them with compelling switch campaigns",
      results: ["3x higher win rates vs competitors", "Shortened sales cycles", "Premium pricing maintained"]
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  🚀 Built for SaaS Growth Teams
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Scale Your SaaS Without
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Scaling SDRs</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Reduce customer acquisition costs by 70% while booking 4x more qualified demos. 
                  Purpose-built for SaaS companies who need predictable, scalable growth.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {saasStats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-md border">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    See SaaS Demo
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500">
                ✓ No credit card required ✓ Setup in 30 minutes ✓ Used by 200+ SaaS companies
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">SaaS Growth Dashboard</h3>
                      <Badge className="bg-green-100 text-green-800">Live</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monthly Demos Booked</span>
                        <span className="font-semibold text-green-600">+340%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Customer Acquisition Cost</span>
                        <span className="font-semibold text-blue-600">-73%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lead Quality Score</span>
                        <span className="font-semibold text-purple-600">89/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sales Cycle Length</span>
                        <span className="font-semibold text-orange-600">-60%</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500">Latest Activity</div>
                      <div className="text-sm text-gray-700">🎯 Identified 23 high-intent prospects</div>
                      <div className="text-sm text-gray-700">📧 Sent 156 personalized emails</div>
                      <div className="text-sm text-gray-700">📅 Booked 12 qualified demos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SaaS Challenges */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Solve Your Biggest SaaS Growth Challenges
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop struggling with expensive, inconsistent sales development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {saasChallenges.map((challenge, index) => {
              const IconComponent = challenge.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{challenge.title}</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                          <p className="text-sm text-red-800"><strong>Problem:</strong> {challenge.problem}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <p className="text-sm text-green-800"><strong>AISDR Solution:</strong> {challenge.solution}</p>
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

      {/* SaaS-Specific Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Built for SaaS Business Models
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Features designed specifically for subscription businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {saasFeatures.map((feature, index) => {
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

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Proven SaaS Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real scenarios where AISDR drives measurable results
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Results:</h4>
                    {useCase.results.map((result, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{result}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              What SaaS Leaders Say
            </h2>
            <p className="text-xl text-gray-600">
              Real results from real SaaS companies
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-blue-800">{testimonial.metrics}</div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-xs text-gray-500">{testimonial.company}</div>
                    </div>
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
              Ready to Scale Your SaaS?
            </h2>
            <p className="text-xl text-blue-100">
              Join 200+ SaaS companies using AISDR to reduce CAC and accelerate growth
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
                  Book SaaS Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-200">
              No credit card required • 30-day free trial • Cancel anytime
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
                AISDR
              </h3>
              <p className="text-gray-400">
                AI-powered sales development built for SaaS growth teams.
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
