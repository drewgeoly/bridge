# Calendar Connection Troubleshooting

## Error: "Missing required parameter: client_id"

This error means the Google Calendar OAuth credentials are not properly configured.

### Quick Fix

1. **Check Environment Variables in Vercel:**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Verify these three variables are set:
     - `GOOGLE_CALENDAR_CLIENT_ID`
     - `GOOGLE_CALENDAR_CLIENT_SECRET`
     - `GOOGLE_CALENDAR_REDIRECT_URI`

2. **If Missing, Add Them:**
   - Follow the instructions in [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com/)

3. **Redeploy After Adding Variables:**
   - After adding environment variables in Vercel, you **must redeploy** for them to take effect
   - Go to **Deployments** → Click the three dots on latest deployment → **Redeploy**

### For Local Development

If testing locally, make sure you have a `.env.local` file with:

```env
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

Then restart your dev server:
```bash
npm run dev
```

## Common Issues

### Issue 1: Variables Not Set in Vercel

**Symptom:** Error 400: invalid_request, Missing required parameter: client_id

**Solution:**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add all three Google Calendar variables
3. Make sure they're added for **Production**, **Preview**, and **Development**
4. **Redeploy** your application

### Issue 2: Wrong Redirect URI

**Symptom:** Error 400: redirect_uri_mismatch

**Solution:**
1. Check your `GOOGLE_CALENDAR_REDIRECT_URI` in Vercel
2. Make sure it **exactly matches** what you added in Google Cloud Console
3. Format should be: `https://your-domain.vercel.app/api/calendar/callback`
4. No trailing slashes, must be HTTPS for production

### Issue 3: Variables Not Applied After Adding

**Symptom:** Still getting errors after adding variables

**Solution:**
- **Redeploy is required!** Environment variables only apply to new deployments
- Go to Deployments → Redeploy latest deployment
- Or push a new commit to trigger a new deployment

### Issue 4: Wrong Environment

**Symptom:** Works locally but not in production (or vice versa)

**Solution:**
- Make sure variables are set for the correct environment in Vercel
- Check that Production, Preview, and Development all have the variables
- Local development uses `.env.local` file

## Verification Steps

1. **Check Vercel Environment Variables:**
   ```
   ✅ GOOGLE_CALENDAR_CLIENT_ID is set
   ✅ GOOGLE_CALENDAR_CLIENT_SECRET is set
   ✅ GOOGLE_CALENDAR_REDIRECT_URI is set and matches your domain
   ```

2. **Check Google Cloud Console:**
   ```
   ✅ Google Calendar API is enabled
   ✅ OAuth 2.0 Client ID is created
   ✅ Redirect URI is added in Authorized redirect URIs
   ```

3. **Check Redirect URI Match:**
   ```
   Google Cloud Console: https://your-domain.vercel.app/api/calendar/callback
   Vercel Variable:     https://your-domain.vercel.app/api/calendar/callback
   ✅ They match exactly
   ```

4. **Redeploy:**
   ```
   ✅ Latest deployment was created AFTER adding environment variables
   ```

## Still Having Issues?

1. **Check Vercel Logs:**
   - Go to Vercel → Your Project → Deployments
   - Click on a deployment → View Function Logs
   - Look for error messages about missing environment variables

2. **Test Locally First:**
   - Set up `.env.local` with your credentials
   - Test the calendar connection locally
   - If it works locally but not in production, it's a Vercel configuration issue

3. **Verify Google Cloud Setup:**
   - Make sure OAuth consent screen is configured
   - Add your email as a test user if app is in "Testing" mode
   - Check that scopes are added (calendar.readonly, calendar.events)

## Quick Checklist

- [ ] All three environment variables are set in Vercel
- [ ] Variables are set for Production, Preview, and Development
- [ ] Application has been redeployed after adding variables
- [ ] Redirect URI in Vercel matches Google Cloud Console exactly
- [ ] Google Calendar API is enabled in Google Cloud Console
- [ ] OAuth consent screen is configured
- [ ] Your email is added as a test user (if in Testing mode)

