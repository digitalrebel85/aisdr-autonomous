import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Shield, 
  Users, 
  Globe,
  BarChart3,
  Lock,
  Zap,
  Settings,
  ArrowRight,
  CheckCircle,
  Star,
  Award,
  Phone,
  Database,
  Workflow,
  UserCheck
} from 'lucide-react';

export default function EnterprisePage() {
  const enterpriseStats = [
    { value: "500+", label: "Enterprise Customers" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "24/7", label: "Dedicated Support" },
    { value: "SOC2", label: "Compliance Ready" }
  ];

  const enterpriseFeatures = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC2 Type II, GDPR compliance, and enterprise-grade data protection",
      details: [
        "End-to-end encryption",
        "Single Sign-On (SSO)",
        "Role-based access control",
        "Audit logs and compliance reporting"
      ]
    },
    {
      icon: Database,
      title: "Advanced Integrations",
      description: "Deep integration with your existing sales and marketing stack",
      details: [
        "Salesforce, HubSpot, Pipedrive",
        "Custom API integrations",
        "Real-time data synchronization",
        "Webhook support"
      ]
    },
    {
      icon: Users,
      title: "Multi-Team Management",
      description: "Manage multiple sales teams and territories with advanced permissions",
      details: [
        "Team-based access controls",
        "Territory management",
        "Performance analytics by team",
        "Custom reporting dashboards"
      ]
    },
    {
      icon: Settings,
      title: "Custom Configuration",
      description: "Tailored setup to match your unique sales processes and requirements",
      details: [
        "Custom email templates",
        "Workflow automation",
        "Personalized AI training",
        "White-label options"
      ]
    }
  ];

  const complianceFeatures = [
    {
      icon: Lock,
      title: "Data Security",
      description: "Bank-level encryption and security protocols"
    },
    {
      icon: Award,
      title: "SOC2 Type II",
      description: "Independently audited security controls"
    },
    {
      icon: Globe,
      title: "GDPR Compliant",
      description: "Full compliance with European data protection"
    },
    {
      icon: UserCheck,
      title: "Privacy Controls",
      description: "Granular data handling and privacy settings"
    }
  ];

  const testimonials = [
    {
      name: "Robert Chen",
      role: "VP Sales Operations",
      company: "Fortune 500 Technology Company",
      content: "AISDR scaled across our 12 global sales teams seamlessly. The enterprise features and security controls met all our requirements.",
      rating: 5,
      metrics: "12 teams, 40+ countries"
    },
    {
      name: "Amanda Foster",
      role: "Chief Revenue Officer",
      company: "Public SaaS Company",
      content: "The ROI was immediate. We reduced our sales development costs by $2.3M annually while increasing pipeline by 180%.",
      rating: 5,
      metrics: "$2.3M savings, 180% more pipeline"
    },
    {
      name: "James Wilson",
      role: "Head of Sales",
      company: "Enterprise Software Company",
      content: "The dedicated support and custom integrations made the difference. Our complex sales process was fully automated.",
      rating: 5,
      metrics: "Complex process fully automated"
    }
  ];

  const supportTiers = [
    {
      title: "Dedicated Success Manager",
      description: "Personal point of contact for strategic guidance and optimization"
    },
    {
      title: "24/7 Priority Support",
      description: "Round-the-clock technical support with guaranteed response times"
    },
    {
      title: "Custom Training",
      description: "Tailored onboarding and training programs for your teams"
    },
    {
      title: "Quarterly Business Reviews",
      description: "Regular strategy sessions to optimize performance and ROI"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
              <Link href="/contact">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Contact Sales
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
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  🏢 Enterprise-Grade AI Sales Development
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Scale Sales Across Your
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Global Enterprise</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Enterprise-grade AI sales development with the security, compliance, and 
                  scalability your organization demands. Trusted by Fortune 500 companies.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {enterpriseStats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-md border">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    Contact Sales
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    Enterprise Demo
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500">
                ✓ SOC2 compliant ✓ 99.9% uptime SLA ✓ Dedicated support
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Enterprise Command Center</h3>
                      <Badge className="bg-green-100 text-green-800">Secure</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Global Teams</span>
                        <span className="font-semibold text-blue-600">12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monthly Pipeline</span>
                        <span className="font-semibold text-green-600">$12.4M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Compliance Score</span>
                        <span className="font-semibold text-purple-600">100%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">System Uptime</span>
                        <span className="font-semibold text-orange-600">99.98%</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500">Security Status</div>
                      <div className="text-sm text-gray-700">🔒 SOC2 audit passed</div>
                      <div className="text-sm text-gray-700">🛡️ All systems secure</div>
                      <div className="text-sm text-gray-700">📊 Real-time monitoring active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for the scale, security, and complexity of enterprise organizations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enterpriseFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
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

      {/* Compliance & Security */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Security & Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade security that meets the highest standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Enterprise Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dedicated support designed for enterprise success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportTiers.map((tier, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{tier.title}</h3>
                  <p className="text-gray-600">{tier.description}</p>
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
              Trusted by Enterprise Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what enterprise customers say about AISDR
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
      <section className="py-20 bg-gradient-to-r from-gray-800 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready for Enterprise-Grade AI Sales?
            </h2>
            <p className="text-xl text-gray-200">
              Let's discuss how AISDR can transform your enterprise sales organization
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-4 text-lg">
                  Contact Sales
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-800 px-8 py-4 text-lg">
                  Enterprise Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-300">
              Custom pricing • Dedicated support • SOC2 compliant
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
                Enterprise-grade AI sales development platform.
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
