# Quick Deployment Guide

## 🚀 Quick Steps

### 1. Apply Supabase Migrations

```bash
cd bridge-app

# Link your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

**Find your project ref:** Supabase Dashboard → Settings → General → Reference ID

### 2. Deploy to Vercel

**Option A: Automatic (if connected to GitHub)**
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```
Vercel will auto-deploy!

**Option B: Manual via CLI**
```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Deploy
cd bridge-app
vercel --prod
```

### 3. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these (for Production, Preview, and Development):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.vercel.app/api/calendar/callback
OPENAI_API_KEY=your_openai_api_key
```

### 4. Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add to Authorized redirect URIs:
   ```
   https://your-domain.vercel.app/api/calendar/callback
   ```

## ✅ Pre-Deployment Checklist

- [ ] All migrations applied (`supabase db push`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set in Vercel
- [ ] Google OAuth redirect URI updated
- [ ] Code committed and pushed

## 🔍 Verify Deployment

1. Check Vercel dashboard for successful build
2. Visit your Vercel URL
3. Test authentication
4. Test calendar connection

## 📚 Full Guide

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

