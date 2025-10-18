import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight, 
  CheckCircle, 
  Play,
  Star,
  Users,
  Mail,
  Bot,
  BarChart3,
  Zap,
  Target,
  MessageSquare,
  TrendingUp,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';

export default function NewLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Copy */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Powered SDR Platform
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Replace Your SDR Team with
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Intelligent AI</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  ConnectLead automates lead research, writes personalized outreach, and books qualified meetings—24/7. Get the results of a 5-person SDR team for 70% less cost.
                </p>
              </div>
              
              {/* Social Proof Numbers */}
              <div className="flex items-center space-x-8 py-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">3.2x</div>
                  <div className="text-sm text-gray-600">More Meetings</div>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">70%</div>
                  <div className="text-sm text-gray-600">Cost Reduction</div>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Always Working</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="outline" size="lg" className="px-8 py-6 text-lg w-full sm:w-auto">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">AI SDR Working</div>
                      <div className="text-sm text-gray-600">Analyzing 47 new leads...</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Lead Enrichment</span>
                      <span className="text-green-600 font-semibold">100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Personalized Emails</span>
                      <span className="text-blue-600 font-semibold">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Meetings Booked Today</span>
                      <span className="text-2xl font-bold text-gray-900">12</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">+292%</div>
                    <div className="text-xs text-gray-600">Reply Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Logos */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">Trusted by forward-thinking sales teams</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-gray-400 font-semibold text-lg">TechCorp</div>
            <div className="text-gray-400 font-semibold text-lg">GrowthLab</div>
            <div className="text-gray-400 font-semibold text-lg">ScaleUp Inc</div>
            <div className="text-gray-400 font-semibold text-lg">DataFlow</div>
            <div className="text-gray-400 font-semibold text-lg">CloudTech</div>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              The SDR Hiring Problem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hiring, training, and managing SDRs is expensive, time-consuming, and inconsistent. There's a better way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Old Way */}
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-900 mb-6">Traditional SDR Team</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-700 text-sm">✕</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">$60K+ per SDR annually</div>
                      <div className="text-sm text-gray-600">Plus benefits, equipment, training</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-700 text-sm">✕</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">3-6 months to ramp up</div>
                      <div className="text-sm text-gray-600">Lost opportunity cost during training</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-700 text-sm">✕</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Inconsistent quality</div>
                      <div className="text-sm text-gray-600">Varies by person, mood, and day</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-700 text-sm">✕</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">High turnover</div>
                      <div className="text-sm text-gray-600">Average tenure: 14-18 months</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Way */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-green-900 mb-6">ConnectLead AI SDR</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">$399/month for unlimited work</div>
                      <div className="text-sm text-gray-600">70% cost savings vs. hiring</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Live in 5-7 days</div>
                      <div className="text-sm text-gray-600">Start seeing results immediately</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Consistently excellent</div>
                      <div className="text-sm text-gray-600">AI learns and improves over time</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Never quits or takes PTO</div>
                      <div className="text-sm text-gray-600">Works 24/7/365 without breaks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              How ConnectLead Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI handles your entire SDR workflow automatically, from research to booking
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="inline-block bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-2">1</div>
                <h3 className="text-2xl font-semibold text-gray-900">Intelligent Lead Research</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our AI automatically enriches leads using multiple data sources (Apollo, Clearbit, Serper) and identifies buying signals like hiring, funding, and technology changes.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="inline-block bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-2">2</div>
                <h3 className="text-2xl font-semibold text-gray-900">Hyper-Personalized Outreach</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI generates personalized emails using proven frameworks (AIDA, PAS) with specific details from each lead's profile, recent posts, and company news.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Bot className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="inline-block bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-2">3</div>
                <h3 className="text-2xl font-semibold text-gray-900">Smart Follow-ups & Booking</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI handles all follow-ups, classifies replies by sentiment and intent, handles objections, and automatically books qualified meetings on your calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="calculator" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-gray-900">
              Calculate Your Savings
            </h2>
            <p className="text-xl text-gray-600">
              See how much you could save by switching to ConnectLead
            </p>
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Traditional SDR Team</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span>3 SDRs × $60,000/year</span>
                      <span className="font-semibold">$180,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Benefits & overhead (30%)</span>
                      <span className="font-semibold">$54,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tools & software</span>
                      <span className="font-semibold">$12,000</span>
                    </div>
                    <div className="pt-3 border-t border-gray-300 flex justify-between text-xl font-bold">
                      <span>Total Annual Cost</span>
                      <span className="text-red-600">$246,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ConnectLead AI SDR</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span>Professional Plan</span>
                      <span className="font-semibold">$4,788</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setup & training</span>
                      <span className="font-semibold">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional tools needed</span>
                      <span className="font-semibold">$0</span>
                    </div>
                    <div className="pt-3 border-t border-gray-300 flex justify-between text-xl font-bold">
                      <span>Total Annual Cost</span>
                      <span className="text-green-600">$4,788</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white rounded-lg border-2 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Your Annual Savings</div>
                    <div className="text-4xl font-bold text-green-600">$241,212</div>
                    <div className="text-sm text-gray-600 mt-1">That's 98% cost reduction</div>
                  </div>
                  <DollarSign className="w-16 h-16 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real results from real sales teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "From 12 meetings per month to 47. ConnectLead doesn't just book more meetings—it books better meetings with qualified prospects."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">SC</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah Chen</div>
                    <div className="text-sm text-gray-600">VP Sales, TechCorp</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-semibold text-green-600">+292% qualified meetings</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "We replaced our $240K SDR team with ConnectLead. Same results, 70% lower cost, zero management headaches. Best decision we made this year."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mike Rodriguez</div>
                    <div className="text-sm text-gray-600">Founder, GrowthLab</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-semibold text-green-600">$168K annual savings</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "The personalization is incredible. Prospects think they're talking to our best SDR, not an AI. Our reply rates have never been higher."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">EW</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Emily Watson</div>
                    <div className="text-sm text-gray-600">Head of Growth, ScaleUp Inc</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-semibold text-green-600">89% positive reply rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900">SOC 2 Compliant</div>
              <div className="text-sm text-gray-600">Enterprise security</div>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900">GDPR Ready</div>
              <div className="text-sm text-gray-600">Data protection</div>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900">99.9% Uptime</div>
              <div className="text-sm text-gray-600">Always available</div>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900">24/7 Support</div>
              <div className="text-sm text-gray-600">We're here to help</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Sales Development?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of companies using AI to book more meetings, close more deals, and grow faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg w-full sm:w-auto">
                Start Your 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-6 text-lg w-full sm:w-auto">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 mt-6 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/case-studies" className="hover:text-white">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2025 ConnectLead. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

