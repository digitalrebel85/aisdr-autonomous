import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Target, 
  Bot, 
  BarChart3, 
  ArrowRight,
  CheckCircle,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';

// Import images
import heroImageMain from '../assets/hero_image_main.png';
import logoConcept from '../assets/connectlead_logo_concept.png';

const LandingPage = () => {
  const benefits = [
    "Replace expensive SDR teams with AI automation",
    "Book 3x more qualified demos automatically", 
    "Cut sales development costs by 70%",
    "Get up and running in under 30 minutes",
    "No technical expertise required"
  ];

  const features = [
    {
      icon: Target,
      title: "Intent Data Targeting",
      description: "Identify prospects showing buying intent automatically"
    },
    {
      icon: Bot,
      title: "AI Email Writing", 
      description: "Generate personalized emails that get responses"
    },
    {
      icon: BarChart3,
      title: "Visitor Tracking",
      description: "Track website visitors and convert them to leads"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Sales, TechFlow Solutions", 
      content: "ConnectLead replaced our entire 5-person SDR team. We're now booking 3x more demos with zero manual work.",
      results: "3x more demos, $180K annual savings"
    },
    {
      name: "Marcus Rodriguez", 
      role: "Head of Growth, DataSync Pro",
      content: "ROI was immediate. We saw qualified leads coming in within the first week of setup.",
      results: "400% increase in qualified opportunities"
    }
  ];

  const urgencyElements = [
    "⚡ Setup takes less than 30 minutes",
    "🚀 See results within 7 days", 
    "💰 ROI typically achieved in first month",
    "🎯 Limited beta access - only 50 spots remaining"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logoConcept} alt="ConnectLead" className="h-8 w-auto" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Book Demo Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-red-600/20 text-red-300 border-red-500/30 text-sm">
                  🔥 LIMITED TIME: 50% Off First 3 Months
                </Badge>
                
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Replace Your Entire SDR Team with AI in 
                  <span className="text-blue-400"> 30 Minutes</span>
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  Stop paying $60K+ per SDR. ConnectLead's AI agents automatically enrich leads, 
                  write personalized emails, and book qualified demos - delivering 3x better 
                  results at 70% lower cost.
                </p>
              </div>

              {/* Key Benefits */}
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-xl font-semibold"
                >
                  Book Your Demo Now - See Results in 7 Days
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    ⚡ Free 30-minute setup • 💰 No setup fees • 🚀 Cancel anytime
                  </p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">200+</div>
                  <div className="text-xs text-gray-400">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">3x</div>
                  <div className="text-xs text-gray-400">More Demos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">70%</div>
                  <div className="text-xs text-gray-400">Cost Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">7 Days</div>
                  <div className="text-xs text-gray-400">To Results</div>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative">
              <img 
                src={heroImageMain} 
                alt="ConnectLead AI SDR Dashboard" 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Live Demo Bookings</div>
                    <div className="text-xs text-gray-600">+47 in last 24 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Stop Wasting Money on Expensive SDR Teams
            </h2>
            <p className="text-xl text-gray-600">
              The average SDR costs $60K+ annually and books only 2-3 demos per month. 
              ConnectLead's AI does the work of 5 SDRs for a fraction of the cost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Before */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center">
                  <DollarSign className="h-6 w-6 mr-2" />
                  Traditional SDR Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">5 SDRs @ $60K each</span>
                  <span className="font-semibold text-red-600">$300K/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Management overhead</span>
                  <span className="font-semibold text-red-600">$50K/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tools & software</span>
                  <span className="font-semibold text-red-600">$25K/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Training & turnover</span>
                  <span className="font-semibold text-red-600">$30K/year</span>
                </div>
                <hr className="border-red-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Annual Cost</span>
                  <span className="text-red-600">$405K</span>
                </div>
                <div className="text-center text-sm text-gray-600 mt-4">
                  📉 Average: 10-15 demos/month
                </div>
              </CardContent>
            </Card>

            {/* After */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2" />
                  ConnectLead AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">ConnectLead Platform</span>
                  <span className="font-semibold text-green-600">$7,164/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Setup & onboarding</span>
                  <span className="font-semibold text-green-600">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Management time</span>
                  <span className="font-semibold text-green-600">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Training required</span>
                  <span className="font-semibold text-green-600">$0</span>
                </div>
                <hr className="border-green-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Annual Cost</span>
                  <span className="text-green-600">$7,164</span>
                </div>
                <div className="text-center text-sm text-gray-600 mt-4">
                  📈 Average: 45-60 demos/month
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center bg-blue-50 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              Save $397,836 Annually
            </div>
            <div className="text-lg text-gray-700">
              While booking 3x more qualified demos
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              How ConnectLead Replaces Your SDR Team
            </h2>
            <p className="text-xl text-gray-600">
              Our AI handles everything your SDRs do, but better and 24/7
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Real Results from Real Companies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg italic">
                    "{testimonial.content}"
                  </p>
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm font-semibold text-blue-600 bg-blue-50 rounded px-3 py-1 inline-block">
                      {testimonial.results}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-16 bg-red-50 border-t-4 border-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              ⚠️ Limited Beta Access - Act Now
            </h2>
            <p className="text-xl text-gray-700">
              We're only accepting 50 new companies this month to ensure quality onboarding
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {urgencyElements.map((element, index) => (
                <div key={index} className="flex items-center justify-center space-x-2 bg-white rounded-lg p-3 shadow">
                  <span className="text-gray-700">{element}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
              <div className="text-2xl font-bold text-red-600 mb-2">
                Only 12 Spots Remaining
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-red-500 h-3 rounded-full" style={{width: '76%'}}></div>
              </div>
              <div className="text-sm text-gray-600">
                38 of 50 spots taken this month
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold">
              Ready to Replace Your SDR Team?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Book a 30-minute demo and see exactly how ConnectLead will transform 
              your sales development process. No commitment required.
            </p>
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-6 text-xl font-semibold"
              >
                Book Your Demo Now - It's Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              
              <div className="text-blue-100">
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <span>✓ 30-minute demo</span>
                  <span>✓ Custom ROI analysis</span>
                  <span>✓ Implementation roadmap</span>
                </div>
              </div>
            </div>

            {/* Risk Reversal */}
            <div className="bg-blue-700/50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-3">
                🛡️ Zero Risk Guarantee
              </h3>
              <p className="text-blue-100">
                If you don't see qualified demos within 30 days, we'll refund 
                your entire first month - no questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img src={logoConcept} alt="ConnectLead" className="h-6 w-auto" />
              <span className="text-gray-400">© 2024 ConnectLead. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

