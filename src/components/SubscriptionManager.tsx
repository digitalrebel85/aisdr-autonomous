'use client';

import React, { useState } from 'react';
import { useSubscription, useUsageCheck } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  TrendingUp, 
  Mail, 
  Users, 
  Building2,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionManager() {
  const { subscription, loading, isTrialing, isActive, daysUntilTrialEnd } = useSubscription();
  const emailUsage = useUsageCheck('emails_per_month');
  const prospectUsage = useUsageCheck('prospects_per_month');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">No Active Subscription</h3>
          </div>
          <p className="text-orange-700 mb-4">
            You don't have an active subscription. Choose a plan to get started with ConnectLead.
          </p>
          <Link href="/pricing">
            <Button className="bg-orange-600 hover:bg-orange-700">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'trialing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'past_due': return 'bg-red-100 text-red-800 border-red-200';
      case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">{subscription.plan_name} Plan</CardTitle>
                <CardDescription>
                  {subscription.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} billing
                </CardDescription>
              </div>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trial Warning */}
            {isTrialing() && (
              <div className="md:col-span-3 mb-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {daysUntilTrialEnd()} days left in your free trial
                        </p>
                        <p className="text-xs text-blue-700">
                          Trial ends on {formatDate(subscription.trial_end!)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Next Billing Date */}
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Next Billing</p>
                <p className="text-xs text-gray-600">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className="text-xs text-gray-600 capitalize">{subscription.status}</p>
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Billing</p>
                <p className="text-xs text-gray-600 capitalize">{subscription.billing_cycle}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            {isTrialing() && (
              <Link href="/pricing">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Upgrade Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button variant="outline">
              Manage Billing
            </Button>
            <Button variant="outline">
              Download Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Usage This Month</span>
          </CardTitle>
          <CardDescription>
            Track your usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Email Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Emails Sent</span>
                </div>
                <span className="text-xs text-gray-500">
                  {emailUsage.usage?.usage || 0} / {emailUsage.usage?.limit === -1 ? '∞' : emailUsage.usage?.limit || 0}
                </span>
              </div>
              {emailUsage.usage && emailUsage.usage.limit !== -1 && (
                <Progress 
                  value={emailUsage.usagePercentage} 
                  className="h-2"
                  indicatorClassName={getUsageColor(emailUsage.usagePercentage)}
                />
              )}
              {emailUsage.usage?.limit === -1 && (
                <div className="text-xs text-green-600 font-medium">Unlimited</div>
              )}
            </div>

            {/* Prospect Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Prospects</span>
                </div>
                <span className="text-xs text-gray-500">
                  {prospectUsage.usage?.usage || 0} / {prospectUsage.usage?.limit === -1 ? '∞' : prospectUsage.usage?.limit || 0}
                </span>
              </div>
              {prospectUsage.usage && prospectUsage.usage.limit !== -1 && (
                <Progress 
                  value={prospectUsage.usagePercentage} 
                  className="h-2"
                  indicatorClassName={getUsageColor(prospectUsage.usagePercentage)}
                />
              )}
              {prospectUsage.usage?.limit === -1 && (
                <div className="text-xs text-green-600 font-medium">Unlimited</div>
              )}
            </div>

            {/* Connected Inboxes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Inboxes</span>
                </div>
                <span className="text-xs text-gray-500">
                  0 / {subscription.limits.connected_inboxes === -1 ? '∞' : subscription.limits.connected_inboxes}
                </span>
              </div>
              {subscription.limits.connected_inboxes !== -1 && (
                <Progress value={0} className="h-2" />
              )}
              {subscription.limits.connected_inboxes === -1 && (
                <div className="text-xs text-green-600 font-medium">Unlimited</div>
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Team Members</span>
                </div>
                <span className="text-xs text-gray-500">
                  1 / {subscription.limits.team_members === -1 ? '∞' : subscription.limits.team_members}
                </span>
              </div>
              {subscription.limits.team_members !== -1 && (
                <Progress value={100 / subscription.limits.team_members} className="h-2" />
              )}
              {subscription.limits.team_members === -1 && (
                <div className="text-xs text-green-600 font-medium">Unlimited</div>
              )}
            </div>
          </div>

          {/* Usage Warnings */}
          <div className="mt-6 space-y-2">
            {emailUsage.usagePercentage >= 90 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      You're approaching your email limit. Consider upgrading your plan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {prospectUsage.usagePercentage >= 90 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      You're approaching your prospect limit. Consider upgrading your plan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      {subscription.plan_slug !== 'enterprise' && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Need more capacity?
                </h3>
                <p className="text-gray-600">
                  Upgrade to get higher limits, advanced features, and priority support.
                </p>
              </div>
              <Link href="/pricing">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Upgrade Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
