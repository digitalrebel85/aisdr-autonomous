// Calendly-Style Public Booking Page
// Professional calendar booking interface with side-by-side layout

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TimeSlot {
  slot_start: string;
  slot_end: string;
  available: boolean;
}

interface BookingLink {
  title: string;
  description: string;
  duration: number;
  timezone: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasAvailability: boolean;
  isPast: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [bookingLink, setBookingLink] = useState<BookingLink | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
  });

  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
    bookingId?: number;
  } | null>(null);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate]);

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const loadAvailability = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/booking/availability?slug=${slug}&date=${selectedDate}&timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`
      );

      if (response.ok) {
        const data = await response.json();
        setBookingLink(data.bookingLink);
        setAvailableSlots(data.slots || []);
      } else {
        console.error('Failed to load availability');
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedSlot || !formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingSlug: slug,
          leadName: formData.name,
          leadEmail: formData.email,
          leadCompany: formData.company,
          leadPhone: formData.phone,
          startTime: selectedSlot.slot_start,
          endTime: selectedSlot.slot_end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes: formData.notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBookingResult({
          success: true,
          message: 'Your call has been scheduled successfully!',
          bookingId: result.bookingId,
        });
        setStep('confirmation');
      } else {
        setBookingResult({
          success: false,
          message: result.error || 'Failed to schedule call',
        });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingResult({
        success: false,
        message: 'An error occurred while scheduling your call',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && !bookingLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (!bookingLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Link Not Found</h1>
          <p className="text-gray-600">The booking link you're looking for doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  // Show confirmation screen
  if (bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            {bookingResult?.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Call Scheduled!</h1>
                <p className="text-gray-600 mb-6">{bookingResult.message}</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Meeting Details</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {formatDate(selectedSlot?.slot_start || '')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Time:</strong> {formatTime(selectedSlot?.slot_start || '')} - {formatTime(selectedSlot?.slot_end || '')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Duration:</strong> {bookingLink.duration} minutes
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  You should receive a calendar invitation shortly. If you need to reschedule or cancel, please contact us directly.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Failed</h1>
                <p className="text-gray-600 mb-6">{bookingResult?.message}</p>
                <button
                  onClick={() => {
                    setStep('details');
                    setBookingResult(null);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Anything you'd like us to know before the call?"
              />
            </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Date</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setStep('time')}
                    disabled={!selectedDate}
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 'time' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Select a Time for {formatDate(selectedDate)}
                </h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading available times...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSlots.filter(slot => slot.available).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 text-sm border rounded-md transition-colors ${
                          selectedSlot === slot
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {formatTime(slot.slot_start)}
                      </button>
                    ))}
                  </div>
                )}
                {!loading && availableSlots.filter(slot => slot.available).length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No available times for this date. Please select a different date.
                  </p>
                )}
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep('date')}
                    className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('details')}
                    disabled={!selectedSlot}
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 'details' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
                
                {selectedSlot && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <h3 className="font-medium text-blue-900">Selected Time</h3>
                    <p className="text-blue-700">
                      {formatDate(selectedSlot.slot_start)} at {formatTime(selectedSlot.slot_start)} - {formatTime(selectedSlot.slot_end)}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Anything you'd like us to know before the call?"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep('time')}
                    className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={submitting || !formData.name || !formData.email}
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Call'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
