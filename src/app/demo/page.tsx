'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ArrowRight,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Play,
  Sparkles,
  Building2,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Demo request:', formData);
  };

  const benefits = [
    "See ConnectLead in action with your use case",
    "Get personalized recommendations for your team",
    "Learn best practices from our experts",
    "No commitment required"
  ];

  const features = [
    {
      icon: Calendar,
      title: "30-Minute Demo",
      description: "Quick, focused walkthrough of key features"
    },
    {
      icon: Users,
      title: "Personalized",
      description: "Tailored to your industry and use case"
    },
    {
      icon: MessageSquare,
      title: "Q&A Session",
      description: "Get all your questions answered live"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Info */}
            <div className="space-y-8">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
                <Play className="w-4 h-4 mr-2" />
                Book a Demo
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
                <span className="text-white">See ConnectLead</span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">In Action</span>
              </h1>
              <p className="text-xl text-gray-400 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                Get a personalized walkthrough of how ConnectLead can automate your sales development 
                and book more qualified meetings.
              </p>

              <div className="space-y-4 animate-fade-in-up" style={{animationDelay: '300ms'}}>
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 animate-fade-in-up" style={{animationDelay: '400ms'}}>
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-xl border border-violet-500/30 flex items-center justify-center mb-3">
                        <IconComponent className="w-6 h-6 text-violet-400" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="animate-fade-in-up" style={{animationDelay: '200ms'}}>
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Request Your Demo</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Work Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="john@company.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      placeholder="Your Company"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Team Size</label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      required
                    >
                      <option value="" className="bg-gray-900">Select team size</option>
                      <option value="1-5" className="bg-gray-900">1-5 employees</option>
                      <option value="6-20" className="bg-gray-900">6-20 employees</option>
                      <option value="21-50" className="bg-gray-900">21-50 employees</option>
                      <option value="51-200" className="bg-gray-900">51-200 employees</option>
                      <option value="200+" className="bg-gray-900">200+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">What are you looking to achieve?</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
                      rows={3}
                      placeholder="Tell us about your goals..."
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 py-6 text-lg shadow-lg shadow-violet-500/25"
                  >
                    Book My Demo
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy" className="text-violet-400 hover:text-violet-300">Privacy Policy</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12 mt-20">
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
