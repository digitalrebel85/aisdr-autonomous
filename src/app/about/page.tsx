'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ArrowRight,
  Target,
  Heart,
  Zap,
  Users,
  Rocket,
  Award,
  Globe,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Customer First",
      description: "Every decision we make starts with how it will benefit our customers and help them succeed."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We push the boundaries of what's possible with AI to deliver cutting-edge solutions."
    },
    {
      icon: Heart,
      title: "Transparency",
      description: "We believe in honest communication and building trust through openness."
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Great products are built by great teams working together towards a common goal."
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50M+", label: "Emails Sent" },
    { value: "500K+", label: "Meetings Booked" },
    { value: "98%", label: "Customer Satisfaction" }
  ];

  const team = [
    { name: "Alex Chen", role: "CEO & Co-Founder", image: "/team/alex.jpg" },
    { name: "Sarah Johnson", role: "CTO & Co-Founder", image: "/team/sarah.jpg" },
    { name: "Michael Park", role: "VP of Engineering", image: "/team/michael.jpg" },
    { name: "Emily Davis", role: "VP of Sales", image: "/team/emily.jpg" }
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
              <Link href="/about" className="text-white font-medium">About</Link>
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
      <section className="relative pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 animate-fade-in-up">
            <Sparkles className="w-4 h-4 mr-2" />
            Our Story
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mt-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <span className="text-white">Building the Future of</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Sales Development</span>
          </h1>
          <p className="text-xl text-gray-400 mt-6 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
            We started ConnectLead with a simple mission: help sales teams spend less time on repetitive tasks 
            and more time building meaningful relationships with prospects.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                <Rocket className="w-4 h-4 mr-2" />
                Our Mission
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mt-4 mb-6">
                Empowering Sales Teams with AI
              </h2>
              <p className="text-gray-400 text-lg mb-6">
                We believe that AI should augment human capabilities, not replace them. Our platform handles 
                the time-consuming tasks of prospecting, outreach, and follow-ups, so your team can focus 
                on what they do best: closing deals.
              </p>
              <p className="text-gray-400 text-lg">
                Founded in 2023, ConnectLead has quickly become the go-to solution for companies looking 
                to scale their sales development efforts without scaling their headcount.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 text-center hover:border-violet-500/30 transition-all duration-300"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-20 bg-gradient-to-b from-transparent via-violet-600/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              <Heart className="w-4 h-4 mr-2" />
              Our Values
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-4">
              What We Stand For
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300 hover-lift"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-xl border border-violet-500/30 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl animate-glow-pulse"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Sales?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join thousands of companies using ConnectLead to automate their sales development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-violet-500/25">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 py-6 text-lg">
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
