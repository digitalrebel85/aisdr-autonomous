// Sample Email Replies Data Insertion Script
// Run this to add sample real email replies to demonstrate the enhanced schema

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://auyaglndikpmthhisbxo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use your service role key

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleEmailReplies() {
  console.log('Adding sample email replies...');
  
  const userId = 'f7ee9f97-dead-4f92-99de-23cd707e3f0c'; // Your user ID
  
  // First, let's add some sample leads if they don't exist
  const sampleLeads = [
    {
      user_id: userId,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@techcorp.com',
      company: 'TechCorp Inc',
      title: 'VP of Sales',
      offer: 'Sales Pipeline Optimization',
      cta: 'Schedule a 15-minute call'
    },
    {
      user_id: userId,
      first_name: 'Sarah',
      last_name: 'Wilson',
      email: 'sarah.wilson@cloudtech.com',
      company: 'CloudTech Solutions',
      title: 'Marketing Director',
      offer: 'Marketing ROI Improvement',
      cta: 'Book a free consultation'
    },
    {
      user_id: userId,
      first_name: 'Mike',
      last_name: 'Johnson',
      email: 'mike.johnson@startup.io',
      company: 'StartupIO',
      title: 'CEO',
      offer: 'Startup Growth Strategy',
      cta: 'Get a growth audit'
    },
    {
      user_id: userId,
      first_name: 'Lisa',
      last_name: 'Anderson',
      email: 'lisa.anderson@retailmax.com',
      company: 'RetailMax',
      title: 'Head of Digital Marketing',
      offer: 'E-commerce Sales Boost',
      cta: 'See case studies'
    }
  ];

  // Insert leads (ignore if they already exist)
  for (const lead of sampleLeads) {
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', lead.email)
      .single();
    
    if (!existingLead) {
      const { error } = await supabase
        .from('leads')
        .insert(lead);
      
      if (error) {
        console.error('Error inserting lead:', error);
      } else {
        console.log(`Added lead: ${lead.first_name} ${lead.last_name}`);
      }
    }
  }

  // Get lead IDs for the sample replies
  const { data: leads } = await supabase
    .from('leads')
    .select('id, email')
    .eq('user_id', userId)
    .in('email', sampleLeads.map(l => l.email));

  const leadMap = {};
  leads.forEach(lead => {
    leadMap[lead.email] = lead.id;
  });

  // Sample email replies
  const sampleReplies = [
    {
      user_id: userId,
      lead_id: leadMap['john.smith@techcorp.com'],
      message_id: 'msg_interested_lead_001',
      thread_id: 'thread_001',
      conversation_id: 'conv_001',
      sender_email: 'john.smith@techcorp.com',
      sender_name: 'John Smith',
      subject: 'Re: Quick Chat About Your Sales Pipeline?',
      body: `Hi Chris,

Thanks for reaching out! I'm actually very interested in learning more about how you can help us improve our lead generation. We've been struggling with our current process and could definitely use some help.

Would you be available for a 15-minute call this week to discuss? I'm free Tuesday or Wednesday afternoon.

Best regards,
John Smith
VP of Sales, TechCorp`,
      sentiment: 'interested',
      summary: 'Lead is very interested and wants to schedule a call this week. Mentioned struggling with current lead generation process.',
      action: 'schedule_call',
      next_step_prompt: 'Great to hear you\'re interested, John! I\'d be happy to show you how we can improve your lead generation process. I have availability Tuesday at 2 PM or Wednesday at 3 PM EST. Which works better for you? I\'ll send over a calendar link once you confirm.',
      priority: 'high',
      lead_temperature: 'hot',
      is_read: false,
      is_processed: true,
      auto_reply_sent: true,
      auto_reply_sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      received_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      raw_email_data: {
        from: 'john.smith@techcorp.com',
        to: 'chris@aisdrnewstyle.com',
        message_id: 'msg_interested_lead_001',
        thread_id: 'thread_001'
      },
      email_headers: {
        From: 'John Smith <john.smith@techcorp.com>',
        To: 'chris@aisdrnewstyle.com',
        Subject: 'Re: Quick Chat About Your Sales Pipeline?'
      },
      reply_to_message_id: 'original_msg_001',
      nylas_message_id: 'nylas_msg_001',
      webhook_id: 'webhook_001'
    },
    {
      user_id: userId,
      lead_id: leadMap['sarah.wilson@cloudtech.com'],
      message_id: 'msg_objection_lead_002',
      thread_id: 'thread_002',
      conversation_id: 'conv_002',
      sender_email: 'sarah.wilson@cloudtech.com',
      sender_name: 'Sarah Wilson',
      subject: 'Re: Boost Your Marketing ROI',
      body: `Hi,

I appreciate you reaching out, but we've had some bad experiences with marketing agencies in the past. The last company we worked with promised great results but didn't deliver and was very expensive.

How is your approach different? What kind of guarantees do you offer?

Sarah`,
      sentiment: 'neutral',
      summary: 'Lead has objections based on past bad experiences with agencies. Asking about approach and guarantees.',
      action: 'reply',
      next_step_prompt: `I completely understand your concerns, Sarah. Bad experiences with agencies are unfortunately common, and I appreciate you being upfront about it. 

What makes us different is our transparent, data-driven approach. We don't make unrealistic promises - instead, we start with a small pilot to prove results before any major commitment. We also provide weekly reports showing exactly what we're doing and the results we're achieving.

Would you be open to a brief 10-minute call where I can share some case studies of how we've helped companies who had similar bad experiences turn things around?`,
      priority: 'medium',
      lead_temperature: 'warm',
      is_read: false,
      is_processed: true,
      auto_reply_sent: true,
      auto_reply_sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      raw_email_data: {
        from: 'sarah.wilson@cloudtech.com',
        to: 'chris@aisdrnewstyle.com',
        message_id: 'msg_objection_lead_002'
      },
      email_headers: {
        From: 'Sarah Wilson <sarah.wilson@cloudtech.com>',
        To: 'chris@aisdrnewstyle.com',
        Subject: 'Re: Boost Your Marketing ROI'
      },
      reply_to_message_id: 'original_msg_002',
      nylas_message_id: 'nylas_msg_002',
      webhook_id: 'webhook_002'
    },
    {
      user_id: userId,
      lead_id: leadMap['mike.johnson@startup.io'],
      message_id: 'msg_not_interested_003',
      thread_id: 'thread_003',
      conversation_id: 'conv_003',
      sender_email: 'mike.johnson@startup.io',
      sender_name: 'Mike Johnson',
      subject: 'Re: Scale Your Startup Growth',
      body: `Hi,

Thanks for the email, but we're not interested at this time. We're focused on other priorities right now.

Please remove me from your mailing list.

Thanks,
Mike`,
      sentiment: 'not_interested',
      summary: 'Lead explicitly not interested and requested to be removed from mailing list.',
      action: 'not_interested',
      next_step_prompt: 'No problem at all, Mike. I\'ve removed you from our mailing list. Best of luck with your current priorities!',
      priority: 'low',
      lead_temperature: 'cold',
      is_read: false,
      is_processed: true,
      auto_reply_sent: true,
      auto_reply_sent_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      received_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      raw_email_data: {
        from: 'mike.johnson@startup.io',
        to: 'chris@aisdrnewstyle.com',
        message_id: 'msg_not_interested_003'
      },
      email_headers: {
        From: 'Mike Johnson <mike.johnson@startup.io>',
        To: 'chris@aisdrnewstyle.com',
        Subject: 'Re: Scale Your Startup Growth'
      },
      reply_to_message_id: 'original_msg_003',
      nylas_message_id: 'nylas_msg_003',
      webhook_id: 'webhook_003'
    },
    {
      user_id: userId,
      lead_id: leadMap['lisa.anderson@retailmax.com'],
      message_id: 'msg_question_lead_004',
      thread_id: 'thread_004',
      conversation_id: 'conv_004',
      sender_email: 'lisa.anderson@retailmax.com',
      sender_name: 'Lisa Anderson',
      subject: 'Re: Increase Your E-commerce Sales',
      body: `Hi Chris,

Your email caught my attention. Can you tell me more about your specific experience with e-commerce companies? What kind of results have you achieved for businesses similar to ours?

Also, what's your typical engagement process and pricing structure?

Thanks,
Lisa Anderson
Head of Digital Marketing`,
      sentiment: 'neutral',
      summary: 'Lead is asking for more information about experience, results, process, and pricing. Shows interest but needs more details.',
      action: 'reply',
      next_step_prompt: `Great questions, Lisa! I'd be happy to share more details.

We've helped several e-commerce companies increase their sales by 25-40% within 90 days. For example, we recently helped a fashion retailer similar to RetailMax increase their monthly revenue from $50K to $78K through improved lead generation and email marketing.

Our process typically starts with a free audit of your current setup, then we create a customized 90-day growth plan. Pricing depends on scope, but most e-commerce clients invest between $2K-5K/month.

Would you like me to send over a case study that's relevant to your industry? I think you'd find it interesting.`,
      priority: 'medium',
      lead_temperature: 'warm',
      is_read: false,
      is_processed: true,
      auto_reply_sent: false, // This one hasn't been replied to yet
      received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      raw_email_data: {
        from: 'lisa.anderson@retailmax.com',
        to: 'chris@aisdrnewstyle.com',
        message_id: 'msg_question_lead_004'
      },
      email_headers: {
        From: 'Lisa Anderson <lisa.anderson@retailmax.com>',
        To: 'chris@aisdrnewstyle.com',
        Subject: 'Re: Increase Your E-commerce Sales'
      },
      reply_to_message_id: 'original_msg_004',
      nylas_message_id: 'nylas_msg_004',
      webhook_id: 'webhook_004'
    }
  ];

  // Insert sample replies
  for (const reply of sampleReplies) {
    const { error } = await supabase
      .from('replies')
      .insert(reply);
    
    if (error) {
      console.error('Error inserting reply:', error);
    } else {
      console.log(`Added reply from: ${reply.sender_name}`);
    }
  }

  console.log('Sample email replies added successfully!');
}

// Run the script
addSampleEmailReplies().catch(console.error);
