// src/app/dashboard/offers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Offer {
  id: number;
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value_proposition: '',
    call_to_action: '',
    hook_snippet: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      } else {
        console.error('Failed to fetch offers:', response.status);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      value_proposition: '',
      call_to_action: '',
      hook_snippet: ''
    });
    setEditingOffer(null);
    setShowCreateForm(false);
  };

  const handleEdit = (offer: Offer) => {
    setFormData({
      name: offer.name,
      description: offer.description || '',
      value_proposition: offer.value_proposition || '',
      call_to_action: offer.call_to_action || '',
      hook_snippet: offer.hook_snippet || ''
    });
    setEditingOffer(offer);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.value_proposition || !formData.call_to_action) {
      alert('Please fill in all required fields (Name, Value Proposition, Call to Action)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = editingOffer ? `/api/offers/${editingOffer.id}` : '/api/offers';
      const method = editingOffer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingOffer ? 'Offer updated successfully!' : 'Offer created successfully!');
        resetForm();
        fetchOffers();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingOffer ? 'update' : 'create'} offer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      alert('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (offerId: number, offerName: string) => {
    if (!confirm(`Are you sure you want to delete "${offerName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Offer deleted successfully!');
        fetchOffers();
      } else {
        const error = await response.json();
        alert(`Failed to delete offer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offers Management</h1>
              <p className="mt-2 text-gray-600">Create and manage your outreach offers for automated campaigns</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {showCreateForm ? 'Cancel' : '+ New Offer'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingOffer ? 'Edit Offer' : 'Create New Offer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Free SEO Audit"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hook Snippet
                  </label>
                  <input
                    type="text"
                    value={formData.hook_snippet}
                    onChange={(e) => setFormData({ ...formData, hook_snippet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., I noticed your website could rank higher..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of what this offer includes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value Proposition *
                </label>
                <textarea
                  value={formData.value_proposition}
                  onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="What value do you provide? What problems do you solve? What results can they expect?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call to Action *
                </label>
                <textarea
                  value={formData.call_to_action}
                  onChange={(e) => setFormData({ ...formData, call_to_action: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="What do you want them to do next? (e.g., Book a call, Reply to this email, Visit your website)"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Offers List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Offers ({offers.length})</h2>
          </div>
          
          {offers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {offers.map((offer) => (
                <div key={offer.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{offer.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          Active
                        </span>
                      </div>
                      
                      {offer.description && (
                        <p className="text-gray-600 mb-3">{offer.description}</p>
                      )}
                      
                      {offer.hook_snippet && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Hook: </span>
                          <span className="text-sm text-gray-600 italic">"{offer.hook_snippet}"</span>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Value Proposition: </span>
                        <span className="text-sm text-gray-600">{offer.value_proposition}</span>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Call to Action: </span>
                        <span className="text-sm text-gray-600">{offer.call_to_action}</span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created: {new Date(offer.created_at).toLocaleDateString()}
                        {offer.updated_at !== offer.created_at && (
                          <span> • Updated: {new Date(offer.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(offer)}
                        className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id, offer.name)}
                        className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-400">💼</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
              <p className="text-gray-500 mb-4">Create your first offer to use in automated campaigns</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Your First Offer
              </button>
            </div>
          )}
        </div>

        <nav className="flex justify-center pt-6">
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Back to Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
}
