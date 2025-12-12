# 🧪 Testing AI A/B Testing System

Complete guide to test the AI-powered A/B testing system end-to-end.

---

## 📋 Pre-Test Checklist

### 1. Database Migration
```sql
-- Run this in Supabase SQL Editor
-- File: supabase_migrations/campaign_testing_system.sql

-- Verify tables created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'campaign_variants',
    'ab_test_configs',
    'campaign_performance_history',
    'ai_test_decisions',
    'global_performance_benchmarks'
);

-- Should return 5 rows
```

### 2. Environment Variables
```bash
# Check .env.local has:
DEEPSEEK_API_KEY=your_deepseek_key
NEXT_PUBLIC_PYTHON_SERVICE_URL=http://localhost:8000

# Python service will use DeepSeek if key is set
```

### 3. Services Running
```bash
# Terminal 1: Python Service
cd python-crew-service
python main.py
# Should see: "INFO: Using DeepSeek LLM"

# Terminal 2: Next.js Frontend
npm run dev
# Should see: http://localhost:3000
```

---

## 🎯 Test Flow

### Step 1: Navigate to Campaign Wizard
```
URL: http://localhost:3000/dashboard/campaigns/strategy
```

### Step 2: Fill Campaign Details (Step 1)
- **Campaign Name**: "Test AI A/B System"
- **Objective**: Select "Book Meetings"
- **Target Persona**: "CTO"
- **ICP Profile**: Select any existing profile
- **Offer**: Select any existing offer (must have sales_assets)

**✅ Verify:**
- All fields filled
- "Next" button enabled
- Click "Next"

### Step 3: AI Research (Step 2)
**What happens:**
- System calls `/api/campaign-strategy/analyze`
- AI analyzes ICP and Offer
- Generates framework and sequence recommendations

**✅ Verify:**
- Loading spinner appears
- AI recommendations display
- Framework recommendation shown
- Sequence recommendation shown
- Click "Next"

### Step 4: Framework & Sequence (Step 3)
**✅ Verify:**
- AI recommended framework highlighted
- Can select different framework
- Sequence slider shows recommended touches
- Can adjust number of touches
- Click "Next"

### Step 5: AI Test Strategy (Step 4) ⭐ NEW
**What happens:**
- System calls `/recommend-test-strategy`
- AI analyzes available assets
- Recommends what to test (lead_magnet/proof_point/subject_line)
- Generates 3-5 variant recommendations

**✅ Verify:**
```
Expected Display:
┌─────────────────────────────────────────────┐
│ 🌟 AI Test Strategy                         │
│                                             │
│ Based on your assets and industry          │
│ benchmarks, AI recommends testing           │
│ lead magnet first.                          │
│                                             │
│ 💡 Why this test?                           │
│ • You have X lead magnets to compare       │
│ • Lead magnet choice impacts reply rate... │
│                                             │
│ Variants to Test:                           │
│ ┌─────────────────────────────────────┐   │
│ │ Variant A - [Lead Magnet Name]      │   │
│ │ Expected: X.X% reply rate           │   │
│ │ Strategy: Lead with value prop...   │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ✅ Use AI Recommendation                   │
│ ⚙️ Customize Test Strategy                 │
└─────────────────────────────────────────────┘
```

**Actions:**
- Click "✅ Use AI Recommendation"
- Click "Next"

### Step 6: Review & Create (Step 5)
**✅ Verify:**
- Campaign details shown
- Test strategy summary displayed
- Number of variants shown
- Click "Create Campaign"

### Step 7: Campaign Creation ⭐ CRITICAL
**What happens (watch browser console):**

1. **Variant Email Generation** (30-60 seconds)
   ```
   POST /generate-variant-emails
   ```
   - CrewAI generates emails for each variant
   - Each variant gets full sequence (3-5 touches)
   - Console should show: "Generating email variants..."

2. **Database Records Created**
   - Campaign record
   - A/B test config
   - All variants with emails
   - AI decision record

3. **Redirect**
   - Should redirect to campaign detail page
   - URL: `/dashboard/campaigns/[campaign_id]`

**✅ Verify in Console:**
```javascript
// Should see logs like:
"Calling /generate-variant-emails..."
"Variant generation successful"
"Creating campaign..."
"Campaign created successfully"
```

---

## 🔍 Verification Queries

### After Campaign Creation, Run These:

```sql
-- 1. Check campaign created
SELECT 
    id,
    name,
    objective,
    status,
    created_at
FROM outreach_campaigns 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Check A/B test config
SELECT 
    id,
    campaign_id,
    test_strategy,
    primary_test_type,
    auto_optimize,
    ai_recommendation->>'recommended_test_type' as test_type,
    ai_recommendation->>'reasoning' as reasoning
FROM ab_test_configs 
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Check variants created
SELECT 
    variant_name,
    variant_letter,
    test_type,
    variant_config,
    jsonb_array_length(email_templates) as num_emails,
    expected_performance,
    ai_reasoning,
    status
FROM campaign_variants 
WHERE campaign_id = (
    SELECT id FROM outreach_campaigns 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY variant_letter;

-- 4. Check email content
SELECT 
    variant_name,
    email_templates->0 as first_email,
    email_templates->1 as second_email,
    email_templates->2 as third_email
FROM campaign_variants 
WHERE campaign_id = (
    SELECT id FROM outreach_campaigns 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY variant_letter;

-- 5. Check AI decision recorded
SELECT 
    recommended_test_type,
    reasoning,
    confidence_score,
    historical_data_points,
    user_accepted,
    created_at
FROM ai_test_decisions 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ✅ Expected Results

### Database Records:
- ✅ 1 campaign in `outreach_campaigns`
- ✅ 1 config in `ab_test_configs`
- ✅ 3-5 variants in `campaign_variants`
- ✅ Each variant has 3-5 emails in `email_templates`
- ✅ 1 decision in `ai_test_decisions`

### Email Content Quality:
Each email should have:
- ✅ Subject line
- ✅ Personalization tokens ({{first_name}}, {{company}})
- ✅ Relevant to variant strategy
- ✅ Includes lead magnet/proof point from variant config
- ✅ Clear CTA
- ✅ Professional tone

### Variant Differences:
- ✅ Variant A emphasizes one lead magnet
- ✅ Variant B emphasizes different lead magnet
- ✅ Variant C emphasizes third lead magnet
- ✅ Each has unique messaging approach

---

## 🐛 Troubleshooting

### Issue: "Failed to get test strategy"
**Check:**
```bash
# Python service logs
# Should see: POST /recommend-test-strategy
# Should NOT see errors

# If error, check:
1. Python service running?
2. DEEPSEEK_API_KEY set?
3. Offer has sales_assets?
```

### Issue: "Failed to generate variant emails"
**Check:**
```bash
# Python service logs
# Should see: POST /generate-variant-emails
# Should see: "Generating emails for Variant A..."

# If error, check:
1. email_copywriter_crew exists?
2. DeepSeek API key valid?
3. Enough API credits?
```

### Issue: Database error on insert
**Check:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'campaign%' OR table_name LIKE 'ab_%';

-- Verify RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('campaign_variants', 'ab_test_configs');
```

### Issue: Emails not generated
**Check Python logs for:**
```
INFO: Generating email variants for: Test AI A/B System
INFO: Generating emails for Variant A - [Name]
INFO: Generated touch 1 for Variant A
INFO: Generated touch 2 for Variant A
INFO: Generated touch 3 for Variant A
```

---

## 📊 Success Criteria

### ✅ System Working If:
1. All 5 wizard steps complete without errors
2. Campaign creation takes 30-60 seconds (CrewAI generation time)
3. Database has all expected records
4. Each variant has unique, quality email content
5. AI decision reasoning makes sense
6. No errors in browser console
7. No errors in Python service logs

### 🎉 Bonus Points:
- Emails are personalized and relevant
- Variant strategies are clearly different
- Expected performance predictions seem reasonable
- System feels intelligent and automated

---

## 🚀 Next Steps After Successful Test

1. **Build Campaign Detail Page**
   - View all variants
   - Edit emails if needed
   - Assign leads to variants

2. **Implement Sending**
   - Distribute leads across variants
   - Track which variant each lead gets
   - Send emails via Nylas

3. **Track Performance**
   - Update metrics as emails send
   - Calculate statistical significance
   - Auto-pause losing variants

4. **Learning System**
   - Store results in performance_history
   - Update global benchmarks
   - Improve future predictions

---

## 📝 Test Notes Template

```
Test Date: ___________
Tester: ___________

Step 1 - Campaign Details: ☐ Pass ☐ Fail
Notes: _________________________________

Step 2 - AI Research: ☐ Pass ☐ Fail
Notes: _________________________________

Step 3 - Framework: ☐ Pass ☐ Fail
Notes: _________________________________

Step 4 - Test Strategy: ☐ Pass ☐ Fail
Test Type Recommended: _________________
Number of Variants: ____
Notes: _________________________________

Step 5 - Review: ☐ Pass ☐ Fail
Notes: _________________________________

Campaign Creation: ☐ Pass ☐ Fail
Generation Time: _____ seconds
Notes: _________________________________

Database Verification: ☐ Pass ☐ Fail
Campaign ID: _________________________
Variants Created: ____
Emails per Variant: ____
Notes: _________________________________

Email Quality: ☐ Pass ☐ Fail
Variant A Quality: ☐ Good ☐ Fair ☐ Poor
Variant B Quality: ☐ Good ☐ Fair ☐ Poor
Variant C Quality: ☐ Good ☐ Fair ☐ Poor
Notes: _________________________________

Overall Result: ☐ SUCCESS ☐ NEEDS WORK
```

---

## 🎯 Quick Test Checklist

- [ ] Database migration run
- [ ] Python service running with DeepSeek
- [ ] Frontend running
- [ ] Navigate to wizard
- [ ] Fill Step 1 (campaign details)
- [ ] Complete Step 2 (AI research)
- [ ] Complete Step 3 (framework)
- [ ] See Step 4 (AI test strategy)
- [ ] Accept AI recommendation
- [ ] Review Step 5
- [ ] Click "Create Campaign"
- [ ] Wait for generation (30-60s)
- [ ] Verify redirect
- [ ] Run database queries
- [ ] Check email content
- [ ] Verify variant differences
- [ ] **SUCCESS!** 🎉
