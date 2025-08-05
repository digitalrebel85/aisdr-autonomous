'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MegaMenu from '@/components/MegaMenu';
import { 
  ArrowRight,
  Shield,
  Lock,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  Mail,
  Award,
  Zap,
  Database,
  Server,
  Key,
  UserCheck,
  Clock,
  Settings,
  Globe,
  Building2
} from 'lucide-react';

export default function TrustSecurityPage() {
  const [selectedTab, setSelectedTab] = useState('security');

  const tabs = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'compliance', label: 'Compliance', icon: FileText },
    { id: 'availability', label: 'Availability', icon: Zap }
  ];

  const securityFeatures = [
    {
      title: 'SOC 2 Type II Certified',
      description: 'Independently audited and certified for security, availability, and confidentiality controls.',
      icon: Award,
      status: 'Certified'
    },
    {
      title: 'Enterprise-Grade Encryption',
      description: 'AES-256 encryption for data at rest and TLS 1.3 for data in transit.',
      icon: Lock,
      status: 'Active'
    },
    {
      title: 'Zero Trust Architecture',
      description: 'Every access request is verified, authenticated, and authorized before granting access.',
      icon: Shield,
      status: 'Implemented'
    },
    {
      title: 'Regular Security Audits',
      description: 'Quarterly penetration testing and continuous vulnerability assessments.',
      icon: UserCheck,
      status: 'Ongoing'
    }
  ];

  const privacyFeatures = [
    {
      title: 'GDPR Compliant',
      description: 'Full compliance with EU General Data Protection Regulation requirements.',
      icon: Globe,
      status: 'Compliant'
    },
    {
      title: 'Data Minimization',
      description: 'We only collect and process data necessary for service functionality.',
      icon: Database,
      status: 'Policy'
    },
    {
      title: 'Data Retention Controls',
      description: 'Automated data retention policies with configurable deletion schedules.',
      icon: Clock,
      status: 'Automated'
    },
    {
      title: 'Consent Management',
      description: 'Granular consent controls for data processing and communication preferences.',
      icon: Settings,
      status: 'Implemented'
    }
  ];

  const complianceStandards = [
    { name: 'SOC 2 Type II', description: 'Security, Availability, and Confidentiality', status: 'Certified', icon: Award },
    { name: 'GDPR', description: 'EU General Data Protection Regulation', status: 'Compliant', icon: Globe },
    { name: 'CCPA', description: 'California Consumer Privacy Act', status: 'Compliant', icon: Shield },
    { name: 'ISO 27001', description: 'Information Security Management', status: 'In Progress', icon: FileText },
    { name: 'HIPAA', description: 'Healthcare Information Portability', status: 'Available', icon: Building2 },
    { name: 'PCI DSS', description: 'Payment Card Industry Data Security', status: 'Compliant', icon: Lock }
  ];

  const availabilityMetrics = [
    { metric: '99.9%', label: 'Uptime SLA', description: 'Guaranteed service availability', icon: Zap },
    { metric: '< 100ms', label: 'Response Time', description: 'Global CDN ensures fast response', icon: Globe },
    { metric: '24/7', label: 'Monitoring', description: 'Continuous monitoring with alerting', icon: Eye },
    { metric: '< 4 hours', label: 'Recovery Time', description: 'Maximum recovery time objective', icon: Clock }
  ];

  const getCurrentTabContent = () => {
    switch (selectedTab) {
      case 'security':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise-Grade Security</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                ConnectLead implements multiple layers of security controls to protect your data.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {feature.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy by Design</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We believe privacy is a fundamental right. Our platform is built with privacy-first principles.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {privacyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {feature.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Regulatory Compliance</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                ConnectLead meets the highest industry standards and regulatory requirements.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complianceStandards.map((standard, index) => {
                const IconComponent = standard.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{standard.name}</h4>
                      <p className="text-gray-600 mb-4">{standard.description}</p>
                      <Badge className={
                        standard.status === 'Certified' || standard.status === 'Compliant' 
                          ? "bg-green-100 text-green-800 border-green-200"
                          : standard.status === 'In Progress'
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }>
                        {standard.status}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      case 'availability':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Always Available</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our platform is built for reliability with redundant systems and continuous monitoring.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {availabilityMetrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg text-center">
                    <CardContent className="p-6">
                      <IconComponent className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-900 mb-2">{metric.metric}</div>
                      <div className="text-lg font-semibold text-gray-900 mb-2">{metric.label}</div>
                      <div className="text-sm text-gray-600">{metric.description}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
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
              Trust & Security
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Enterprise-Grade
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Security & Trust</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ConnectLead is built with security, privacy, and compliance at its core. Your data is protected by enterprise-grade security controls.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trusted by Enterprise Customers</h2>
            <p className="text-gray-600">Industry-leading certifications and compliance standards</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">SOC 2</div>
              <div className="text-xs text-gray-600">Type II</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">GDPR</div>
              <div className="text-xs text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">CCPA</div>
              <div className="text-xs text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">AES-256</div>
              <div className="text-xs text-gray-600">Encryption</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Server className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">AWS</div>
              <div className="text-xs text-gray-600">Infrastructure</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">99.9%</div>
              <div className="text-xs text-gray-600">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isSelected = selectedTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`${isSelected ? "bg-blue-600 hover:bg-blue-700" : ""} px-6 py-3`}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {getCurrentTabContent()}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Responsible Disclosure</h3>
                <p className="text-lg text-gray-600">
                  We take security seriously and welcome responsible disclosure of security vulnerabilities.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Security Research</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Coordinated vulnerability disclosure</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Bug bounty program</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Security researcher recognition</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">security@connectlead.ai</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Response within 24 hours</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Security Policy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Documentation Links */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Security Documentation</h3>
            <p className="text-lg text-gray-600">
              Access detailed documentation about our security practices and compliance standards.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h4>
                <p className="text-gray-600 mb-4">Detailed information about how we protect your data.</p>
                <Button variant="outline" size="sm">
                  View Policy
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Security Whitepaper</h4>
                <p className="text-gray-600 mb-4">Comprehensive overview of our security architecture.</p>
                <Button variant="outline" size="sm">
                  Download PDF
                  <Download className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">SOC 2 Report</h4>
                <p className="text-gray-600 mb-4">Access our latest SOC 2 Type II audit report.</p>
                <Button variant="outline" size="sm">
                  Request Access
                  <Mail className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Security You Can Trust
            </h2>
            <p className="text-xl text-green-100">
              Join thousands of companies who trust ConnectLead with their most sensitive sales data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                  Start Secure Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                  Security Demo
                  <Shield className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-green-200">
              14-day free trial • Enterprise-grade security • No credit card required
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
                Enterprise-grade AI sales development with security you can trust.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Security</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/trust" className="hover:text-white transition-colors">Trust & Security</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
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
