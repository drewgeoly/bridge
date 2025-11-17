# Google OAuth Scope Verification Guide

## About the "Unverified App" Warning

Even though `calendar.readonly` is a **restricted scope** (not sensitive), Google still shows a warning when the app is published. You have **3 options**:

## What Scopes We're Using

**Current Scope:**
```
https://www.googleapis.com/auth/calendar.readonly
```

**What it does:**
- Allows your app to **read** calendar events
- Does **NOT** allow editing, creating, or deleting events
- This is a **restricted scope** but **NOT sensitive** (no verification needed)

**Where it's used:**
- `lib/services/calendar/google-calendar.service.ts` - Line 52
- Used to fetch calendar events and sync them to your app

## Your Options

### Option 1: Keep in Testing Mode (Recommended for School Project)
- **Pros:** No warning screen, simple setup
- **Cons:** Limited to 100 test users (add them manually)
- **Best for:** School projects, demos, limited users
- **How:** Just add test users in OAuth consent screen → Test users

### Option 2: Publish and Accept the Warning
- **Pros:** Unlimited users, no verification needed
- **Cons:** Users see "unverified app" warning (but can still proceed)
- **Best for:** Public apps where users can accept the warning
- **How:** Publish app, users click "Continue" on warning screen

### Option 3: Go Through Verification (Not Recommended)
- **Pros:** No warning screen, professional appearance
- **Cons:** Takes days/weeks, requires privacy policy, demo video, etc.
- **Best for:** Production apps with many users
- **How:** Submit verification request (complex process)

## Option 1: Keep in Testing Mode (Easiest)

### How to Add Test Users

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Scroll to **Test users** section
5. Click **+ ADD USERS**
6. Add email addresses of users who should be able to sign in
7. Click **ADD** and **SAVE**

**Result:** Test users won't see the warning screen. Perfect for a school project!

## Option 2: Publish and Accept Warning

### How to Publish

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Scroll to bottom, click **PUBLISH APP**
5. Confirm

**Result:** Anyone can sign in, but they'll see the warning (they can click "Continue" to proceed)

## Option 3: Verification (If You Really Want)

This requires:
- Privacy Policy URL
- Terms of Service URL
- Demo video (YouTube)
- Detailed explanation of how you use the scope
- Can take 1-4 weeks for approval

**For a school project, this is probably overkill.**

## When Verification IS Required

Verification is only required for **sensitive scopes** like:
- `calendar` (full write access)
- `calendar.events` (can create/edit events)
- User data scopes (Gmail, Drive, etc.)

**We're NOT using any sensitive scopes**, so no verification needed!

## What Happens After Publishing

1. **Anyone can sign in** - No test user limit
2. **Users see a consent screen** - They'll see what permissions you're requesting
3. **No verification delay** - Works immediately after publishing

## If You Want to Add Write Access Later

If you later want to create/edit calendar events, you'd need:
- Scope: `https://www.googleapis.com/auth/calendar.events` or `calendar`
- **This WOULD require verification** (more complex process)
- For now, read-only is perfect for your use case

## Quick Checklist

- [ ] Go to Google Cloud Console → OAuth consent screen
- [ ] Click **PUBLISH APP**
- [ ] Confirm the publication
- [ ] Test with a non-test-user account
- [ ] Done! No verification needed

## Recommendation for School Project

**Best Option: Keep in Testing Mode**

1. Add test users (classmates, professor, etc.) in Google Cloud Console
2. They won't see the warning screen
3. Simple, no verification needed
4. 100 user limit is plenty for a school project

**If you need more than 100 users:**
- Publish the app (Option 2)
- Users will see the warning but can click "Continue" to proceed
- No verification needed, just accept that users see the warning

## Summary

**You're using:** `calendar.readonly` (restricted scope, shows warning when published)  
**Verification needed?** No (but warning appears)  
**Best for school project:** Keep in Testing mode, add test users  
**Alternative:** Publish and let users accept the warning

The warning is just Google being cautious - users can still proceed by clicking "Continue".

