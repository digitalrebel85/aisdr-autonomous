# 🔧 Supabase Cookie Parsing Error Fix

## Problem
```
Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"... is not valid JSON
```

This error occurs when Supabase authentication cookies become corrupted or improperly formatted.

---

## ✅ Solution Steps

### Step 1: Clear Browser Cookies (Required First)

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Under **Cookies** → `http://localhost:3000`
4. Right-click and select "Clear"
5. Or delete individual cookies starting with `sb-`

**Firefox:**
1. Open DevTools (F12)
2. Go to **Storage** tab
3. Under **Cookies** → `http://localhost:3000`
4. Right-click and select "Delete All"

**Quick Method (Any Browser):**
```javascript
// Paste in browser console and press Enter
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log("All cookies cleared! Refresh the page.");
```

### Step 2: Restart Development Server

```bash
# Stop the dev server (Ctrl+C)
# Then restart
npm run dev
```

### Step 3: Log In Again

1. Navigate to `http://localhost:3000/login`
2. Log in with your credentials
3. Check if errors are gone

---

## 🔧 Code Fix Applied

Updated `src/utils/supabase/client.ts` with explicit cookie handling to prevent parsing errors.

**What Changed:**
- Added custom cookie get/set/remove handlers
- Prevents base64 strings from being parsed as JSON
- Handles cookies properly in browser context

---

## 🐛 If Errors Persist

### Check for Multiple Supabase Instances

The warning `Multiple GoTrueClient instances detected` means you're creating multiple Supabase clients.

**Fix:** Make sure you're using the singleton pattern:

```typescript
// ❌ Don't do this (creates new instance each time)
const supabase = createClientComponentClient();

// ✅ Do this (create once, reuse)
const supabase = useMemo(() => createClientComponentClient(), []);
```

### Clear All Site Data

1. DevTools → Application → Clear Storage
2. Check all boxes:
   - Local storage
   - Session storage
   - IndexedDB
   - Cookies
   - Cache storage
3. Click "Clear site data"
4. Hard refresh (Ctrl+Shift+R)

### Check Environment Variables

Make sure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## ✅ Verification

After clearing cookies and restarting:

1. **No errors in console** ✓
2. **Can log in successfully** ✓
3. **Offers page loads data** ✓
4. **Authentication persists on refresh** ✓

---

## 🎯 Next Steps

Once cookies are cleared and you're logged in:

1. **Check Offers Page:**
   ```
   http://localhost:3000/offers
   ```

2. **Verify User ID Match:**
   ```sql
   -- In Supabase SQL Editor
   SELECT id, email FROM auth.users WHERE email = 'your@email.com';
   
   -- Then check offers
   SELECT id, name, user_id FROM offers;
   
   -- If user_id doesn't match, update:
   UPDATE offers SET user_id = 'YOUR_USER_ID';
   ```

3. **Test API Endpoint:**
   - Open DevTools → Network tab
   - Visit offers page
   - Check `/api/offers` request
   - Should return 200 with offers array

---

## 🚀 Prevention

To prevent this issue in the future:

1. **Don't manually edit cookies** in DevTools
2. **Use proper logout** instead of clearing cookies manually
3. **Keep Supabase packages updated**
4. **Use singleton pattern** for Supabase client creation

---

**Status:** Cookie handling updated, clear cookies and restart to apply fix! 🎉
