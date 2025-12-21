'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

export default function BlogPage() {
  const featuredPost = {
    title: "The Future of AI in Sales Development: 2025 Trends",
    excerpt: "Discover how artificial intelligence is transforming the sales development landscape and what it means for your business in 2025 and beyond.",
    author: "Alex Chen",
    date: "January 15, 2025",
    readTime: "8 min read",
    category: "AI & Technology",
    image: "/blog/ai-sales-future.jpg"
  };

  const posts = [
    {
      title: "10 Cold Email Templates That Actually Get Responses",
      excerpt: "Learn the proven email templates that our top-performing customers use to achieve 40%+ reply rates.",
      author: "Sarah Johnson",
      date: "January 12, 2025",
      readTime: "6 min read",
      category: "Email Strategy"
    },
    {
      title: "How to Build Your Ideal Customer Profile (ICP)",
      excerpt: "A step-by-step guide to defining and refining your ICP for more targeted and effective outreach.",
      author: "Michael Park",
      date: "January 10, 2025",
      readTime: "5 min read",
      category: "Strategy"
    },
    {
      title: "Email Deliverability: The Complete Guide",
      excerpt: "Everything you need to know about getting your emails into the inbox and avoiding the spam folder.",
      author: "Emily Davis",
      date: "January 8, 2025",
      readTime: "10 min read",
      category: "Deliverability"
    },
    {
      title: "Personalization at Scale: Beyond First Name",
      excerpt: "How to create truly personalized outreach that resonates with prospects without spending hours on each email.",
      author: "Alex Chen",
      date: "January 5, 2025",
      readTime: "7 min read",
      category: "Personalization"
    },
    {
      title: "The Science of Follow-Up Timing",
      excerpt: "Data-driven insights on when to send follow-up emails for maximum engagement and response rates.",
      author: "Sarah Johnson",
      date: "January 3, 2025",
      readTime: "5 min read",
      category: "Email Strategy"
    },
    {
      title: "Integrating AI SDR with Your Existing Sales Stack",
      excerpt: "Best practices for seamlessly connecting ConnectLead with your CRM, calendar, and other tools.",
      author: "Michael Park",
      date: "January 1, 2025",
      readTime: "6 min read",
      category: "Integration"
    }
  ];

  const categories = ["All", "AI & Technology", "Email Strategy", "Strategy", "Deliverability", "Personalization", "Integration"];

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
            <BookOpen className="w-4 h-4 mr-2" />
            Blog
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mt-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <span className="text-white">Sales Development</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Insights & Tips</span>
          </h1>
          <p className="text-xl text-gray-400 mt-6 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            Expert advice on AI-powered sales, email outreach, and growing your pipeline
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 rounded-3xl border border-violet-500/20 p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Featured
                </Badge>
                <h2 className="text-3xl font-bold text-white mb-4">{featuredPost.title}</h2>
                <p className="text-gray-400 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 aspect-video flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-violet-400/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <article 
                key={index}
                className="group bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover-lift"
              >
                <div className="bg-white/[0.02] aspect-video flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-violet-400/30" />
                </div>
                <div className="p-6">
                  <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs mb-3">
                    {post.category}
                  </Badge>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Get the latest sales development tips and insights delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
                <Button className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
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
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
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
