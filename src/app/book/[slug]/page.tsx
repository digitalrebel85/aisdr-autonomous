// Calendly-Style Public Booking Page
// Professional calendar booking interface with side-by-side layout

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
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
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [displayTimezone, setDisplayTimezone] = useState<string>('');

  // Popular timezone options for dropdown
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'UTC', label: 'UTC' },
  ];

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

  // Auto-detect user's timezone on page load
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(detectedTimezone);
    
    // Check if user has a saved preference
    const savedTimezone = localStorage.getItem('booking-display-timezone');
    if (savedTimezone) {
      setDisplayTimezone(savedTimezone);
    } else {
      setDisplayTimezone(detectedTimezone);
    }
  }, []);

  // Save timezone preference when changed
  const handleTimezoneChange = (newTimezone: string) => {
    setDisplayTimezone(newTimezone);
    localStorage.setItem('booking-display-timezone', newTimezone);
    
    // Reload slots with new timezone if date is selected
    if (selectedDate) {
      loadAvailability(selectedDate);
    }
  };

  // Simplified timezone conversion utility
  const convertTimeToTimezone = (timeString: string, fromTimezone: string, toTimezone: string, date: Date) => {
    try {
      // If same timezone, no conversion needed
      if (fromTimezone === toTimezone) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      }

      // Create a date object with the time in the source timezone
      const dateStr = date.toISOString().split('T')[0];
      const [hours, minutes] = timeString.split(':');
      
      // Create a temporary date to work with timezone conversion
      const tempDate = new Date();
      tempDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      tempDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Format in target timezone
      return tempDate.toLocaleTimeString('en-US', {
        timeZone: toTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error converting timezone:', error);
      // Fallback to simple formatting
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  const getTimezoneLabel = (timezone: string) => {
    const option = timezoneOptions.find(opt => opt.value === timezone);
    return option ? option.label : timezone;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        isSelected: selectedDate ? currentDate.getTime() === selectedDate.getTime() : false,
        hasAvailability: true, // Will be updated with real availability
        isPast: currentDate < today,
      });
    }
    
    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const selectDate = (date: Date) => {
    if (date < new Date()) return; // Don't allow past dates
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowForm(false);
  };

  const loadAvailability = async (date: Date) => {
    if (!date) return;

    try {
      setLoadingSlots(true);
      // Convert date to YYYY-MM-DD format without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const response = await fetch(
        `/api/booking/availability?slug=${slug}&date=${dateString}&timezone=${displayTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone}`
      );

      if (response.ok) {
        const data = await response.json();
        if (!bookingLink) {
          setBookingLink(data.bookingLink);
        }
        // Map API response to frontend format
        const mappedSlots = (data.slots || []).map((slot: any) => ({
          start_time: slot.start,
          end_time: slot.end,
          is_available: slot.available
        }));
        setAvailableSlots(mappedSlots);
      } else {
        console.error('Failed to load availability');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
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
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    try {
      // Extract time from datetime string if needed (e.g., "2025-08-05T09:00:00" -> "09:00")
      let timeOnly = timeString;
      if (timeString.includes('T')) {
        timeOnly = timeString.split('T')[1].substring(0, 5); // Get HH:MM part
      }
      
      // Default to Europe/London if no timezone is set (since working hours are in London time)
      const sourceTimezone = bookingLink?.timezone && bookingLink.timezone !== 'UTC' 
        ? bookingLink.timezone 
        : 'Europe/London';
      
      if (!displayTimezone) {
        // Fallback to simple formatting if display timezone not available
        const [hours, minutes] = timeOnly.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      }

      // Convert from booking link timezone to display timezone
      if (selectedDate) {
        return convertTimeToTimezone(
          timeOnly,
          sourceTimezone,
          displayTimezone,
          selectedDate
        );
      }

      return timeOnly;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // Load initial booking link info
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow);
        setCurrentMonth(tomorrow);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, slug]);

  // Show confirmation screen
  if (bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            {bookingResult.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">You're scheduled!</h1>
                <p className="text-gray-600 mb-6">{bookingResult.message}</p>
                {selectedSlot && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Meeting Details</h3>
                    <p className="text-sm text-blue-700">
                      <strong>Date:</strong> {selectedDate ? formatDate(selectedDate) : ''}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Time:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Duration:</strong> {bookingLink?.duration} minutes
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  A calendar invitation has been sent to your email. We look forward to speaking with you!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Failed</h1>
                <p className="text-gray-600 mb-6">{bookingResult.message}</p>
                <button
                  onClick={() => {
                    setBookingResult(null);
                    setShowForm(false);
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
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

  const calendarDays = getDaysInMonth(currentMonth);
  const availableSlotsList = availableSlots.filter(slot => slot.is_available);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {bookingLink.title}
            </h1>
            {bookingLink.description && (
              <p className="mt-2 text-gray-600">{bookingLink.description}</p>
            )}
            <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {bookingLink.duration} minutes
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video call
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Select a Date</h2>
            </div>
            
            {/* Timezone Selector */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Timezone:</span>
                </div>
                <select
                  value={displayTimezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {userTimezone !== displayTimezone && (
                <p className="text-xs text-gray-500 mt-1">
                  Your detected timezone: {getTimezoneLabel(userTimezone)}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
                  {formatMonth(currentMonth)}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => selectDate(day.date)}
                  disabled={day.isPast || !day.isCurrentMonth}
                  className={`
                    p-3 text-sm rounded-lg transition-all duration-200 relative
                    ${
                      day.isPast || !day.isCurrentMonth
                        ? 'text-gray-300 cursor-not-allowed'
                        : day.isSelected
                        ? 'bg-blue-600 text-white shadow-lg'
                        : day.isToday
                        ? 'bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day.date.getDate()}
                  {day.hasAvailability && !day.isPast && day.isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {selectedDate ? `Available Times - ${formatDate(selectedDate)}` : 'Select a date to see available times'}
            </h2>

            {selectedDate && (
              <>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading available times...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableSlots.filter(slot => slot.is_available).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setShowForm(true);
                        }}
                        className={`
                          w-full p-3 text-left rounded-lg border transition-all duration-200
                          ${
                            selectedSlot === slot
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }
                        `}
                      >
                        <div className="font-medium">
                          {formatTime(slot.start_time)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bookingLink.duration} minutes
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">No available times for this date</p>
                    <p className="text-sm text-gray-400 mt-1">Please select a different date</p>
                  </div>
                )}
              </>
            )}

            {/* Booking Form */}
            {showForm && selectedSlot && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-blue-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                    </svg>
                    <div>
                      <div className="font-medium">
                        {selectedDate ? formatDate(selectedDate) : ''}
                      </div>
                      <div className="text-sm">
                        {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Anything you'd like us to know before the call?"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={submitting || !formData.name || !formData.email}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Scheduling...
                      </div>
                    ) : (
                      'Schedule Meeting'
                    )}
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
