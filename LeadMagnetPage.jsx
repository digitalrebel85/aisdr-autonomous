import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  CheckCircle,
  Download,
  FileText,
  ArrowRight,
  Mail
} from 'lucide-react';

// Import images
import logoConcept from '../assets/connectlead_logo_concept.png';

const LeadMagnetPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate form
    if (!email || !name) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    // In a real implementation, this would send the data to a server
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // In a real implementation, you might redirect to a thank you page
      // or trigger a download
    }, 1500);
  };

  const benefits = [
    "Calculate the true cost of your SDR team (including hidden costs)",
    "Learn how AI automation delivers 3X more qualified meetings",
    "See real case studies with ROI breakdowns",
    "Get a step-by-step implementation roadmap",
    "Receive a 30-day action plan to transform your sales development"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logoConcept} alt="ConnectLead" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div>
                <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                  FREE GUIDE
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  The Ultimate Guide to AI SDR ROI
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                  Discover how to replace your SDR team with AI automation and get 
                  3X more qualified meetings at 70% lower cost.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  In this 25-page guide, you'll learn:
                </h2>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>25 Pages</span>
                </div>
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  <span>PDF Format</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  {!submitted ? (
                    <>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Download Your Free Guide
                      </h2>
                      
                      {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-4 text-sm">
                          {error}
                        </div>
                      )}
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="John Smith"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Work Email *</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="john@company.com"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="company">Company Name</Label>
                          <Input 
                            id="company" 
                            value={company} 
                            onChange={(e) => setCompany(e.target.value)} 
                            placeholder="Acme Inc."
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Get Instant Access'}
                          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                        
                        <p className="text-xs text-gray-500 text-center">
                          We respect your privacy. Your information will never be sold or shared.
                        </p>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-8 space-y-6">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Thank You!
                        </h2>
                        <p className="mt-2 text-gray-600">
                          Your guide has been sent to your email.
                        </p>
                      </div>
                      
                      <div>
                        <a 
                          href="/ConnectLead_Ultimate_Guide_to_AI_SDR_ROI.pdf" 
                          download
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Directly
                        </a>
                      </div>
                      
                      <div className="pt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Ready to see ConnectLead in action?
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          Book a Demo
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-4">TRUSTED BY SALES LEADERS FROM</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
              {/* In a real implementation, these would be actual company logos */}
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img src={logoConcept} alt="ConnectLead" className="h-6 w-auto" />
              <span className="text-gray-400">© 2024 ConnectLead. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-600">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LeadMagnetPage;

