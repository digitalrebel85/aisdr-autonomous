import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  Check, 
  ArrowRight,
  Calculator,
  HelpCircle,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  Headphones
} from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingPlans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      monthlyPrice: 97,
      annualPrice: 87,
      popular: false,
      features: [
        "Up to 1,000 prospects/month",
        "5,000 emails/month",
        "Basic AI personalization",
        "Email sequences",
        "CRM integration (HubSpot, Salesforce)",
        "Basic analytics",
        "Email support"
      ],
      limitations: [
        "Single inbox connection",
        "Standard reply classification",
        "Basic templates only"
      ]
    },
    {
      name: "Pro",
      description: "Most popular for growing sales teams",
      monthlyPrice: 297,
      annualPrice: 267,
      popular: true,
      features: [
        "Up to 5,000 prospects/month",
        "25,000 emails/month",
        "Advanced AI personalization",
        "Multi-channel sequences",
        "All CRM integrations",
        "Advanced analytics & reporting",
        "Calendar booking integration",
        "Reply classification & routing",
        "A/B testing",
        "Priority support"
      ],
      limitations: [
        "Up to 3 inbox connections",
        "Standard integrations"
      ]
    },
    {
      name: "Scale",
      description: "For high-volume sales organizations",
      monthlyPrice: 597,
      annualPrice: 537,
      popular: false,
      features: [
        "Unlimited prospects",
        "100,000+ emails/month",
        "Custom AI training",
        "Advanced sequences & workflows",
        "All integrations + custom API",
        "Custom analytics dashboards",
        "Advanced calendar features",
        "AI reply generation",
        "Custom integrations",
        "Dedicated success manager",
        "White-label options"
      ],
      limitations: []
    }
  ];

  const addOns = [
    {
      name: "Extra Email Volume",
      price: "From $0.01/email",
      description: "Additional emails beyond your plan limit"
    },
    {
      name: "Additional Inboxes",
      price: "$47/month each",
      description: "Connect more email accounts for better deliverability"
    },
    {
      name: "Custom Integrations",
      price: "From $497/month",
      description: "Custom API integrations and webhooks"
    },
    {
      name: "Dedicated IP",
      price: "$197/month",
      description: "Dedicated sending IP for maximum deliverability"
    }
  ];

  const faqs = [
    {
      question: "Can I migrate from Apollo to ConnectLead?",
      answer: "Yes! Our team provides free migration assistance. We can help you import your existing contacts and sequences, and our AI will enhance them with better personalization."
    },
    {
      question: "How does ConnectLead's database compare to Apollo's?",
      answer: "While Apollo has a larger static database, ConnectLead focuses on real-time visitor intelligence and intent data. This means fresher, more actionable prospects who are actively showing interest."
    },
    {
      question: "Is ConnectLead easier to use than Apollo?",
      answer: "Yes. ConnectLead is designed for simplicity - our AI handles the complexity. Most users are sending personalized campaigns within 30 minutes, compared to days or weeks with Apollo."
    },
    {
      question: "What about pricing differences?",
      answer: "ConnectLead offers transparent pricing starting at $97/month. Apollo's pricing can be complex with multiple add-ons. Most customers find ConnectLead delivers better ROI with lower total cost."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely. Cancel anytime with one click. No contracts, no cancellation fees. Your account remains active until the end of your billing period."
    },
    {
      question: "Can I change plans anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What happens if I exceed my email limit?",
      answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional email volume at $0.01 per email."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment in full."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees, ever. The price you see is the price you pay. We believe in transparent, honest pricing."
    },
    {
      question: "Do you offer enterprise pricing?",
      answer: "Yes! For teams with 50+ users or custom requirements, contact our sales team for enterprise pricing and features."
    }
  ];

  const roiInputs = [
    { label: "Monthly prospects", value: 1000 },
    { label: "Email reply rate", value: "12%" },
    { label: "Meeting booking rate", value: "25%" },
    { label: "Deal close rate", value: "15%" },
    { label: "Average deal value", value: "$5,000" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Simple, Transparent
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No hidden fees, no surprises. Choose the plan that fits your team size and scale as you grow.
            </p>
            
            {/* Monthly/Annual Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Save 10%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`border-0 shadow-lg relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6">
                    <div className="text-5xl font-bold text-gray-900">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      per month{isAnnual ? ', billed annually' : ''}
                    </div>
                    {isAnnual && plan.monthlyPrice > plan.annualPrice && (
                      <div className="text-sm text-green-600 mt-1">
                        Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">What's included:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-semibold text-gray-700">Limitations:</h4>
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="h-5 w-5 flex-shrink-0 mt-0.5">
                            <div className="h-1 w-3 bg-gray-400 rounded"></div>
                          </div>
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-6">
                    <Link href="/signup">
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                        size="lg"
                      >
                        Start {plan.name} Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Add-ons & Usage</h2>
            <p className="text-xl text-gray-600">Scale your usage with transparent add-on pricing</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{addon.name}</h3>
                  <div className="text-lg font-bold text-blue-600 mb-2">{addon.price}</div>
                  <p className="text-sm text-gray-600">{addon.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Teaser */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Calculator className="h-12 w-12 text-blue-600 mx-auto" />
              <h2 className="text-3xl font-bold text-gray-900">Calculate Your ROI</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how much revenue ConnectLead can generate for your business
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Your inputs:</h3>
                  {roiInputs.map((input, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{input.label}:</span>
                      <span className="font-medium">{input.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Projected results:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly meetings:</span>
                      <span className="font-bold text-blue-600">30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly revenue:</span>
                      <span className="font-bold text-green-600">$22,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payback period:</span>
                      <span className="font-bold text-purple-600">4 days</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/roi-calculator">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Try Full ROI Calculator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about our pricing</p>
          </div>
          
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 bg-gradient-to-r from-gray-800 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Need Something Custom?</h2>
            <p className="text-xl text-gray-200">
              For enterprise teams with custom requirements, we offer tailored solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-100">
                  Contact Sales
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/enterprise">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-800">
                  View Enterprise
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ConnectLead
              </h1>
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
