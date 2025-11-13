# Bridge 
Our humane UXD final project, looking to provide meaningful guidance based on calendar insights and gentle reminders

## Quick Start
### Prerequisites
- Node.js 18+ (`node --version`)
- npm or pnpm

### Setup
git clone 
cd brige/bridge-app

npm install 
#create an .env.local and copy over variables
npm run dev

## 📁 Project Structure
```
bridge-app/
├── app/                # Next.js App Router
│   ├── (auth)/        # Auth pages (login, etc)
│   ├── (dashboard)/   # Protected pages
│   ├── api/           # API routes
│   └── layout.tsx     # Root layout
├── components/        # React components
│   ├── ui/           # Reusable UI components
│   └── features/     # Feature-specific components
├── lib/              # Core utilities
│   ├── supabase/     # Database clients
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Helper functions
├── types/            # TypeScript types
└── public/           # Static assets
```
## 🛠 Tech Stack

| **Frontend** | Next.js 14 (App Router) + TypeScript 
| **Styling** | Tailwind CSS 
| **Database** | Supabase (PostgreSQL)
| **Auth** | Supabase Auth 
| **Hosting** | Vercel 
| **State** | Zustand  
| **Data Fetching** | TanStack Query v5 

All services are on the free tier for our school project.

## 🗄️ Database Schema

Our core data model centers around **TouchPoints** - every interaction (calendar event, message, note) is a TouchPoint:

- `profiles` - User settings and preferences
- `people` - Deduplicated contacts
- `relationships` - Connections between users and people
- `touchpoints` - All interactions (calendar events, messages, etc)
- `digests` - Daily/weekly summaries

All tables have Row Level Security (RLS) enabled - users can only see their own data.

## 🔑 Authentication

We use Supabase Auth with Google OAuth. The flow:
1. User clicks "Login with Google"
2. Google OAuth consent
3. Redirect to dashboard
4. Profile auto-created via database trigger

## 🚢 Deployment

The app auto-deploys to Vercel when you push to `main`:

```bash
git add .
git commit -m "feat: your feature"
git push origin main
```

Preview deployments are created for pull requests.
