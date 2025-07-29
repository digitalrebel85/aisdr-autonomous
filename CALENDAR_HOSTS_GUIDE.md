# Calendar Hosts System Implementation Guide

## 🎯 Overview

The Calendar Hosts system allows you to connect booking links to specific people's calendars rather than always using the same connected inbox. This provides flexibility for teams where different people handle different types of meetings.

## 🏗️ Architecture

### Database Schema

The system introduces a new `calendar_hosts` table that manages different people's calendar connections:

```sql
-- Calendar Hosts table
CREATE TABLE calendar_hosts (
    id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    host_name TEXT NOT NULL,
    host_email TEXT NOT NULL,
    host_title TEXT, -- e.g., "Sales Manager", "CEO"
    host_bio TEXT,
    grant_id TEXT NOT NULL, -- Nylas grant ID for this host's calendar
    calendar_id TEXT, -- Specific calendar within the grant
    timezone TEXT NOT NULL DEFAULT 'UTC',
    working_hours JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enhanced booking_links table
ALTER TABLE booking_links 
ADD COLUMN calendar_host_id BIGINT REFERENCES calendar_hosts(id);
```

### Key Features

1. **Multiple Calendar Hosts**: Each user can create multiple calendar hosts representing different people
2. **Flexible Calendar Connection**: Each host connects to a specific Nylas grant (calendar account)
3. **Host Information**: Store name, title, bio, and avatar for each host
4. **Individual Settings**: Each host can have their own timezone, working hours, and booking limits
5. **Booking Link Assignment**: Each booking link can be assigned to a specific calendar host

## 🚀 Implementation Components

### 1. Database Migration (`calendar_hosts_enhancement.sql`)

- Creates `calendar_hosts` table with RLS policies
- Adds `calendar_host_id` to `booking_links` table
- Includes helper functions for managing hosts
- Migrates existing data from connected inboxes

### 2. Calendar Hosts Management UI (`/dashboard/calendar-hosts`)

- **Create New Hosts**: Add people whose calendars can be used for booking
- **Edit Host Details**: Update name, title, bio, and settings
- **Manage Availability**: Set working hours, buffers, and daily limits
- **Toggle Active Status**: Enable/disable hosts
- **Connect to Calendars**: Link each host to a specific Nylas grant

### 3. Enhanced Booking API

- **Updated Availability API**: Uses `get_booking_link_with_host()` function
- **Host Information**: Returns host details with booking link data
- **Flexible Calendar Access**: Uses host's grant_id and calendar_id
- **Backward Compatibility**: Falls back to booking link's grant_id if no host assigned

### 4. Enhanced Booking Page

- **Host Display**: Shows host information (name, title, bio) on booking page
- **Professional Presentation**: Displays who the meeting will be with
- **Host-Specific Settings**: Uses host's timezone and availability preferences

## 📋 Setup Instructions

### Step 1: Run Database Migration

```sql
-- Execute the calendar_hosts_enhancement.sql migration
-- This creates the new tables and migrates existing data
```

### Step 2: Create Calendar Hosts

1. Go to `/dashboard/calendar-hosts`
2. Click "Add Calendar Host"
3. Fill in host details:
   - **Host Name**: Full name of the person
   - **Email**: Their email address
   - **Title**: Their role (e.g., "Sales Manager")
   - **Connected Calendar**: Select from your connected inboxes
   - **Timezone**: Host's timezone
   - **Bio**: Optional description

### Step 3: Assign Hosts to Booking Links

When creating or editing booking links, you can now:
1. Select a specific calendar host
2. The booking will use that host's calendar and settings
3. The host's information will be displayed on the booking page

### Step 4: Test the System

1. Create a booking link with a specific host assigned
2. Visit the public booking page
3. Verify host information is displayed
4. Complete a booking and check it appears in the host's calendar

## 🔧 Usage Examples

### Example 1: Sales Team Setup

```typescript
// Create hosts for different sales team members
const salesManager = {
  host_name: "John Smith",
  host_email: "john@company.com",
  host_title: "Sales Manager",
  grant_id: "grant_123", // John's calendar connection
  timezone: "America/New_York"
};

const salesRep = {
  host_name: "Sarah Johnson", 
  host_email: "sarah@company.com",
  host_title: "Sales Representative",
  grant_id: "grant_456", // Sarah's calendar connection
  timezone: "America/Los_Angeles"
};
```

### Example 2: Booking Link Assignment

```typescript
// Create booking links for different purposes
const demoBookingLink = {
  title: "Product Demo",
  calendar_host_id: salesManager.id, // Uses John's calendar
  duration_minutes: 30
};

const consultationLink = {
  title: "Sales Consultation",
  calendar_host_id: salesRep.id, // Uses Sarah's calendar
  duration_minutes: 60
};
```

## 🎨 UI Enhancements

### Calendar Hosts Management Page Features

- **Host List**: View all calendar hosts with status indicators
- **Quick Actions**: Edit, activate/deactivate, or delete hosts
- **Host Details**: Display name, title, email, and connection status
- **Settings Management**: Configure working hours, buffers, and limits
- **Connection Status**: Show which Nylas grant each host is connected to

### Enhanced Booking Page Features

- **Host Information Card**: Shows host name, title, and bio
- **Professional Presentation**: "You'll be meeting with [Host Name], [Title]"
- **Host-Specific Availability**: Uses host's timezone and working hours
- **Personalized Experience**: Makes booking feel more personal and professional

## 🔄 Migration from Old System

The migration automatically:

1. **Creates Calendar Hosts**: From existing connected inboxes
2. **Updates Booking Links**: Assigns first available host to existing links
3. **Preserves Data**: No existing bookings or links are lost
4. **Maintains Compatibility**: Old system continues to work during transition

## 🚀 Benefits

### For Administrators
- **Flexible Team Management**: Easy to add/remove team members
- **Individual Settings**: Each person can have their own preferences
- **Clear Organization**: See who handles what types of meetings
- **Professional Presentation**: Branded booking experience

### For Customers
- **Know Who They're Meeting**: See host information before booking
- **Personalized Experience**: Each booking feels tailored
- **Professional Appearance**: Clean, Calendly-like interface
- **Reliable Scheduling**: Direct connection to the right person's calendar

## 🔧 Technical Details

### API Changes

- **Availability Endpoint**: Now returns host information
- **Booking Creation**: Uses host's calendar for event creation
- **Database Functions**: New RPC functions for host management
- **Type Safety**: Full TypeScript interfaces for all data

### Security

- **RLS Policies**: Users can only access their own hosts
- **Grant Validation**: Ensures hosts can only use their connected calendars
- **Data Isolation**: Complete separation between different users' hosts

This system transforms your booking platform from a single-calendar setup to a flexible, multi-host solution that can scale with your team while providing a professional, personalized experience for your customers.
