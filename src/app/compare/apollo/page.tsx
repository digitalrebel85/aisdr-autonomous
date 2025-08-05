import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  Check, 
  X,
  ArrowRight,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  DollarSign,
  Clock,
  Zap,
  Target,
  Bot,
  HelpCircle
} from 'lucide-react';

export default function CompareApolloPage() {
  const comparisonData = [
    {
      category: "Core Approach",
      criteria: "Primary Focus",
      aisdr: "AI-powered personalization at scale",
      apollo: "Database-first prospecting platform",
      winner: "aisdr"
    },
    {
      category: "Core Approach", 
      criteria: "Data Source Model",
      aisdr: "Real-time visitor intelligence + CRM data",
      apollo: "Static database with periodic updates",
      winner: "aisdr"
    },
    {
      category: "Email Capabilities",
      criteria: "AI Personalization",
      aisdr: "Advanced GPT-4 powered personalization",
      apollo: "Basic merge tags and templates",
      winner: "aisdr"
    },
    {
      category: "Email Capabilities",
      criteria: "Deliverability Ownership",
      aisdr: "Full inbox management & warming",
      apollo: "User manages own deliverability",
      winner: "aisdr"
    },
    {
      category: "Email Capabilities",
      criteria: "Reply Classification",
      aisdr: "AI-powered sentiment analysis & routing",
      apollo: "Manual reply management",
      winner: "aisdr"
    },
    {
      category: "Automation",
      criteria: "Sequence Intelligence",
      aisdr: "AI adapts sequences based on engagement",
      apollo: "Static sequence templates",
      winner: "aisdr"
    },
    {
      category: "Automation",
      criteria: "Meeting Booking",
      aisdr: "Automated calendar integration",
      apollo: "Manual calendar link sharing",
      winner: "aisdr"
    },
    {
      category: "Data & Prospecting",
      criteria: "Database Size",
      aisdr: "Real-time web intelligence",
      apollo: "275M+ contact database",
      winner: "apollo"
    },
    {
      category: "Data & Prospecting",
      criteria: "Data Freshness",
      aisdr: "Live visitor tracking & intent data",
      apollo: "Quarterly database updates",
      winner: "aisdr"
    },
    {
      category: "Pricing",
      criteria: "Transparency",
      aisdr: "Clear pricing, no hidden fees",
      apollo: "Complex pricing tiers",
      winner: "aisdr"
    },
    {
      category: "Pricing",
      criteria: "ROI Speed",
      aisdr: "Typical payback in 4-7 days",
      apollo: "Longer ramp-up period",
      winner: "aisdr"
    },
    {
      category: "Setup & Usability",
      criteria: "Time to Value",
      aisdr: "30 minutes to first campaign",
      apollo: "Days/weeks for full setup",
      winner: "aisdr"
    },
    {
      category: "Setup & Usability",
      criteria: "Learning Curve",
      aisdr: "Minimal - AI handles complexity",
      apollo: "Steep - requires training",
      winner: "aisdr"
    }
  ];

  const categories = [...new Set(comparisonData.map(item => item.category))];

  const prosAndCons = {
    connectlead: {
      pros: [
        "AI writes personalized emails that get responses",
        "Handles entire sales process end-to-end",
        "Real-time visitor intelligence",
        "Automatic meeting booking",
        "Fast setup and immediate results",
        "Transparent, predictable pricing",
        "Built-in deliverability management"
      ],
      cons: [
        "Smaller contact database than Apollo",
        "Newer platform (less brand recognition)",
        "AI-first approach may feel unfamiliar"
      ]
    },
    apollo: {
      pros: [
        "Massive 275M+ contact database",
        "Established brand with large user base",
        "Comprehensive sales intelligence features",
        "Strong integrations ecosystem",
        "Advanced search and filtering"
      ],
      cons: [
        "Complex setup and learning curve",
        "Manual personalization required",
        "Deliverability challenges",
        "No AI-powered automation",
        "Higher total cost of ownership",
        "Static data, not real-time"
      ]
    }
  };

  const useCases = [
    {
      title: "Choose ConnectLead if you:",
      icon: Bot,
      points: [
        "Want AI to handle personalization automatically",
        "Need fast results with minimal setup time",
        "Prefer end-to-end automation over manual work",
        "Want built-in deliverability management",
        "Value transparent, predictable pricing",
        "Focus on quality over quantity in outreach"
      ]
    },
    {
      title: "Choose Apollo if you:",
      icon: Users,
      points: [
        "Need access to a massive contact database",
        "Have dedicated team for manual personalization",
        "Require extensive sales intelligence features",
        "Can invest time in complex setup and training",
        "Prefer established, well-known platforms",
        "Focus on high-volume prospecting"
      ]
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
    }
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
              ConnectLead vs
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Apollo</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              An honest comparison of AI-powered sales development vs traditional database-driven prospecting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Try ConnectLead Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg">
                  See Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Feature Comparison</h2>
            <p className="text-xl text-gray-600">See how ConnectLead and Apollo stack up across key criteria</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Criteria</th>
                  <th className="text-center py-4 px-6 font-semibold text-blue-600">ConnectLead</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Apollo</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-6 font-semibold text-gray-800 text-sm uppercase tracking-wide">
                        {category}
                      </td>
                    </tr>
                    {comparisonData
                      .filter(item => item.category === category)
                      .map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6 font-medium text-gray-900">{item.criteria}</td>
                          <td className={`py-4 px-6 text-center ${item.winner === 'aisdr' ? 'bg-blue-50' : ''}`}>
                            <div className="flex items-center justify-center space-x-2">
                              {item.winner === 'aisdr' && <Check className="h-4 w-4 text-green-500" />}
                              <span className={item.winner === 'aisdr' ? 'font-semibold text-blue-700' : 'text-gray-600'}>
                                {item.aisdr}
                              </span>
                            </div>
                          </td>
                          <td className={`py-4 px-6 text-center ${item.winner === 'apollo' ? 'bg-gray-50' : ''}`}>
                            <div className="flex items-center justify-center space-x-2">
                              {item.winner === 'apollo' && <Check className="h-4 w-4 text-green-500" />}
                              <span className={item.winner === 'apollo' ? 'font-semibold text-gray-700' : 'text-gray-600'}>
                                {item.apollo}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pros and Cons */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Honest Pros & Cons</h2>
            <p className="text-xl text-gray-600">We believe in transparent comparisons</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AISDR */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-xl text-blue-700">ConnectLead</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Pros
                  </h4>
                  <ul className="space-y-2">
                    {prosAndCons.connectlead.pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    Cons
                  </h4>
                  <ul className="space-y-2">
                    {prosAndCons.connectlead.cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Apollo */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-xl text-gray-700">Apollo</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Pros
                  </h4>
                  <ul className="space-y-2">
                    {prosAndCons.apollo.pros.map((pro, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    Cons
                  </h4>
                  <ul className="space-y-2">
                    {prosAndCons.apollo.cons.map((con, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Should Choose Which */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Who Should Choose Which?</h2>
            <p className="text-xl text-gray-600">Find the right fit for your team and goals</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => {
              const IconComponent = useCase.icon;
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {useCase.points.map((point, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-gray-600">{point}</span>
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

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Common questions about switching from Apollo</p>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Try the AI Advantage?
            </h2>
            <p className="text-xl text-blue-100">
              See why teams are switching from Apollo to ConnectLead for better results with less work.
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
              14-day free trial • No credit card required • Migration assistance included
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
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compare</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/compare/apollo" className="hover:text-white transition-colors">vs Apollo</Link></li>
                <li><Link href="/compare/zoominfo" className="hover:text-white transition-colors">vs ZoomInfo</Link></li>
                <li><Link href="/compare/instantly" className="hover:text-white transition-colors">vs Instantly</Link></li>
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
