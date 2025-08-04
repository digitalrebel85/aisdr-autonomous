import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This cron job sends follow-up emails for upcoming bookings
export async function POST(request: NextRequest) {
  // Authenticate the cron job request
  const authToken = (request.headers.get('authorization') || '').split('Bearer ').at(1);
  if (authToken !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('BOOKING FOLLOW-UP CRON: Starting to process booking follow-ups...');

  // Use the admin client to have full access for this backend process
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find bookings that need follow-up emails
    // 1. Bookings starting tomorrow (24-hour reminder)
    // 2. Bookings starting in 1 hour (1-hour reminder)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_link:booking_links(
          title,
          meeting_location,
          event_title_template,
          user_id
        )
      `)
      .eq('status', 'confirmed')
      .or(`start_time.gte.${tomorrow.toISOString().split('T')[0]},start_time.lte.${new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]},start_time.gte.${oneHourFromNow.toISOString()},start_time.lte.${new Date(oneHourFromNow.getTime() + 60 * 60 * 1000).toISOString()}`);

    if (bookingsError) {
      console.error('BOOKING FOLLOW-UP ERROR: Failed to fetch bookings.', bookingsError);
      throw new Error('Failed to fetch bookings.');
    }

    if (!bookings || bookings.length === 0) {
      console.log('BOOKING FOLLOW-UP: No bookings need follow-up emails today.');
      return new NextResponse('No bookings to process.', { status: 200 });
    }

    console.log(`BOOKING FOLLOW-UP: Found ${bookings.length} bookings for follow-up.`);

    // Process each booking
    for (const booking of bookings) {
      const bookingTime = new Date(booking.start_time);
      const timeUntilBooking = bookingTime.getTime() - now.getTime();
      const hoursUntilBooking = timeUntilBooking / (1000 * 60 * 60);

      let emailType = '';
      let shouldSend = false;

      // Determine which type of follow-up to send
      if (hoursUntilBooking <= 25 && hoursUntilBooking >= 23) {
        // 24-hour reminder
        emailType = '24_hour_reminder';
        shouldSend = true;
      } else if (hoursUntilBooking <= 1.5 && hoursUntilBooking >= 0.5) {
        // 1-hour reminder
        emailType = '1_hour_reminder';
        shouldSend = true;
      }

      if (!shouldSend) continue;

      // Check if we've already sent this type of follow-up
      const { data: existingFollowUp } = await supabase
        .from('booking_follow_ups')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('follow_up_type', emailType)
        .single();

      if (existingFollowUp) {
        console.log(`BOOKING FOLLOW-UP: Already sent ${emailType} for booking ${booking.id}`);
        continue;
      }

      // Get the user's connected inbox for sending
      const { data: inbox, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('email_address, grant_id')
        .eq('user_id', booking.booking_link.user_id)
        .eq('is_active', true)
        .single();

      if (inboxError || !inbox) {
        console.error(`BOOKING FOLLOW-UP: No active inbox for user ${booking.booking_link.user_id}`);
        continue;
      }

      // Generate follow-up email content
      const emailContent = generateFollowUpEmail(booking, emailType);

      // Send the follow-up email
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grantId: inbox.grant_id,
            to: booking.lead_email,
            subject: emailContent.subject,
            body: emailContent.body,
            fromEmail: inbox.email_address,
            leadId: booking.lead_id,
            bookingId: booking.id,
          }),
        });

        if (response.ok) {
          // Record that we sent this follow-up
          await supabase
            .from('booking_follow_ups')
            .insert({
              booking_id: booking.id,
              follow_up_type: emailType,
              sent_at: new Date().toISOString(),
              email_subject: emailContent.subject,
            });

          console.log(`BOOKING FOLLOW-UP: Sent ${emailType} for booking ${booking.id} to ${booking.lead_email}`);
        } else {
          console.error(`BOOKING FOLLOW-UP: Failed to send ${emailType} for booking ${booking.id}`);
        }
      } catch (error) {
        console.error(`BOOKING FOLLOW-UP: Error sending email for booking ${booking.id}:`, error);
      }
    }

    return new NextResponse('Booking follow-ups processed successfully.', { status: 200 });
  } catch (error) {
    console.error('BOOKING FOLLOW-UP CRON ERROR:', error);
    return new NextResponse('Internal server error.', { status: 500 });
  }
}

function generateFollowUpEmail(booking: any, emailType: string) {
  const bookingTime = new Date(booking.start_time);
  const formattedDate = bookingTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = bookingTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (emailType === '24_hour_reminder') {
    return {
      subject: `Reminder: Your meeting tomorrow at ${formattedTime}`,
      body: `Hi ${booking.lead_name},

This is a friendly reminder about your upcoming meeting scheduled for tomorrow.

📅 **Meeting Details:**
• Date: ${formattedDate}
• Time: ${formattedTime} (${booking.timezone})
• Duration: ${booking.booking_link.duration_minutes || 30} minutes
• Location: ${booking.meeting_location}

${booking.booking_notes ? `**Notes:** ${booking.booking_notes}\n\n` : ''}We're looking forward to speaking with you!

If you need to reschedule or have any questions, please reply to this email.

Best regards,
${booking.booking_link.user_id}`,
    };
  } else if (emailType === '1_hour_reminder') {
    return {
      subject: `Starting soon: Your meeting in 1 hour`,
      body: `Hi ${booking.lead_name},

Your meeting is starting in about 1 hour!

📅 **Meeting Details:**
• Time: ${formattedTime} (${booking.timezone})
• Location: ${booking.meeting_location}

${booking.meeting_location.includes('zoom') || booking.meeting_location.includes('meet') 
  ? 'Please make sure you have the meeting link ready and test your audio/video beforehand.\n\n' 
  : ''}We're excited to speak with you shortly!

Best regards,
${booking.booking_link.user_id}`,
    };
  }

  return { subject: '', body: '' };
}
