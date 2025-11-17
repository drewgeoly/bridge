# Google Calendar OAuth Setup Guide

## Where to Get Google Calendar OAuth Credentials

### Step 1: Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select or create a project

### Step 2: Enable Google Calendar API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on **Google Calendar API**
4. Click **Enable** (if not already enabled)

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "Bridge" (or your app name)
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue**
   - On Scopes page, click **Save and Continue** (we'll add scopes later)
   - On Test users page, add your email if needed, then **Save and Continue**
   - Review and **Back to Dashboard**

### Step 4: Create OAuth Client ID

1. Back in **Credentials** page, click **Create Credentials** → **OAuth client ID**
2. Choose **Web application** as the application type
3. Give it a name (e.g., "Bridge Calendar OAuth")
4. Add **Authorized redirect URIs**:
   - For local development: `http://localhost:3000/api/calendar/callback`
   - For production: Use your **Vercel deployment URL** (see below)
   - Add both if you want to test locally and deploy
5. Click **Create**

**Finding Your Vercel Deployment URL:**
- Go to your Vercel project dashboard
- Look at the top of the page - you'll see your deployment URL
- It will be either:
  - **Deployment URL**: `your-project-name.vercel.app` or `your-project-name-{hash}.vercel.app`
  - **Custom Domain**: If you've added one (e.g., `bridge.app`, `yourdomain.com`)
- Use whichever URL you want users to access your app with
- Example redirect URI: `https://your-project-name.vercel.app/api/calendar/callback`

### Step 5: Copy Your Credentials

After creating, you'll see a popup with:
- **Client ID** → This is your `GOOGLE_CALENDAR_CLIENT_ID`
- **Client Secret** → This is your `GOOGLE_CALENDAR_CLIENT_SECRET`

**Important:** Copy the Client Secret immediately - you won't be able to see it again!

### Step 6: Configure OAuth Consent Screen Scopes

1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **Edit App**
3. Go to **Scopes** tab
4. Click **Add or Remove Scopes**
5. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly` (Read calendar events)
   - `https://www.googleapis.com/auth/calendar.events` (Create/edit calendar events)
6. Click **Update** → **Save and Continue**

### Step 7: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.vercel.app/api/calendar/callback
```

**Important Notes:**
- Replace `your-domain.vercel.app` with your actual Vercel deployment URL
- For local development, you can also add:
  ```
  GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/calendar/callback
  ```
- Make sure to add these for **Production**, **Preview**, and **Development** environments
- After adding variables, redeploy your application

## Testing Locally

For local development, you'll need:

1. Add `http://localhost:3000/api/calendar/callback` to **Authorized redirect URIs** in Google Cloud Console
2. Set `GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/calendar/callback` in your `.env.local` file
3. Make sure your `.env.local` includes:
   ```
   GOOGLE_CALENDAR_CLIENT_ID=your_client_id
   GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
   GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/calendar/callback
   ```

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in your environment variable exactly matches one in Google Cloud Console
- Check for trailing slashes or http vs https mismatches

### "Access blocked" error
- If your app is in "Testing" mode, make sure your email is added as a test user
- Go to **OAuth consent screen** → **Test users** → Add your email

### Can't see Client Secret
- If you lost the secret, you'll need to create a new OAuth client ID
- Or go to the credentials page, click on your OAuth client, and create a new secret

## Security Best Practices

1. **Never commit secrets to git** - Use environment variables only
2. **Restrict API key** (if using one) - Limit to specific APIs and IPs if possible
3. **Use different credentials** for development and production
4. **Regularly rotate secrets** - Especially if compromised

## Quick Reference

| Variable | Where to Find |
|----------|---------------|
| `GOOGLE_CALENDAR_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Same as above (shown once when created) |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Your app's callback URL (see [VERCEL_URLS_EXPLAINED.md](./VERCEL_URLS_EXPLAINED.md) for details) |

**Redirect URI Format:**
- Deployment URL: `https://your-project-name.vercel.app/api/calendar/callback`
- Custom Domain: `https://yourdomain.com/api/calendar/callback`
- Use whichever URL users access your app with

