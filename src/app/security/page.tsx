'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ArrowRight,
  Shield,
  Lock,
  Key,
  Server,
  Eye,
  CheckCircle,
  FileCheck,
  Globe,
  Sparkles
} from 'lucide-react';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption."
    },
    {
      icon: Key,
      title: "OAuth 2.0 Authentication",
      description: "Secure authentication with major providers. We never store your email passwords."
    },
    {
      icon: Server,
      title: "SOC 2 Type II Compliant",
      description: "Our infrastructure and processes meet rigorous security and availability standards."
    },
    {
      icon: Eye,
      title: "Access Controls",
      description: "Role-based access control ensures team members only see what they need."
    },
    {
      icon: FileCheck,
      title: "Regular Audits",
      description: "Third-party security audits and penetration testing performed quarterly."
    },
    {
      icon: Globe,
      title: "GDPR Compliant",
      description: "Full compliance with GDPR, CCPA, and other data protection regulations."
    }
  ];

  const certifications = [
    "SOC 2 Type II",
    "GDPR Compliant",
    "CCPA Compliant",
    "ISO 27001",
    "HIPAA Ready"
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
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-fade-in-up">
            <Shield className="w-4 h-4 mr-2" />
            Enterprise Security
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mt-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <span className="text-white">Your Data Security is</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">Our Top Priority</span>
          </h1>
          <p className="text-xl text-gray-400 mt-6 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
            ConnectLead is built with enterprise-grade security from the ground up. 
            We protect your data with industry-leading security practices.
          </p>
        </div>
      </section>

      {/* Certifications */}
      <section className="relative py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {certifications.map((cert, index) => (
              <div 
                key={index}
                className="bg-white/[0.02] rounded-full border border-white/10 px-6 py-3 flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Security Features</h2>
            <p className="text-gray-400 mt-4">How we keep your data safe</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300 hover-lift"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-xl border border-emerald-500/30 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Handling */}
      <section className="relative py-20 bg-gradient-to-b from-transparent via-emerald-600/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">How We Handle Your Data</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">We never sell your data</h3>
                  <p className="text-gray-400">Your data is yours. We never sell, rent, or share your data with third parties for marketing purposes.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Minimal data retention</h3>
                  <p className="text-gray-400">We only keep data as long as necessary to provide our services. You can request deletion at any time.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Transparent practices</h3>
                  <p className="text-gray-400">We're open about how we collect, use, and protect your data. Read our privacy policy for details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Have Security Questions?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Our security team is happy to answer any questions about our practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="group bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-emerald-500/25">
                    Contact Security Team
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
