import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  CheckCircle,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Play,
  Users
} from 'lucide-react';

// Import images
import logoConcept from '../assets/connectlead_logo_concept.png';
import heroImageMain from '../assets/hero_image_main.png';

const WebinarPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
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
    }, 1500);
  };

  const webinarDetails = {
    title: "How to Replace Your SDR Team with AI and 3X Your Results",
    date: "August 15, 2025",
    time: "11:00 AM PT / 2:00 PM ET",
    duration: "45 minutes + Q&A",
    host: "Michael Chen, CEO of ConnectLead",
    spots: "Limited to 100 attendees"
  };

  const learningPoints = [
    "The true cost of traditional SDR teams (including hidden costs)",
    "How AI automation delivers 3X more qualified meetings at 70% lower cost",
    "Real case studies from companies that have made the switch",
    "Step-by-step implementation roadmap for your organization",
    "Live Q&A with AI SDR automation experts"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logoConcept} alt="ConnectLead" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        {!submitted ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    FREE LIVE WEBINAR
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                    {webinarDetails.title}
                  </h1>
                  <p className="mt-4 text-xl text-gray-600">
                    Join us to discover how leading companies are using AI to automate 
                    their SDR function and achieve breakthrough results.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Date</div>
                      <div className="text-gray-600">{webinarDetails.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Time</div>
                      <div className="text-gray-600">{webinarDetails.time}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Host</div>
                      <div className="text-gray-600">{webinarDetails.host}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Availability</div>
                      <div className="text-gray-600">{webinarDetails.spots}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    You'll Learn:
                  </h2>
                  <ul className="space-y-3">
                    {learningPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:hidden">
                  <img 
                    src={heroImageMain} 
                    alt="ConnectLead AI SDR Dashboard" 
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Right Column - Form */}
              <div>
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Reserve Your Spot
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Limited to 100 attendees - Register now!
                      </p>
                    </div>
                    
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
                      
                      <div>
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input 
                          id="jobTitle" 
                          value={jobTitle} 
                          onChange={(e) => setJobTitle(e.target.value)} 
                          placeholder="Sales Director"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Register Now - It\'s Free'}
                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                      
                      <p className="text-xs text-gray-500 text-center">
                        We respect your privacy. Your information will never be sold or shared.
                      </p>
                    </form>
                  </CardContent>
                </Card>

                <div className="mt-6 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span>Can't make it? Register anyway and we'll send you the recording.</span>
                  </div>
                </div>
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
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="py-12 space-y-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  You're Registered!
                </h2>
                <p className="mt-2 text-xl text-gray-600">
                  Thank you for registering for our webinar.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Webinar Details:</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-gray-600">{webinarDetails.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Time</div>
                      <div className="text-gray-600">{webinarDetails.time}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-gray-600 mb-4">
                  We've sent a calendar invitation to your email. 
                  Add it to your calendar to make sure you don't miss it!
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add to Calendar
                </Button>
              </div>
              
              <div className="pt-8 border-t border-gray-200">
                <p className="text-gray-600 mb-4">
                  Want to see ConnectLead in action before the webinar?
                </p>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Book a Private Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

export default WebinarPage;

