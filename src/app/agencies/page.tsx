import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
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
  Briefcase,
  Globe,
  Shield,
  Layers,
  UserCheck,
  Award
} from 'lucide-react';

export default function AgenciesPage() {
  const agencyStats = [
    { value: "85%", label: "Higher Client Retention" },
    { value: "3.5x", label: "More Revenue Per Client" },
    { value: "90%", label: "Faster Campaign Setup" },
    { value: "60%", label: "Lower Operational Costs" }
  ];

  const agencyChallenges = [
    {
      icon: Users,
      title: "Scaling Client Campaigns",
      problem: "Manual outreach doesn't scale across multiple clients",
      solution: "AI handles unlimited campaigns simultaneously with client-specific personalization"
    },
    {
      icon: DollarSign,
      title: "Proving ROI to Clients",
      problem: "Difficult to show measurable results and justify fees",
      solution: "Detailed analytics and reporting prove campaign effectiveness and value"
    },
    {
      icon: Clock,
      title: "Time-Intensive Setup",
      problem: "Each new client requires weeks of manual campaign setup",
      solution: "Automated onboarding and template-based campaigns launch in hours"
    },
    {
      icon: Target,
      title: "Inconsistent Quality",
      problem: "Results vary based on team member skills and availability",
      solution: "AI ensures consistent, high-quality outreach across all clients"
    }
  ];

  const agencyFeatures = [
    {
      icon: Layers,
      title: "Multi-Client Management",
      description: "Manage unlimited client campaigns from a single dashboard with complete isolation"
    },
    {
      icon: UserCheck,
      title: "White-Label Solution",
      description: "Fully brandable platform that appears as your own proprietary technology"
    },
    {
      icon: BarChart3,
      title: "Client Reporting",
      description: "Automated reports showing campaign performance, ROI, and lead quality metrics"
    },
    {
      icon: Shield,
      title: "Agency-Grade Security",
      description: "Enterprise security with client data isolation and compliance features"
    }
  ];

  const testimonials = [
    {
      name: "Jennifer Walsh",
      role: "Founder, Growth Partners",
      company: "B2B Marketing Agency",
      content: "AISDR transformed our agency. We went from managing 8 clients to 25 clients with the same team size. Our clients are seeing 4x better results.",
      rating: 5,
      metrics: "3x more clients, 4x better results"
    },
    {
      name: "Marcus Thompson",
      role: "CEO, SalesBoost Agency",
      company: "Sales Development Agency",
      content: "The white-label solution lets us offer cutting-edge AI to our clients under our brand. We've increased our average contract value by 250%.",
      rating: 5,
      metrics: "250% higher contract values"
    },
    {
      name: "Lisa Rodriguez",
      role: "Operations Director, LeadGen Pro",
      company: "Lead Generation Agency",
      content: "Setup time went from 3 weeks to 3 hours per client. We can now take on enterprise clients we couldn't handle before.",
      rating: 5,
      metrics: "90% faster client onboarding"
    }
  ];

  const pricingTiers = [
    {
      name: "Agency Starter",
      price: "$497",
      period: "/month",
      description: "Perfect for growing agencies",
      features: [
        "Up to 5 client accounts",
        "10,000 emails/month",
        "Basic white-labeling",
        "Standard support"
      ],
      popular: false
    },
    {
      name: "Agency Pro",
      price: "$997",
      period: "/month",
      description: "Most popular for established agencies",
      features: [
        "Up to 15 client accounts",
        "50,000 emails/month",
        "Full white-labeling",
        "Priority support",
        "Custom reporting"
      ],
      popular: true
    },
    {
      name: "Agency Enterprise",
      price: "Custom",
      period: "",
      description: "For large agencies and franchises",
      features: [
        "Unlimited client accounts",
        "Unlimited emails",
        "Complete customization",
        "Dedicated success manager",
        "API access"
      ],
      popular: false
    }
  ];

  const useCases = [
    {
      title: "Lead Generation Agencies",
      description: "Deliver higher quality leads at scale while reducing operational overhead",
      results: ["3x more qualified leads", "60% lower cost per lead", "85% client retention rate"]
    },
    {
      title: "Marketing Agencies",
      description: "Add sales development as a premium service offering to existing clients",
      results: ["40% increase in average deal size", "New revenue stream", "Higher client lifetime value"]
    },
    {
      title: "Sales Development Agencies",
      description: "Scale your SDR services without hiring and training more team members",
      results: ["Handle 3x more clients", "90% faster onboarding", "Consistent quality delivery"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
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
                  🏢 White-Label AI for Agencies
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Scale Your Agency with
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> AI Sales Development</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Manage 3x more clients with the same team. White-label AI platform that delivers 
                  consistent results and proves ROI to every client.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {agencyStats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-md border">
                    <div className="text-2xl font-bold text-purple-600">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">
                    Start Agency Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    See Agency Demo
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500">
                ✓ White-label ready ✓ Multi-client management ✓ Used by 150+ agencies
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Agency Dashboard</h3>
                      <Badge className="bg-green-100 text-green-800">Live</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Clients</span>
                        <span className="font-semibold text-purple-600">23</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Demos Booked</span>
                        <span className="font-semibold text-blue-600">1,247</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg. Client ROI</span>
                        <span className="font-semibold text-green-600">340%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Client Retention</span>
                        <span className="font-semibold text-orange-600">94%</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500">Recent Activity</div>
                      <div className="text-sm text-gray-700">🎯 TechCorp: 8 demos booked this week</div>
                      <div className="text-sm text-gray-700">📧 SaaS Inc: 89% email open rate</div>
                      <div className="text-sm text-gray-700">📅 StartupXYZ: 5 meetings scheduled</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agency Challenges */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Solve Your Agency's Biggest Challenges
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop losing clients to inconsistent results and scaling problems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {agencyChallenges.map((challenge, index) => {
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

      {/* Agency Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Built for Agency Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to scale your agency and delight clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {agencyFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-purple-600" />
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
              Perfect for Every Agency Type
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proven results across different agency models
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

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Agency Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing that scales with your agency
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`border-0 shadow-lg ${tier.popular ? 'ring-2 ring-purple-500 relative' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-gray-900">
                      {tier.price}
                      <span className="text-lg font-normal text-gray-600">{tier.period}</span>
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Button className={`w-full ${tier.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                      {tier.price === "Custom" ? "Contact Sales" : "Start Trial"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              What Agency Owners Say
            </h2>
            <p className="text-xl text-gray-600">
              Real results from real agencies
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
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-purple-800">{testimonial.metrics}</div>
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
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Scale Your Agency?
            </h2>
            <p className="text-xl text-purple-100">
              Join 150+ agencies using AISDR to deliver better results and scale faster
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg">
                  Start Agency Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg">
                  Book Agency Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-purple-200">
              White-label ready • Multi-client dashboard • 30-day free trial
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
                White-label AI sales development platform for agencies.
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
