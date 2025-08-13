"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface Offer {
  id: string;
  name: string;
  description: string;
  value_proposition: string;
  call_to_action: string;
  hook_snippet: string;
  created_at: string;
  updated_at: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch real offers from API
      const offersResponse = await fetch('/api/offers');
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        const transformedOffers: Offer[] = offersData.offers.map((offer: any) => ({
          id: offer.id.toString(),
          name: offer.name,
          description: offer.description || '',
          value_proposition: offer.value_proposition || '',
          call_to_action: offer.call_to_action || '',
          hook_snippet: offer.hook_snippet || '',
          created_at: offer.created_at,
          updated_at: offer.updated_at,
        }));
        setOffers(transformedOffers);
      } else {
        console.error('Failed to fetch offers');
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Offers & CTAs</h1>
              <p className="text-gray-600 mt-1">Manage your value propositions and call-to-actions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Offer
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="offers" className="w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 rounded-t-lg">
              <TabsTrigger value="offers">
                <Target className="w-4 h-4 mr-2" />
                Offers ({offers.length})
              </TabsTrigger>
              <TabsTrigger value="personas">
                <Users className="w-4 h-4 mr-2" />
                Personas (Coming Soon)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <div className="space-y-6">
              {/* Offers Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{offers.length}</div>
                    <div className="text-sm text-gray-600">Total Offers</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {offers.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Offers</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {offers.filter(o => o.value_proposition).length}
                    </div>
                    <div className="text-sm text-gray-600">With Value Props</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {offers.filter(o => o.call_to_action).length}
                    </div>
                    <div className="text-sm text-gray-600">With CTAs</div>
                  </CardContent>
                </Card>
              </div>

              {/* Offers List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {offers.map((offer) => (
                  <Card key={offer.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">{offer.name}</CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            {offer.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Value Proposition</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {offer.value_proposition}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Call to Action</h4>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                          {offer.call_to_action}
                        </p>
                      </div>

                      {offer.hook_snippet && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Hook Snippet</h4>
                          <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            {offer.hook_snippet}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">
                            Created: {new Date(offer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <Button size="sm" variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Personas Tab - Coming Soon */}
          <TabsContent value="personas">
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Personas Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    We're building intelligent persona matching to automatically personalize your outreach based on lead characteristics and proven effectiveness.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">What's Coming</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Automatic persona matching for leads</li>
                      <li>• AI-generated messaging hooks</li>
                      <li>• Performance tracking & optimization</li>
                      <li>• Dynamic personalization at scale</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
