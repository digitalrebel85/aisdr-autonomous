import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sparkles,
  Brain,
  Rocket,
  Shield,
  Clock,
  TrendingUp,
  MessageSquare,
  Activity,
  CircuitBoard
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: "AI Lead Enrichment",
      description: "Automatically enrich leads with company data, intent signals, and contact information using multiple AI providers.",
      gradient: "from-violet-500 to-fuchsia-500"
    },
    {
      icon: Sparkles,
      title: "Hyper-Personalized Emails",
      description: "AI writes unique, contextual emails for each prospect based on their company, role, and pain points.",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: Bot,
      title: "Autonomous Follow-ups",
      description: "Smart sequences that adapt based on engagement. AI handles replies and escalates hot leads.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Target,
      title: "ICP Scoring",
      description: "AI scores every lead against your ideal customer profile to prioritize the best opportunities.",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: Calendar,
      title: "Auto Meeting Booking",
      description: "Qualified prospects book directly into your calendar. No back-and-forth scheduling.",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track every metric that matters. See what's working and optimize in real-time.",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { value: "3x", label: "More Qualified Demos" },
    { value: "70%", label: "Cost Reduction" },
    { value: "24/7", label: "Always Working" },
    { value: "89%", label: "Positive Reply Rate" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP Sales",
      company: "TechCorp",
      content: "From 12 meetings per month to 47. ConnectLead doesn't just book more meetings—it books better meetings.",
      metric: "+292%",
      metricLabel: "qualified meetings"
    },
    {
      name: "Mike Rodriguez", 
      role: "Founder",
      company: "GrowthLab",
      content: "We replaced our $240K SDR team with ConnectLead. Same results, 70% lower cost, zero management headaches.",
      metric: "$168K",
      metricLabel: "annual savings"
    },
    {
      name: "Emily Watson",
      role: "Head of Growth",
      company: "ScaleUp Inc", 
      content: "The personalization is scary good. Prospects think they're talking to our best SDR, not an AI.",
      metric: "89%",
      metricLabel: "positive replies"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-3xl animate-float-reverse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-cyan-600/15 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl animate-float-slow" style={{animationDelay: '1s'}}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"></div>
        
        {/* Animated particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400/40 rounded-full animate-float" style={{animationDuration: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-fuchsia-400/40 rounded-full animate-float-reverse" style={{animationDuration: '5s'}}></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-cyan-400/40 rounded-full animate-float-slow" style={{animationDuration: '6s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-violet-400/50 rounded-full animate-subtle-bounce" style={{animationDuration: '3s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 group-hover:scale-110 transition-all duration-300">
                <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">ConnectLead</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link>
              <Link href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</Link>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup">
                <Button className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 animate-fade-in-up hover:bg-white/10 hover:border-white/20 transition-all cursor-default">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-300">AI-Powered Sales Automation</span>
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-white animate-fade-in-up inline-block">Replace Your SDR Team</span>
                <br />
                <span className="gradient-text-animated inline-block animate-fade-in-up" style={{animationDelay: '200ms'}}>
                  With Autonomous AI Agents
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '400ms'}}>
                ConnectLead uses AI agents to enrich leads, write hyper-personalized emails, 
                follow up intelligently, and book qualified meetings — all on autopilot.
              </p>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up" style={{animationDelay: '600ms'}}>
              <Link href="/signup">
                <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="group bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-8 py-6 text-lg hover:scale-105 transition-all duration-300">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center animate-fade-in-up hover:scale-110 transition-transform duration-300 cursor-default"
                  style={{animationDelay: `${800 + index * 100}ms`}}
                >
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-20 px-4 animate-fade-in-scale" style={{animationDelay: '1000ms'}}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl blur-xl animate-glow-pulse"></div>
            <div className="relative bg-[#12121a] rounded-2xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500 hover:shadow-violet-500/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Live Campaign Dashboard</h3>
                    <p className="text-gray-500 text-sm">Real-time AI agent activity</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  Live
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold text-white">1,247</div>
                  <div className="text-sm text-gray-500">Leads Enriched</div>
                  <div className="text-xs text-emerald-400 mt-1">+23% this week</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold text-white">342</div>
                  <div className="text-sm text-gray-500">Emails Sent Today</div>
                  <div className="text-xs text-violet-400 mt-1">AI personalized</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold text-white">89%</div>
                  <div className="text-sm text-gray-500">Positive Replies</div>
                  <div className="text-xs text-cyan-400 mt-1">Above average</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold text-white">47</div>
                  <div className="text-sm text-gray-500">Meetings Booked</div>
                  <div className="text-xs text-fuchsia-400 mt-1">This month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-4 py-1">
              <CircuitBoard className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Everything You Need to
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> Scale Sales</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              AI agents handle the entire SDR workflow — from lead enrichment to meeting booking
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white/[0.02] rounded-2xl border border-white/5 p-6 hover:border-violet-500/30 transition-all duration-300 hover:bg-white/[0.04] hover-lift"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full bg-[#12121a] rounded-[10px] flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/0 via-fuchsia-600/0 to-cyan-600/0 group-hover:from-violet-600/5 group-hover:via-fuchsia-600/5 group-hover:to-cyan-600/5 transition-all duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 bg-gradient-to-b from-transparent via-violet-600/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-4 py-1">
              <Rocket className="w-4 h-4 mr-2" />
              Simple Process
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              How ConnectLead
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Works</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent hidden md:block"></div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl border border-violet-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-violet-500/50 transition-all duration-300 animate-subtle-bounce" style={{animationDuration: '4s'}}>
                  <Users className="w-10 h-10 text-violet-400" />
                </div>
                <div className="text-sm text-violet-400 font-medium">Step 1</div>
                <h3 className="text-2xl font-semibold text-white group-hover:text-violet-300 transition-colors">Import & Enrich</h3>
                <p className="text-gray-400">
                  Upload your leads or connect your CRM. AI agents automatically enrich with company data, intent signals, and contact info.
                </p>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-fuchsia-500/50 to-transparent hidden md:block"></div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-fuchsia-600/20 to-pink-600/20 rounded-2xl border border-fuchsia-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-fuchsia-500/50 transition-all duration-300 animate-subtle-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
                  <Mail className="w-10 h-10 text-fuchsia-400" />
                </div>
                <div className="text-sm text-fuchsia-400 font-medium">Step 2</div>
                <h3 className="text-2xl font-semibold text-white group-hover:text-fuchsia-300 transition-colors">AI Outreach</h3>
                <p className="text-gray-400">
                  AI writes hyper-personalized emails based on each prospect's company, role, and pain points. Every message is unique.
                </p>
              </div>
            </div>
            
            <div className="relative group">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-500/50 transition-all duration-300 animate-subtle-bounce" style={{animationDuration: '4s', animationDelay: '2s'}}>
                  <Calendar className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="text-sm text-cyan-400 font-medium">Step 3</div>
                <h3 className="text-2xl font-semibold text-white group-hover:text-cyan-300 transition-colors">Book Meetings</h3>
                <p className="text-gray-400">
                  AI handles follow-ups, responds to replies, and books qualified meetings directly into your calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-4 py-1">
              <Star className="w-4 h-4 mr-2" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Loved by
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"> Sales Teams</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 hover:border-amber-500/30 transition-all duration-300 hover-lift group"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" style={{transitionDelay: `${i * 50}ms`}} />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-300 leading-relaxed mb-6">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform origin-right">
                      {testimonial.metric}
                    </div>
                    <div className="text-xs text-gray-500">{testimonial.metricLabel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-xl animate-glow-pulse"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-3xl border border-white/10 p-12 text-center hover:border-white/20 transition-all duration-500">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-300">No credit card required</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Automate Your Sales?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join hundreds of sales teams using ConnectLead to book more qualified meetings with AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-8 py-6 text-lg hover:scale-105 transition-all duration-300">
                    Book a Demo
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Setup in 30 minutes • Cancel anytime • 14-day free trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <span className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">ConnectLead</span>
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
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-500">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
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
