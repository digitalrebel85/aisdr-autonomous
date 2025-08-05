'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
  ArrowRight,
  Users,
  Building2,
  Briefcase,
  Mail,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  BookOpen,
  HelpCircle,
  FileText,
  Calculator,
  Trophy,
  Target,
  Layers,
  Globe,
  Settings,
  Phone,
  Star
} from 'lucide-react';

interface MegaMenuProps {
  className?: string;
}

export default function MegaMenu({ className = "" }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const menuItems = {
    product: {
      title: "Product",
      sections: [
        {
          title: "Core Platform",
          items: [
            { name: "How It Works", href: "/how-it-works", icon: Zap, description: "See AISDR in action" },
            { name: "Features", href: "/features", icon: Settings, description: "All platform capabilities" },
            { name: "Integrations", href: "/integrations", icon: Layers, description: "Connect your tools" },
            { name: "API & Webhooks", href: "/api", icon: Globe, description: "Developer resources" }
          ]
        },
        {
          title: "What's New",
          items: [
            { name: "Changelog", href: "/changelog", icon: FileText, description: "Latest updates" },
            { name: "Product Roadmap", href: "/roadmap", icon: Target, description: "What's coming next" }
          ]
        }
      ]
    },
    solutions: {
      title: "Solutions",
      sections: [
        {
          title: "By Industry",
          items: [
            { name: "SaaS Companies", href: "/saas", icon: Building2, description: "Scale your SaaS growth" },
            { name: "Agencies", href: "/agencies", icon: Briefcase, description: "White-label solutions" },
            { name: "Enterprise", href: "/enterprise", icon: Users, description: "Enterprise-grade features" }
          ]
        },
        {
          title: "By Role",
          items: [
            { name: "Sales Teams", href: "/solutions/sales", icon: Trophy, description: "Boost sales performance" },
            { name: "Marketing Teams", href: "/solutions/marketing", icon: BarChart3, description: "Generate more leads" },
            { name: "Revenue Ops", href: "/solutions/revops", icon: Target, description: "Optimize your funnel" }
          ]
        },
        {
          title: "By Company Size",
          items: [
            { name: "Startups", href: "/solutions/startups", icon: Zap, description: "Fast growth solutions" },
            { name: "SMB", href: "/solutions/smb", icon: Building2, description: "Scale efficiently" },
            { name: "Enterprise", href: "/solutions/enterprise", icon: Users, description: "Enterprise solutions" }
          ]
        }
      ]
    },
    resources: {
      title: "Resources",
      sections: [
        {
          title: "Learn",
          items: [
            { name: "Case Studies", href: "/case-studies", icon: Trophy, description: "Customer success stories" },
            { name: "ROI Calculator", href: "/roi-calculator", icon: Calculator, description: "Calculate your ROI" },
            { name: "Blog", href: "/blog", icon: FileText, description: "Sales insights & tips" },
            { name: "Webinars", href: "/webinars", icon: Calendar, description: "Live training sessions" }
          ]
        },
        {
          title: "Support",
          items: [
            { name: "Help Center", href: "/help", icon: HelpCircle, description: "Get answers fast" },
            { name: "Documentation", href: "/docs", icon: BookOpen, description: "Technical guides" },
            { name: "Status", href: "/status", icon: Shield, description: "System status" },
            { name: "Contact Support", href: "/support", icon: Phone, description: "Get help from our team" }
          ]
        }
      ]
    },
    compare: {
      title: "Compare",
      sections: [
        {
          title: "vs Competitors",
          items: [
            { name: "ConnectLead vs Apollo", href: "/compare/apollo", icon: Star, description: "See the differences" },
            { name: "ConnectLead vs ZoomInfo", href: "/compare/zoominfo", icon: Star, description: "Feature comparison" },
            { name: "ConnectLead vs Instantly", href: "/compare/instantly", icon: Star, description: "Side-by-side analysis" },
            { name: "ConnectLead vs Outreach", href: "/compare/outreach", icon: Star, description: "Platform comparison" }
          ]
        }
      ]
    }
  };

  return (
    <nav className={`bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ConnectLead
              </h1>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {Object.entries(menuItems).map(([key, menu]) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => handleMouseEnter(key)}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  {menu.title}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {/* Mega Menu Dropdown */}
                {activeMenu === key && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-screen max-w-4xl bg-white shadow-2xl border border-gray-100 rounded-lg mt-1">
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {menu.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex}>
                            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                              {section.title}
                            </h3>
                            <ul className="space-y-3">
                              {section.items.map((item, itemIndex) => {
                                const IconComponent = item.icon;
                                return (
                                  <li key={itemIndex}>
                                    <Link
                                      href={item.href}
                                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                                    >
                                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <IconComponent className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                          {item.name}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                          {item.description}
                                        </div>
                                      </div>
                                      <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Featured CTA at bottom of mega menu */}
                      <div className="border-t border-gray-100 mt-8 pt-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">Ready to get started?</h4>
                              <p className="text-sm text-gray-600 mt-1">Book a demo or start your free trial today.</p>
                            </div>
                            <div className="flex space-x-2">
                              <Link href="/demo">
                                <Button variant="outline" size="sm">
                                  Book Demo
                                </Button>
                              </Link>
                              <Link href="/signup">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  Try Free
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pricing - No dropdown */}
            <Link href="/pricing" className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Pricing
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="mr-2">
                Book Demo
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Try Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
