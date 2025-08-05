'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight,
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Mail,
  Calendar,
  Clock,
  Target,
  Zap,
  CheckCircle,
  Download,
  Send
} from 'lucide-react';

export default function ROICalculatorPage() {
  const [inputs, setInputs] = useState({
    monthlyProspects: 1000,
    emailReplyRate: 12,
    meetingBookingRate: 25,
    dealCloseRate: 15,
    averageDealValue: 5000,
    sdrSalary: 60000,
    sdrCount: 2,
    toolsCost: 500
  });

  const [results, setResults] = useState({
    currentCost: 0,
    connectLeadCost: 0,
    savings: 0,
    additionalRevenue: 0,
    totalROI: 0,
    paybackPeriod: 0,
    meetingsPerMonth: 0,
    dealsPerMonth: 0,
    revenuePerMonth: 0
  });

  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    calculateROI();
  }, [inputs]);

  const calculateROI = () => {
    // Current SDR costs (annual)
    const currentAnnualCost = (inputs.sdrSalary * inputs.sdrCount) + (inputs.toolsCost * 12);
    
    // ConnectLead costs (annual) - Pro plan
    const connectLeadAnnualCost = 297 * 12;
    
    // Current performance
    const currentMeetingsPerMonth = (inputs.monthlyProspects * inputs.emailReplyRate / 100 * inputs.meetingBookingRate / 100);
    const currentDealsPerMonth = currentMeetingsPerMonth * inputs.dealCloseRate / 100;
    const currentRevenuePerMonth = currentDealsPerMonth * inputs.averageDealValue;
    
    // ConnectLead performance (3x improvement)
    const newMeetingsPerMonth = currentMeetingsPerMonth * 3;
    const newDealsPerMonth = newMeetingsPerMonth * inputs.dealCloseRate / 100;
    const newRevenuePerMonth = newDealsPerMonth * inputs.averageDealValue;
    
    // Additional revenue from improvement
    const additionalMonthlyRevenue = newRevenuePerMonth - currentRevenuePerMonth;
    const additionalAnnualRevenue = additionalMonthlyRevenue * 12;
    
    // Savings and ROI
    const annualSavings = currentAnnualCost - connectLeadAnnualCost;
    const totalAnnualBenefit = annualSavings + additionalAnnualRevenue;
    const roi = (totalAnnualBenefit / connectLeadAnnualCost) * 100;
    const paybackPeriod = connectLeadAnnualCost / (totalAnnualBenefit / 12);

    setResults({
      currentCost: Math.round(currentAnnualCost),
      connectLeadCost: Math.round(connectLeadAnnualCost),
      savings: Math.round(annualSavings),
      additionalRevenue: Math.round(additionalAnnualRevenue),
      totalROI: Math.round(roi),
      paybackPeriod: Math.max(0.1, paybackPeriod),
      meetingsPerMonth: Math.round(newMeetingsPerMonth),
      dealsPerMonth: Math.round(newDealsPerMonth * 10) / 10,
      revenuePerMonth: Math.round(newRevenuePerMonth)
    });
  };

  const handleInputChange = (field: string, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In a real app, this would send the email to your backend
      alert('ROI report sent to your email!');
      setShowEmailCapture(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <MegaMenu />

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              ROI Calculator
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Calculate Your
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> ConnectLead ROI</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See exactly how much revenue ConnectLead can generate and costs it can save for your business. Get a personalized ROI report in under 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Inputs */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Current Situation</h2>
                <div className="space-y-6">
                  {/* Monthly Prospects */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Prospects Targeted
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={inputs.monthlyProspects}
                      onChange={(e) => handleInputChange('monthlyProspects', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>100</span>
                      <span className="font-semibold text-blue-600">{formatNumber(inputs.monthlyProspects)}</span>
                      <span>10,000</span>
                    </div>
                  </div>

                  {/* Email Reply Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Reply Rate (%)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={inputs.emailReplyRate}
                      onChange={(e) => handleInputChange('emailReplyRate', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>1%</span>
                      <span className="font-semibold text-blue-600">{inputs.emailReplyRate}%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  {/* Meeting Booking Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Booking Rate (% of replies)
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={inputs.meetingBookingRate}
                      onChange={(e) => handleInputChange('meetingBookingRate', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>5%</span>
                      <span className="font-semibold text-blue-600">{inputs.meetingBookingRate}%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Deal Close Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deal Close Rate (% of meetings)
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="1"
                      value={inputs.dealCloseRate}
                      onChange={(e) => handleInputChange('dealCloseRate', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>5%</span>
                      <span className="font-semibold text-blue-600">{inputs.dealCloseRate}%</span>
                      <span>40%</span>
                    </div>
                  </div>

                  {/* Average Deal Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average Deal Value ($)
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="500"
                      value={inputs.averageDealValue}
                      onChange={(e) => handleInputChange('averageDealValue', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>$1K</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(inputs.averageDealValue)}</span>
                      <span>$50K</span>
                    </div>
                  </div>

                  {/* Current SDR Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of SDRs
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={inputs.sdrCount}
                      onChange={(e) => handleInputChange('sdrCount', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>1</span>
                      <span className="font-semibold text-blue-600">{inputs.sdrCount}</span>
                      <span>10</span>
                    </div>
                  </div>

                  {/* SDR Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average SDR Salary (Annual)
                    </label>
                    <input
                      type="range"
                      min="40000"
                      max="100000"
                      step="5000"
                      value={inputs.sdrSalary}
                      onChange={(e) => handleInputChange('sdrSalary', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>$40K</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(inputs.sdrSalary)}</span>
                      <span>$100K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your ConnectLead ROI</h2>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {results.totalROI}%
                      </div>
                      <div className="text-sm text-gray-600">Annual ROI</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6 text-center">
                      <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {results.paybackPeriod.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Months to Payback</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Monthly Performance with ConnectLead</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Qualified Meetings:</span>
                          <span className="font-semibold text-gray-900">{formatNumber(results.meetingsPerMonth)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Closed Deals:</span>
                          <span className="font-semibold text-gray-900">{results.dealsPerMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Revenue:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(results.revenuePerMonth)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Annual Financial Impact</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current SDR Costs:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(results.currentCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ConnectLead Cost:</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(results.connectLeadCost)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Cost Savings:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(results.savings)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Additional Revenue:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(results.additionalRevenue)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-lg">
                          <span className="font-semibold text-gray-900">Total Annual Benefit:</span>
                          <span className="font-bold text-green-600">{formatCurrency(results.savings + results.additionalRevenue)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                  <Button 
                    onClick={() => setShowEmailCapture(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Get Detailed ROI Report
                  </Button>
                  
                  <Link href="/demo">
                    <Button variant="outline" className="w-full" size="lg">
                      <Calendar className="mr-2 h-5 w-5" />
                      Book a Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture Modal */}
      {showEmailCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Get Your Detailed ROI Report</CardTitle>
              <CardDescription>
                Enter your email to receive a comprehensive ROI analysis and implementation guide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    <Send className="mr-2 h-4 w-4" />
                    Send Report
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEmailCapture(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Why Companies Choose ConnectLead
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The advantages that drive real ROI for your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Higher Quality Leads</h3>
                <p className="text-gray-600">Intent data and visitor tracking ensure you're reaching prospects who are actually interested.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Faster Implementation</h3>
                <p className="text-gray-600">Get up and running in 30 minutes vs. months of hiring and training SDRs.</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Predictable Scaling</h3>
                <p className="text-gray-600">Scale your outreach volume without the complexity and cost of hiring more people.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Achieve These Results?
            </h2>
            <p className="text-xl text-blue-100">
              Join 200+ companies already using ConnectLead to transform their sales development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                  Book Live Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-200">
              14-day free trial • No credit card required • Setup in 30 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ConnectLead
              </h3>
              <p className="text-gray-400">
                AI-powered sales development that books more qualified demos automatically.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/roi-calculator" className="hover:text-white transition-colors">ROI Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compare</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/compare/apollo" className="hover:text-white transition-colors">vs Apollo</Link></li>
                <li><Link href="/compare/zoominfo" className="hover:text-white transition-colors">vs ZoomInfo</Link></li>
                <li><Link href="/compare/instantly" className="hover:text-white transition-colors">vs Instantly</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ConnectLead. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
