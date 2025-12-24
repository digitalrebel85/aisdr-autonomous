'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  ArrowRight,
  Calculator,
  HelpCircle,
  Bot,
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingPlans = [
    {
      name: "Research",
      tagline: "Research & sequences, no sending",
      description: "AI-powered lead research and email copywriting",
      monthlyPrice: 97,
      annualPrice: 87,
      priceRange: null,
      currency: "$",
      popular: false,
      icon: "research",
      features: [
        "Up to 1,000 leads/month",
        "1 ICP",
        "2 messaging angles",
        "AI lead research & enrichment",
        "AI-written email sequences",
        "Export sequences to your tools"
      ],
      limitations: [
        "No email sending",
        "No mailbox connections",
        "No analytics"
      ]
    },
    {
      name: "Live Outreach",
      tagline: "Full AI outbound with sending",
      description: "Everything you need to run live campaigns",
      monthlyPrice: 297,
      annualPrice: 267,
      priceRange: null,
      currency: "$",
      popular: true,
      icon: "outreach",
      features: [
        "Everything in Research, plus:",
        "Warmup included (up to 10 inboxes)",
        "Sending enabled",
        "6,000 emails/month",
        "10 inboxes × 20 emails/day",
        "AI-written sequences activated",
        "AI response agent",
        "Basic optimisation (copy + angle)",
        "Analytics dashboard"
      ],
      limitations: []
    },
    {
      name: "Growth",
      tagline: "For teams & agencies",
      description: "Scale with AI learning and optimisation",
      monthlyPrice: 497,
      annualPrice: 447,
      priceRange: null,
      currency: "$",
      popular: false,
      icon: "growth",
      features: [
        "Everything in Live Outreach, plus:",
        "20 inboxes",
        "12,000 emails/month",
        "Multiple campaigns live",
        "Automated A/B testing",
        "Ongoing optimisation",
        "AI Learning Agent"
      ],
      limitations: []
    }
  ];

  const addOns = [
    {
      name: "Additional Prospects",
      price: "From $0.05/prospect",
      description: "Extra prospects beyond your plan limit"
    },
    {
      name: "Additional Inboxes",
      price: "$49/month each",
      description: "Connect more email accounts for better deliverability"
    },
    {
      name: "Extra ICPs",
      price: "$99/month each",
      description: "Additional ideal customer profiles for Pro plan"
    },
    {
      name: "Custom Onboarding",
      price: "$499 one-time",
      description: "White-glove setup and strategy session"
    }
  ];

  const faqs = [
    {
      question: "What's the Research plan for?",
      answer: "The Research plan is perfect if you already have your own email sending tools but want AI-powered lead research and email copywriting. We'll research your leads, enrich them with data, and write personalized email sequences - you just export and send through your existing tools."
    },
    {
      question: "What's the difference between Research and Live Outreach?",
      answer: "Research gives you AI lead research and email writing, but you send emails yourself using your own tools. Live Outreach includes everything in Research PLUS actual email sending through up to 10 connected mailboxes, warmup, AI response agent, and reply tracking."
    },
    {
      question: "What's the difference between Live Outreach and Growth?",
      answer: "Live Outreach gives you 10 inboxes and 6,000 emails/month with basic optimisation. Growth doubles that to 20 inboxes and 12,000 emails/month, plus adds automated A/B testing and the AI Learning Agent that continuously optimises your campaigns."
    },
    {
      question: "What is the AI Response Agent?",
      answer: "The AI Response Agent automatically handles replies to your outreach. It classifies responses, drafts appropriate follow-ups, and routes hot leads to your calendar - so you only spend time on prospects who are ready to talk."
    },
    {
      question: "What is the AI Learning Agent?",
      answer: "Available on Growth, the AI Learning Agent continuously analyses your campaign performance and automatically optimises your messaging angles, subject lines, and send times to improve results over time."
    },
    {
      question: "How does inbox warmup work?",
      answer: "We gradually increase sending volume on new inboxes to build sender reputation. This is included on Live Outreach and Growth plans for all connected inboxes, helping ensure your emails land in the inbox, not spam."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely. Cancel anytime with one click. No contracts, no cancellation fees. Your account remains active until the end of your billing period."
    },
    {
      question: "Can I upgrade from Research to Live Outreach?",
      answer: "Yes! You can upgrade at any time. When you upgrade, you'll get email sending capabilities immediately. We'll prorate any billing differences."
    },
    {
      question: "What happens if I exceed my email limit?",
      answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional capacity. We never cut off your campaigns mid-month."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 14-day money-back guarantee. If you're not seeing value, we'll refund your payment in full."
    }
  ];

  const roiInputs = [
    { label: "Monthly prospects", value: "5,000" },
    { label: "Email reply rate", value: "8%" },
    { label: "Meeting booking rate", value: "20%" },
    { label: "Deal close rate", value: "15%" },
    { label: "Average deal value", value: "$10,000" }
  ];

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
              <Link href="/pricing" className="text-white font-medium">Pricing</Link>
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

      {/* Free Trial Banner */}
      <section className="relative pt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/signup?plan=free_trial">
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/20 via-cyan-600/20 to-emerald-600/20 rounded-2xl border border-emerald-500/30 p-6 hover:border-emerald-400/50 transition-all duration-300 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-white">Start with 100 Free Leads</h3>
                    <p className="text-sm text-gray-400">Try our AI research & email writing - no credit card required</p>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0 whitespace-nowrap group-hover:scale-105 transition-transform">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative pt-12 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
              <Sparkles className="w-4 h-4 mr-2" />
              Simple Pricing
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
              <span className="text-white">Simple, Transparent</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
              No hidden fees, no surprises. Choose the plan that fits your team size and scale as you grow.
            </p>
            
            {/* Monthly/Annual Toggle */}
            <div className="flex items-center justify-center space-x-4 animate-fade-in-up" style={{animationDelay: '300ms'}}>
              <span className={`text-sm ${!isAnnual ? 'text-white font-medium' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-white font-medium' : 'text-gray-500'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Save 10%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white/[0.02] rounded-2xl border p-8 transition-all duration-300 hover-lift ${
                  plan.popular 
                    ? 'border-violet-500/50 scale-105 shadow-xl shadow-violet-500/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className="text-center pb-8">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-violet-400 mt-1">{plan.tagline}</p>
                  <p className="text-gray-400 mt-2">{plan.description}</p>
                  <div className="mt-6">
                    <div className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {plan.monthlyPrice === 0 ? 'Free' : plan.priceRange ? `${plan.currency}${plan.priceRange}` : `${plan.currency}${isAnnual ? plan.annualPrice : plan.monthlyPrice}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {plan.monthlyPrice === 0 ? 'No credit card required' : `per month${isAnnual && !plan.priceRange ? ', billed annually' : ''}`}
                    </div>
                    {isAnnual && !plan.priceRange && plan.monthlyPrice > plan.annualPrice && (
                      <div className="text-sm text-emerald-400 mt-1">
                        Save {plan.currency}{(plan.monthlyPrice - plan.annualPrice) * 12}/year
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">What you're buying:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <h4 className="font-semibold text-gray-400">Limitations:</h4>
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="h-5 w-5 flex-shrink-0 mt-0.5 flex items-center">
                            <div className="h-0.5 w-3 bg-gray-600 rounded"></div>
                          </div>
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-6">
                    <Link href="/signup">
                      <Button 
                        className={`w-full group ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25' 
                            : plan.monthlyPrice === 0
                            ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25'
                            : 'bg-white/10 hover:bg-white/20 border border-white/10'
                        }`}
                        size="lg"
                      >
                        {plan.monthlyPrice === 0 ? 'Start Free Trial' : `Start ${plan.name} Plan`}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-white">Add-ons & Usage</h2>
            <p className="text-xl text-gray-400">Scale your usage with transparent add-on pricing</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white/[0.02] rounded-xl border border-white/10 p-6 text-center hover:border-violet-500/30 transition-all duration-300 hover-lift">
                <h3 className="font-semibold text-white mb-2">{addon.name}</h3>
                <div className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">{addon.price}</div>
                <p className="text-sm text-gray-400">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Teaser */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl border border-cyan-500/30 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Calculate Your ROI</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                See how much revenue ConnectLead can generate for your business
              </p>
            </div>
            
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4 text-left">
                  <h3 className="font-semibold text-white">Your inputs:</h3>
                  {roiInputs.map((input, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-400">{input.label}:</span>
                      <span className="font-medium text-white">{input.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 text-left">
                  <h3 className="font-semibold text-white">Projected results:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly meetings:</span>
                      <span className="font-bold text-violet-400">80</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly revenue:</span>
                      <span className="font-bold text-emerald-400">£120,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ROI:</span>
                      <span className="font-bold text-fuchsia-400">240x</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/demo">
                <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25">
                  Try Full ROI Calculator
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400">Everything you need to know about our pricing</p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/[0.02] rounded-xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="h-5 w-5 text-violet-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Need Something Custom?</h2>
              <p className="text-xl text-gray-400 mb-8">
                For enterprise teams with custom requirements, we offer tailored solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25">
                    Contact Sales
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    Book a Demo
                  </Button>
                </Link>
              </div>
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
