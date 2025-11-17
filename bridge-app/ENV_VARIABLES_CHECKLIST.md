# Environment Variables Checklist for Vercel

## Quick Fix: Delete and Recreate All Variables

If you're having issues, the easiest solution is to:

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Delete ALL existing variables** (click the trash icon on each)
3. **Recreate them one by one** using the list below
4. **Redeploy** after adding all variables

## Required Environment Variables

### 1. Supabase (Required - App won't work without these)

```
NEXT_PUBLIC_SUPABASE_URL
```
- **Value**: Your Supabase project URL
- **Format**: `https://xxxxx.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Environments**: Production, Preview, Development

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
- **Value**: Your Supabase anonymous key
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Environments**: Production, Preview, Development

### 2. Google Calendar OAuth (Required for calendar sync)

```
GOOGLE_CALENDAR_CLIENT_ID
```
- **Value**: OAuth 2.0 Client ID from Google Cloud Console
- **Format**: `xxxxx.apps.googleusercontent.com`
- **Where to find**: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID
- **Environments**: Production, Preview, Development

```
GOOGLE_CALENDAR_CLIENT_SECRET
```
- **Value**: OAuth 2.0 Client Secret from Google Cloud Console
- **Format**: `GOCSPX-xxxxx` (starts with GOCSPX)
- **Where to find**: Same place as Client ID (shown once when created)
- **Environments**: Production, Preview, Development

```
GOOGLE_CALENDAR_REDIRECT_URI
```
- **Value**: Your callback URL
- **Format**: `https://your-deployment-url.vercel.app/api/calendar/callback`
- **Example**: `https://bridge-bktuetxoq-drew-geolys-projects.vercel.app/api/calendar/callback`
- **Important**: Must EXACTLY match what you added in Google Cloud Console
- **Environments**: Production, Preview, Development

### 3. Gemini AI (Required for AI features)

```
GEMINI_API_KEY
```
- **Value**: Your Gemini API key
- **Format**: `AIza...` (starts with AIza)
- **Where to find**: [Google AI Studio](https://makersuite.google.com/app/apikey) or Google Cloud Console
- **Environments**: Production, Preview, Development

```
GEMINI_MODEL
```
- **Value**: Model name (optional, has default)
- **Format**: `gemini-pro` or `gemini-1.5-pro`
- **Default**: `gemini-pro` (if not set)
- **Environments**: Production, Preview, Development

## Step-by-Step: Setting Up in Vercel

### Step 1: Get Your Deployment URL

1. Go to Vercel Dashboard → Your Project
2. Look at the top - you'll see your deployment URL
3. Copy it (e.g., `https://bridge-xxxxx.vercel.app`)

### Step 2: Add Variables in Vercel

1. Go to **Settings** → **Environment Variables**
2. For EACH variable below:
   - Click **Add New**
   - Enter the **Key** (exact name from list above)
   - Enter the **Value**
   - Select **Environments**: Check all three (Production, Preview, Development)
   - Click **Save**

### Step 3: Verify All Variables

After adding, you should see exactly **7 variables**:

✅ `NEXT_PUBLIC_SUPABASE_URL`  
✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
✅ `GOOGLE_CALENDAR_CLIENT_ID`  
✅ `GOOGLE_CALENDAR_CLIENT_SECRET`  
✅ `GOOGLE_CALENDAR_REDIRECT_URI`  
✅ `GEMINI_API_KEY`  
✅ `GEMINI_MODEL`

### Step 4: Redeploy

**CRITICAL**: After adding/changing variables, you MUST redeploy:

**Option A: Via CLI**
```bash
cd bridge-app
vercel --prod
```

**Option B: Via Dashboard**
1. Go to **Deployments**
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**

## Common Issues & Fixes

### Issue: "Missing client_id" error
**Fix**: 
- Verify `GOOGLE_CALENDAR_CLIENT_ID` is set
- Check for typos or extra spaces
- Redeploy after adding

### Issue: "Missing redirect_uri" error
**Fix**:
- Verify `GOOGLE_CALENDAR_REDIRECT_URI` is set
- Must match exactly what's in Google Cloud Console
- Format: `https://your-url.vercel.app/api/calendar/callback`
- Redeploy after adding

### Issue: "GEMINI_API_KEY required" error
**Fix**:
- Verify `GEMINI_API_KEY` is set (not `OPENAI_API_KEY`)
- Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Redeploy after adding

### Issue: Variables not working after adding
**Fix**:
- **You must redeploy!** Variables only apply to new deployments
- Delete and recreate the variable if it still doesn't work
- Check that you selected all three environments (Production, Preview, Development)

## Verification Script

After setting variables, you can verify they're being read by checking Vercel function logs:

1. Go to **Deployments** → Latest deployment
2. Click **View Function Logs**
3. Look for console.log output showing which variables are detected

## Quick Copy-Paste Template

When adding variables, use these exact names (copy-paste to avoid typos):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
GOOGLE_CALENDAR_REDIRECT_URI
GEMINI_API_KEY
GEMINI_MODEL
```

## After Setting Everything Up

1. ✅ All 7 variables added
2. ✅ All variables set for Production, Preview, Development
3. ✅ Redeployed the application
4. ✅ Test calendar connection
5. ✅ Test AI features (suggestions/advice)

