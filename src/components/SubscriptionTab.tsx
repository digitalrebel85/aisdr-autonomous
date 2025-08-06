'use client';

import React from 'react';
import SubscriptionManager from './SubscriptionManager';

export default function SubscriptionTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription & Billing</h2>
        <p className="text-gray-600">
          Manage your ConnectLead subscription, view usage, and update billing information.
        </p>
      </div>
      
      <SubscriptionManager />
    </div>
  );
}
