# Fix Google OAuth "Access Denied" Error

## Problem
You're getting: "assignment-3-olive-eight.vercel.app has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers."

## Solution: Add Test Users

Your OAuth app is in "Testing" mode. You need to add test users who can sign in.

### Step 1: Add Test Users in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Add email addresses of users who should be able to sign in:
   - Your email: `dgeoly@gmail.com`
   - Any other test users' emails
7. Click **ADD**
8. Click **SAVE**

### Step 2: Test Again

After adding test users, try signing in again. The users you added will be able to authenticate.

## Alternative: Publish Your App (For Production)

If you want anyone to be able to sign in (not just test users):

1. Go to **OAuth consent screen**
2. Click **PUBLISH APP**
3. Fill out any required information
4. Note: Publishing may require verification if you're requesting sensitive scopes

**For a school project/testing, adding test users is usually sufficient.**

## Quick Checklist

- [ ] Go to Google Cloud Console → OAuth consent screen
- [ ] Scroll to "Test users" section
- [ ] Click "+ ADD USERS"
- [ ] Add `dgeoly@gmail.com` and any other test emails
- [ ] Click "ADD" and "SAVE"
- [ ] Try signing in again

