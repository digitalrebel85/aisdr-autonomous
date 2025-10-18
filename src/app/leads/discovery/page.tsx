"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Users,
  Building2,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function ApolloDiscoveryPage() {

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Coming Soon Card */}
          <Card className="shadow-lg border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-12">
              {/* Icon */}
              <div className="mb-8">
                <div className="relative">
                  <Target className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-yellow-400 rounded-full p-2">
                      <Clock className="w-6 h-6 text-yellow-800" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Lead Discovery
              </h1>
              
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-lg font-semibold mb-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Coming Soon
              </div>

              {/* Description */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We're working on an amazing lead discovery system that will automatically find 
                high-quality prospects based on your ideal customer profile. This feature is temporarily 
                paused while we focus on perfecting the user experience.
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Search className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Smart Discovery</h3>
                  <p className="text-sm text-gray-600">AI-powered lead matching</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Quality Contacts</h3>
                  <p className="text-sm text-gray-600">Verified professional data</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Building2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Company Intel</h3>
                  <p className="text-sm text-gray-600">Rich organizational insights</p>
                </div>
              </div>

              {/* Current Alternative */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">In the meantime...</h3>
                <p className="text-blue-800 mb-4">
                  Please continue uploading your leads manually using our existing import tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/leads">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go to Lead Database
                    </Button>
                  </Link>
                  <Link href="/leads/upload">
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                      Upload Leads Manually
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Timeline */}
              <div className="text-sm text-gray-500">
                <p>We appreciate your patience as we build something amazing!</p>
                <p className="mt-1">Stay tuned for updates on this exciting feature.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
