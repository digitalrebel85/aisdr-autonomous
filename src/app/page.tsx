import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight, 
  CheckCircle, 
  Play,
  Star,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Zap,
  Target,
  Bot,
  ChevronRight,
  Quote,
  MessageSquare
} from 'lucide-react';

export default function HomePage() {
  const socialProofLogos = [
    "TechCorp", "GrowthLab", "ScaleUp Inc", "DataFlow", "CloudTech", "SalesBoost"
  ];

  const howItWorksSteps = [
    {
      step: "1",
      title: "Identify",
      description: "AI finds prospects showing buying intent from your website visitors and CRM data",
      details: ["Reverse IP lookup", "Intent data analysis", "CRM integration"]
    },
    {
      step: "2", 
      title: "Personalize",
      description: "Generate hyper-relevant messages using company data and behavioral signals",
      details: ["AI copywriting", "Dynamic personalization", "A/B testing"]
    },
    {
      step: "3",
      title: "Engage",
      description: "Send perfectly timed outreach and automatically book qualified meetings",
      details: ["Timezone optimization", "Reply classification", "Calendar booking"]
    }
  ];

  const features = [
    {
      icon: Bot,
      title: "AI Personalization",
      benefit: "100 relevant messages beat 10,000 generic ones",
      description: "Advanced AI writes personalized emails that sound human and get responses"
    },
    {
      icon: MessageSquare,
      title: "Smart Sequencing",
      benefit: "Perfect timing, every time",
      description: "Multi-channel sequences that adapt based on prospect behavior and engagement"
    },
    {
      icon: Target,
      title: "Inbox AI",
      benefit: "Never miss a hot lead",
      description: "AI classifies replies, schedules follow-ups, and routes qualified prospects"
    },
    {
      icon: BarChart3,
      title: "CRM Sync",
      benefit: "Your data, always up-to-date",
      description: "Seamless integration with Salesforce, HubSpot, and all major CRMs"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP Sales",
      company: "TechCorp",
      content: "From 12 meetings per month to 47. AISDR doesn't just book more meetings—it books better meetings.",
      metric: "+292% qualified meetings",
      rating: 5
    },
    {
      name: "Mike Rodriguez", 
      role: "Founder",
      company: "GrowthLab",
      content: "We replaced our $240K SDR team with AISDR. Same results, 70% lower cost, zero management headaches.",
      metric: "$168K annual savings",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Head of Growth",
      company: "ScaleUp Inc", 
      content: "The personalization is scary good. Prospects think they're talking to our best SDR, not an AI.",
      metric: "89% positive reply rate",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "How quickly can I see results?",
      answer: "Most customers see their first qualified meetings within 7 days of setup. Full ROI typically achieved within 30 days."
    },
    {
      question: "Do I need technical skills to use AISDR?",
      answer: "No. Our setup wizard guides you through connecting your email and CRM in under 30 minutes. No coding required."
    },
    {
      question: "How does AISDR compare to hiring SDRs?",
      answer: "AISDR costs 70% less than a human SDR team, works 24/7, never gets sick, and consistently delivers high-quality outreach."
    },
    {
      question: "What if prospects realize it's AI?",
      answer: "Our AI is trained to write naturally and personally. Most prospects never realize they're talking to AI, but we're always transparent when asked."
    },
    {
      question: "Can I try before I buy?",
      answer: "Yes! Start with our 14-day free trial. No credit card required. Cancel anytime."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Replace Your Entire SDR Team
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> with AI Automation</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
ConnectLead uses AI agents to intelligently automate SDR activities at scale. Enrich leads, write personalized emails, follow up strategically, and reply to all emails - increasing efficiency while saving companies money.
              </p>
            </div>
            
            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Try It Free
                </Button>
              </Link>
            </div>
            
            {/* Social Proof */}
            <div className="pt-8">
              <p className="text-sm text-gray-500 mb-6">Trusted by 200+ sales teams</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="text-gray-400 font-semibold">TechCorp</div>
                <div className="text-gray-400 font-semibold">SalesForce</div>
                <div className="text-gray-400 font-semibold">GrowthCo</div>
                <div className="text-gray-400 font-semibold">ScaleUp</div>
                <div className="text-gray-400 font-semibold">RevTech</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
              How ConnectLead Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform handles your entire SDR workflow automatically
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900">AI Lead Enrichment</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our AI agents automatically enrich leads using intent data, visitor tracking, and your API keys to build comprehensive prospect profiles.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900">Personalized Outreach</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate highly personalized emails based on prospect data, company information, and buying intent signals for maximum engagement.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Bot className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900">Intelligent Follow-ups</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI handles all follow-up sequences, replies to emails intelligently, and escalates qualified prospects to your sales team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Everything You Need to Scale Your Sales Development
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
ConnectLead combines intent data, visitor tracking, and AI automation to create the most powerful SDR platform on the market.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Precision Lead Targeting</h3>
                <p className="text-gray-600 leading-relaxed">Use intent data and visitor tracking to identify high-quality prospects automatically.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Automation</h3>
                <p className="text-gray-600 leading-relaxed">Intelligent agents handle lead enrichment, email writing, and follow-ups at scale.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
                <p className="text-gray-600 leading-relaxed">Track performance metrics, conversion rates, and ROI with comprehensive dashboards.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Seamless Integrations</h3>
                <p className="text-gray-600 leading-relaxed">Connect with your existing CRM, email platforms, and sales tools effortlessly.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast Setup</h3>
                <p className="text-gray-600 leading-relaxed">Get up and running in minutes, not weeks. No technical expertise required.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Proven Results</h3>
                <p className="text-gray-600 leading-relaxed">Companies see 3x more qualified demos and 70% cost reduction on average.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Tour Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                See AISDR in Action
              </h2>
              <p className="text-xl text-gray-600">
                Watch how AISDR identifies prospects, writes personalized messages, and books qualified meetings automatically.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Real-time prospect identification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">AI-powered message personalization</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Automated meeting booking</span>
                </div>
              </div>
              <Link href="/demo">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Watch 3-Minute Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Live Campaign Results</h3>
                      <Badge className="bg-green-100 text-green-800">Live</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">47</div>
                        <div className="text-sm text-gray-600">Meetings This Month</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">89%</div>
                        <div className="text-sm text-gray-600">Positive Replies</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Prospects Identified</span>
                        <span className="text-blue-600">1,247 this week</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Messages Sent</span>
                        <span className="text-green-600">342 today</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Meetings Booked</span>
                        <span className="text-purple-600">12 this week</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Loved by Sales Teams Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Real results from real customers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-blue-800">{testimonial.metric}</div>
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about AISDR
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Stop Scaling Noise?
            </h2>
            <p className="text-xl text-blue-100">
              Join 500+ sales teams using AISDR to book more qualified meetings with less effort.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                  Try Free for 14 Days
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-200">
              No credit card required • Setup in 30 minutes • Cancel anytime
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
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
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
