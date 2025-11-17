# Fix Supabase OAuth Redirect URL

## Problem
After Google OAuth, you're being redirected to an old deployment URL like:
`https://bridge-l6ikeok18-drew-geolys-projects.vercel.app/?code=...`

## Solution

### Step 1: Update Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add:
   ```
   https://assignment-3-olive-eight.vercel.app/api/auth/callback
   ```
5. Remove any old deployment URLs (like `bridge-xxxxx.vercel.app`)
6. Click **Save**

### Step 2: Update Environment Variable (Optional)

You can also set `NEXT_PUBLIC_APP_URL` in Vercel to use the stable domain:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://assignment-3-olive-eight.vercel.app`
   - Environments: Production, Preview, Development
3. Redeploy

### Step 3: Redeploy

After updating Supabase, redeploy your app:

```bash
cd bridge-app
vercel --prod
```

## Why This Happens

Supabase stores the redirect URL in their dashboard. When you deploy to a new Vercel URL, Supabase still uses the old URL unless you update it in the dashboard.

Using the stable domain `assignment-3-olive-eight.vercel.app` ensures the redirect URL never changes.

