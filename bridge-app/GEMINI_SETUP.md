# Gemini API Key Setup Guide

## Where to Get Your Gemini API Keys

### Option 1: Google AI Studio (Easiest)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the API key
5. Add it to your Vercel environment variables as `GEMINI_API_KEY`

### Option 2: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"API Key"**
5. Copy the API key
6. (Optional) Restrict the API key to "Generative Language API" for security
7. Add it to your Vercel environment variables as `GEMINI_API_KEY`

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
```

**Note:** 
- `GEMINI_MODEL` is optional and defaults to `gemini-pro` if not set
- You can use `gemini-1.5-pro` for newer models if available
- Make sure to add these for **Production**, **Preview**, and **Development** environments

## Testing

After adding the keys, redeploy your application. The AI features (suggestions, advice) will now use Gemini instead of OpenAI.

## Free Tier Limits

Google Gemini API has generous free tier limits. Check the [pricing page](https://ai.google.dev/pricing) for current limits.

