# Deployment Guide

This guide covers deploying to Vercel and applying Supabase migrations.

## 📋 Prerequisites

1. **Vercel Account**: Connected to your GitHub repository
2. **Supabase CLI**: Installed locally (`npm install -g supabase`)
3. **Supabase Project**: Your project should be linked via `supabase link`

## 🗄️ Supabase Migrations

### Step 1: Link Your Supabase Project (First Time Only)

If you haven't linked your project yet:

```bash
cd bridge-app
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### Step 2: Apply Migrations to Supabase

To apply all pending migrations to your Supabase database:

```bash
cd bridge-app
supabase db push
```

This will:
- Connect to your linked Supabase project
- Apply all migrations in `supabase/migrations/` that haven't been applied yet
- Show you which migrations are being applied

### Step 3: Verify Migrations

To check which migrations have been applied:

```bash
supabase migration list
```

### Step 4: Check Migration Status

To see the current state of your database:

```bash
supabase db diff
```

This compares your local migrations with the remote database.

### Alternative: Apply Migrations via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of each migration file from `supabase/migrations/`
4. Run them in order (oldest to newest):
   - `20241116200000_add_calendar_fields.sql`
   - `20241116210000_allow_null_occurred_at.sql`
   - `20241116220000_add_agent_conversations.sql`
   - `20241116230000_add_contact_sync.sql`

## 🚀 Vercel Deployment

### Option 1: Automatic Deployment (Recommended)

If your GitHub repo is connected to Vercel, deployments happen automatically:

```bash
# 1. Make sure all changes are committed
git add .
git commit -m "feat: your changes"

# 2. Push to main branch
git push origin main
```

Vercel will automatically:
- Detect the push
- Run `npm install`
- Run `npm run build`
- Deploy to production

### Option 2: Manual Deployment via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from bridge-app directory**:
   ```bash
   cd bridge-app
   vercel
   ```

   For production deployment:
   ```bash
   vercel --prod
   ```

### Step 3: Configure Environment Variables in Vercel

Make sure all required environment variables are set in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add/update the following variables:

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.vercel.app/api/calendar/callback
OPENAI_API_KEY=your_openai_api_key
```

**Important Notes:**
- Update `GOOGLE_CALENDAR_REDIRECT_URI` to match your Vercel deployment URL
- Make sure to add these for **Production**, **Preview**, and **Development** environments
- After adding variables, you may need to redeploy for them to take effect

### Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add your Vercel production URL to **Authorized redirect URIs**:
   ```
   https://your-domain.vercel.app/api/calendar/callback
   ```

## 📝 Deployment Checklist

Before deploying, make sure:

- [ ] All migrations have been applied to Supabase
- [ ] Environment variables are set in Vercel
- [ ] Google OAuth redirect URI is updated
- [ ] Code is committed and pushed to GitHub
- [ ] Build passes locally (`npm run build`)
- [ ] Tests pass (`npm test`)

## 🔍 Verifying Deployment

### Check Vercel Deployment

1. Go to your Vercel dashboard
2. Check the **Deployments** tab
3. Look for successful builds (green checkmark)
4. Click on a deployment to see logs

### Check Supabase Migrations

```bash
supabase migration list
```

Should show all migrations as applied.

### Test Your Deployment

1. Visit your Vercel URL
2. Test authentication
3. Test calendar connection
4. Test API endpoints

## 🐛 Troubleshooting

### Migration Issues

**Error: "Migration already applied"**
- This is normal if the migration was already applied
- Use `supabase migration list` to check status

**Error: "Connection refused"**
- Make sure you've run `supabase link` first
- Check your project ref is correct

### Vercel Build Failures

**Error: "Module not found"**
- Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Environment variable missing"**
- Check Vercel environment variables are set
- Make sure variable names match exactly (case-sensitive)

**Error: "Build timeout"**
- Large builds may timeout on free tier
- Consider optimizing dependencies

### Common Issues

**Calendar OAuth not working:**
- Verify redirect URI matches exactly in Google Console
- Check environment variables are set correctly

**Database connection errors:**
- Verify Supabase URL and keys are correct
- Check RLS policies are set up correctly

## 🔄 Update Workflow

Typical workflow for updates:

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Test locally
npm test
npm run build

# 3. Apply any new migrations
supabase db push

# 4. Commit and push
git add .
git commit -m "feat: description"
git push origin main

# 5. Vercel auto-deploys (or manually deploy)
# 6. Verify deployment works
```

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)

