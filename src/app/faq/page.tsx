'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How does ConnectLead work?",
          answer: "ConnectLead uses AI to automate your sales development process. You connect your email accounts, upload or generate leads, and our AI writes personalized emails, sends them at optimal times, and handles follow-ups automatically. When prospects reply, our AI classifies responses and can even book meetings on your behalf."
        },
        {
          question: "How long does it take to set up?",
          answer: "Most users are up and running within 30 minutes. Simply connect your email account, set up your first campaign, and let our AI do the rest. Our onboarding wizard guides you through each step."
        },
        {
          question: "Do I need technical skills to use ConnectLead?",
          answer: "Not at all! ConnectLead is designed for sales professionals, not engineers. Our intuitive interface makes it easy to create campaigns, manage leads, and track results without any coding knowledge."
        }
      ]
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          question: "Is there a free trial?",
          answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can upgrade to a paid plan anytime during or after your trial."
        },
        {
          question: "Can I change plans at any time?",
          answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
        },
        {
          question: "What happens if I exceed my email limit?",
          answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional email volume at $0.01 per email."
        },
        {
          question: "Do you offer refunds?",
          answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with ConnectLead, contact us within 30 days of your purchase for a full refund."
        }
      ]
    },
    {
      category: "Features & Capabilities",
      questions: [
        {
          question: "How does the AI personalization work?",
          answer: "Our AI analyzes each prospect's company, role, industry, and any available data to craft personalized emails. It references specific details about their business, recent news, and pain points relevant to your offer."
        },
        {
          question: "Can I connect multiple email accounts?",
          answer: "Yes! Depending on your plan, you can connect multiple email accounts. This helps with deliverability by rotating sends across inboxes and allows team members to have their own sending accounts."
        },
        {
          question: "Does ConnectLead integrate with my CRM?",
          answer: "Yes, we integrate with popular CRMs including Salesforce, HubSpot, and Pipedrive. Leads, activities, and responses sync automatically to keep your CRM up to date."
        },
        {
          question: "How do you handle email deliverability?",
          answer: "We use multiple strategies to ensure high deliverability: inbox warming, send limits, domain reputation monitoring, and best practices for email content. Our system automatically adjusts sending patterns to maintain optimal deliverability."
        }
      ]
    },
    {
      category: "Security & Privacy",
      questions: [
        {
          question: "Is my data secure?",
          answer: "Absolutely. We use enterprise-grade security including AES-256 encryption, SOC 2 Type II compliance, and regular security audits. Your data is encrypted both in transit and at rest."
        },
        {
          question: "Do you store my email passwords?",
          answer: "No. We use OAuth 2.0 authentication, which means we never see or store your email passwords. You authenticate directly with Google or Microsoft, and we receive a secure token to access your account."
        },
        {
          question: "Are you GDPR compliant?",
          answer: "Yes, ConnectLead is fully GDPR compliant. We provide tools for data export, deletion requests, and consent management. We also comply with CCPA and other data protection regulations."
        }
      ]
    }
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
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Center
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mt-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <span className="text-white">Frequently Asked</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
          </h1>
          <p className="text-xl text-gray-400 mt-6 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            Find answers to common questions about ConnectLead
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="relative py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">{section.category}</h2>
              <div className="space-y-4">
                {section.questions.map((faq, index) => {
                  const globalIndex = faqs.slice(0, sectionIndex).reduce((acc, s) => acc + s.questions.length, 0) + index;
                  const isOpen = openIndex === globalIndex;
                  
                  return (
                    <div 
                      key={index}
                      className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all duration-300"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-white">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-violet-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Still Have Questions?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Our team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25">
                    Contact Support
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
