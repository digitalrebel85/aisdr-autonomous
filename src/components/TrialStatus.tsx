"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Mail, 
  ArrowRight, 
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { getTrialUsage, calculateTrialProgress, getTrialExpirationMessage, type TrialUsage } from '@/lib/trial';
import { createClient } from '@/utils/supabase/client';

export default function TrialStatus() {
  const [usage, setUsage] = useState<TrialUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const trialUsage = await getTrialUsage(user.id);
      setUsage(trialUsage);
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const progress = calculateTrialProgress(usage);
  const expirationMessage = getTrialExpirationMessage(usage);

  // Determine urgency level
  const isUrgent = progress.overallProgress > 75;
  const isCritical = progress.overallProgress > 90 || usage.isExpired;

  return (
    <Card className={`border-2 ${
      isCritical ? 'border-red-300 bg-red-50' : 
      isUrgent ? 'border-yellow-300 bg-yellow-50' : 
      'border-blue-300 bg-blue-50'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            {usage.isExpired ? (
              <>
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Trial Expired
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Free Trial Active
              </>
            )}
          </CardTitle>
          {!usage.isExpired && (
            <Badge variant={isCritical ? 'destructive' : isUrgent ? 'warning' : 'default'}>
              {Math.round(100 - progress.overallProgress)}% Remaining
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {usage.isExpired ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">{expirationMessage}</p>
            <Link href="/pricing">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Time Remaining */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-gray-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Days Remaining
                </span>
                <span className="font-semibold text-gray-900">
                  {usage.daysRemaining} / 14 days
                </span>
              </div>
              <Progress value={progress.timeProgress} className="h-2" />
            </div>

            {/* Leads Remaining */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-gray-700">
                  <Users className="w-4 h-4 mr-2" />
                  Lead Enrichments
                </span>
                <span className="font-semibold text-gray-900">
                  {usage.leadsUsed} / 50 leads
                </span>
              </div>
              <Progress value={progress.leadsProgress} className="h-2" />
            </div>

            {/* Emails Remaining */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-gray-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Emails Sent
                </span>
                <span className="font-semibold text-gray-900">
                  {usage.emailsUsed} / 100 emails
                </span>
              </div>
              <Progress value={progress.emailsProgress} className="h-2" />
            </div>

            {/* Upgrade CTA */}
            {isUrgent && (
              <div className="pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-700 mb-3">
                  {isCritical 
                    ? "You're almost out of trial credits! Upgrade now to avoid interruption."
                    : "Love what you're seeing? Upgrade for unlimited access."}
                </p>
                <Link href="/pricing">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View Pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Success Message for Low Usage */}
            {!isUrgent && (
              <div className="pt-4 border-t border-gray-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      You're off to a great start!
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Keep exploring all the features. Upgrade anytime for unlimited access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

