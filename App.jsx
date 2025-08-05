import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import LandingPage from './components/LandingPage';
import LeadMagnetPage from './components/LeadMagnetPage';
import WebinarPage from './components/WebinarPage';
import { 
  Target, 
  Bot, 
  BarChart3, 
  Link as LinkIcon, 
  Zap, 
  TrendingUp,
  MessageCircle,
  Calendar,
  Eye,
  Network,
  Mail,
  Monitor,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Building,
  Briefcase,
  Menu,
  X
} from 'lucide-react';
import './App.css';

// Import images
import heroImageMain from './assets/hero_image_main.png';
import heroImageDashboard from './assets/hero_image_dashboard.png';
import logoConcept from './assets/connectlead_logo_concept.png';
import abstractGrowth from './assets/abstract_illustration_growth.png';
import testimonialBg from './assets/testimonial_background.png';

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: Target,
      title: "Precision Lead Targeting",
      description: "Use intent data and visitor tracking to identify high-quality prospects automatically."
    },
    {
      icon: Bot,
      title: "AI-Powered Automation",
      description: "Intelligent agents handle lead enrichment, email writing, and follow-ups at scale."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track performance metrics, conversion rates, and ROI with comprehensive dashboards."
    },
    {
      icon: LinkIcon,
      title: "Seamless Integrations",
      description: "Connect with your existing CRM, email platforms, and sales tools effortlessly."
    },
    {
      icon: Zap,
      title: "Lightning Fast Setup",
      description: "Get up and running in minutes, not weeks. No technical expertise required."
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "Companies see 3x more qualified demos and 70% cost reduction on average."
    }
  ];

  const stats = [
    { number: "3x", label: "More Qualified Demos" },
    { number: "70%", label: "Cost Reduction" },
    { number: "200+", label: "Happy Customers" },
    { number: "24/7", label: "AI Automation" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Sales",
      company: "TechFlow Solutions",
      content: "ConnectLead transformed our SDR process completely. We're booking 3x more demos with half the manual effort.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Growth",
      company: "DataSync Pro",
      content: "The AI automation is incredible. Our team can focus on closing deals instead of manual prospecting.",
      rating: 5
    },
    {
      name: "Jennifer Walsh",
      role: "Sales Operations Director",
      company: "CloudScale Enterprise",
      content: "ROI was immediate. We saw results within the first week and haven't looked back since.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$297",
      period: "/month",
      description: "Perfect for small teams getting started with AI SDR",
      features: [
        "Up to 1,000 leads/month",
        "Basic AI automation",
        "Email sequences",
        "CRM integration",
        "Standard support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$597",
      period: "/month",
      description: "Ideal for growing companies scaling their outreach",
      features: [
        "Up to 5,000 leads/month",
        "Advanced AI automation",
        "Intent data tracking",
        "Visitor identification",
        "Custom workflows",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with complex requirements",
      features: [
        "Unlimited leads",
        "Full AI automation suite",
        "Custom integrations",
        "Dedicated success manager",
        "White-label options",
        "24/7 premium support"
      ],
      popular: false
    }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <img src={logoConcept} alt="ConnectLead" className="h-8 w-auto" />
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <Link to="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Home
                  </Link>
                  <Link to="/features" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Features
                  </Link>
                  <Link to="/pricing" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Pricing
                  </Link>
                  <Link to="/about" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    About
                  </Link>
                </div>
              </div>

              {/* CTA Button */}
              <div className="hidden md:block">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Book a Demo
                </Button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                <Link to="/" className="text-gray-900 block px-3 py-2 text-base font-medium">
                  Home
                </Link>
                <Link to="/features" className="text-gray-600 block px-3 py-2 text-base font-medium">
                  Features
                </Link>
                <Link to="/pricing" className="text-gray-600 block px-3 py-2 text-base font-medium">
                  Pricing
                </Link>
                <Link to="/about" className="text-gray-600 block px-3 py-2 text-base font-medium">
                  About
                </Link>
                <div className="px-3 py-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Book a Demo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/lead-magnet" element={<LeadMagnetPage />} />
          <Route path="/webinar" element={<WebinarPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  );

  function HomePage() {
    return (
      <>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                    🚀 Transform Your Sales Development
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                    Replace Your Entire{' '}
                    <span className="text-blue-400">SDR Team</span>{' '}
                    with AI Automation
                  </h1>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    ConnectLead uses AI agents to intelligently automate SDR activities at scale. 
                    Enrich leads, write personalized emails, follow up strategically, and reply to 
                    all emails - increasing efficiency while saving companies money.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl lg:text-3xl font-bold text-blue-400">{stat.number}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    Book a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                    Watch Demo Video
                  </Button>
                </div>
              </div>

              {/* Right Column - Hero Image */}
              <div className="relative">
                <img 
                  src={heroImageMain} 
                  alt="ConnectLead AI SDR Dashboard" 
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Everything You Need to Scale Your Sales Development
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                ConnectLead combines intent data, visitor tracking, and AI automation to create 
                the most powerful SDR platform on the market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-blue-600" />
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

        {/* How It Works Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                How ConnectLead Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our AI-powered platform handles your entire SDR workflow automatically
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      AI Lead Enrichment
                    </h3>
                    <p className="text-gray-600">
                      Our AI agents automatically enrich leads using intent data, visitor tracking, 
                      and your API keys to build comprehensive prospect profiles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Personalized Outreach
                    </h3>
                    <p className="text-gray-600">
                      Generate highly personalized emails based on prospect data, company information, 
                      and buying intent signals for maximum engagement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Intelligent Follow-ups
                    </h3>
                    <p className="text-gray-600">
                      AI handles all follow-up sequences, replies to emails intelligently, 
                      and escalates qualified prospects to your sales team.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <img 
                  src={heroImageDashboard} 
                  alt="ConnectLead Dashboard Features" 
                  className="w-full h-auto rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section 
          className="py-24 bg-gray-50 relative"
          style={{
            backgroundImage: `url(${testimonialBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-gray-50/90"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Trusted by 200+ Sales Teams
              </h2>
              <p className="text-xl text-gray-600">
                See what our customers are saying about ConnectLead
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-blue-600">{testimonial.company}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Sales Development?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join 200+ companies already using ConnectLead to automate their SDR processes 
              and book 3x more qualified demos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Start Free Trial
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <img src={logoConcept} alt="ConnectLead" className="h-8 w-auto" />
                <p className="text-gray-400">
                  AI-powered SDR automation platform that transforms your sales development process.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/features" className="hover:text-white">Features</Link></li>
                  <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link to="/integrations" className="hover:text-white">Integrations</Link></li>
                  <li><Link to="/api" className="hover:text-white">API</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/about" className="hover:text-white">About</Link></li>
                  <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
                  <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                  <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                  <li><Link to="/docs" className="hover:text-white">Documentation</Link></li>
                  <li><Link to="/status" className="hover:text-white">Status</Link></li>
                  <li><Link to="/security" className="hover:text-white">Security</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; 2024 ConnectLead. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </>
    );
  }

  function FeaturesPage() {
    return (
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-12">Features</h1>
          <p className="text-center text-gray-600">Features page coming soon...</p>
        </div>
      </div>
    );
  }

  function PricingPage() {
    return (
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600">Choose the plan that's right for your team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-xl' : 'border-gray-200'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-8 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function AboutPage() {
    return (
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-12">About ConnectLead</h1>
          <p className="text-center text-gray-600">About page coming soon...</p>
        </div>
      </div>
    );
  }
};

export default App;
