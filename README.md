# 🏓 Court Call — Leipers Pickleball

A beautifully simple, Apple-style web app where each player logs their own
pickleball game results, and a shared leaderboard updates in real time.

---

## 🚀 Deploy in ~15 minutes (all free)

You need three things: **Supabase** (database + auth), **GitHub** (code host),
and **Vercel** (web host). All free tier.

---

### Step 1 — Create a Supabase project (5 min)

1. Go to **https://supabase.com** → Sign up (use GitHub login, easiest)
2. Click **"New Project"**
3. Name it `court-call`, pick a region close to you, set a database password
   (save this somewhere, though you won't need it again)
4. Wait ~2 minutes for it to spin up

**Set up the database:**

5. In your Supabase dashboard, click **SQL Editor** in the left sidebar
6. Click **"New Query"**
7. Open the file `supabase/schema.sql` from this project
8. **Copy the entire contents** and paste into the SQL editor
9. Click **"Run"** — you should see "Success. No rows returned."

**Get your API keys:**

10. Go to **Settings → API** in the left sidebar
11. Copy these two values (you'll need them in Step 3):
    - `Project URL` (looks like `https://abc123.supabase.co`)
    - `anon / public` key (long string starting with `eyJ...`)

**Configure auth emails:**

12. Go to **Authentication → URL Configuration**
13. Set **Site URL** to: `https://leiperspickleball.com`
14. Under **Redirect URLs**, add: `https://leiperspickleball.com/auth/callback`
15. (Optional) Go to **Authentication → Email Templates** to customize the
    magic link email your players receive

---

### Step 2 — Push code to GitHub (3 min)

1. Go to **https://github.com** → Sign in (or create account)
2. Click **"+"** → **"New repository"**
3. Name it `court-call`, keep it private, click **"Create repository"**
4. Upload all the files from this project folder to the repository
   - Easiest way: click "uploading an existing file" on the repo page
     and drag the entire folder contents in
   - OR use git from terminal:
     ```
     cd court-call
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/YOUR_USERNAME/court-call.git
     git branch -M main
     git push -u origin main
     ```

---

### Step 3 — Deploy on Vercel (3 min)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New → Project"**
3. Import your `court-call` repository from GitHub
4. **Before clicking Deploy**, expand **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1 |

5. Click **"Deploy"** — wait ~1 minute

Your app is now live at `your-project.vercel.app`!

---

### Step 4 — Connect your domain (5 min)

You own `leiperspickleball.com` on Squarespace. You need to point it to Vercel.

**In Vercel:**

1. Go to your project → **Settings → Domains**
2. Add `leiperspickleball.com`
3. Vercel will show you DNS records to configure (usually a CNAME or A record)

**In Squarespace:**

4. Go to **Squarespace** → Your domain → **DNS Settings** (or **Advanced DNS**)
5. **Remove** any existing A records or CNAME records for the root domain
6. Add the records Vercel told you:
   - Usually: **CNAME** record, host `@` or `www`, value `cname.vercel-dns.com`
   - Or: **A** record pointing to Vercel's IP (they'll show you)
7. If Squarespace won't let you set a CNAME on the root domain, you may need
   to **transfer the domain to Vercel** (free) — Vercel will walk you through it

**Update Supabase redirect:**

8. Go back to **Supabase → Authentication → URL Configuration**
9. Make sure Site URL = `https://leiperspickleball.com`
10. Make sure Redirect URLs includes `https://leiperspickleball.com/auth/callback`

DNS can take up to 48 hours but usually works in 5–30 minutes.

---

### Step 5 — Enable Realtime (1 min)

For live leaderboard updates:

1. In Supabase dashboard, go to **Database → Replication**
2. Under "Realtime", toggle ON the `scores` table
3. That's it — the app already has the realtime code built in

---

## 🎯 How your group uses it

1. Send everyone the link: **leiperspickleball.com**
2. Each person enters their email → gets a magic login link → picks a display name
3. After each game: tap **Add Score** → enter points → tap Win or Loss → **done**
4. The leaderboard updates for everyone in real time

---

## 📁 Project structure

```
court-call/
├── app/
│   ├── auth/callback/route.ts   ← handles magic link redirect
│   ├── login/page.tsx            ← email input + magic link
│   ├── onboarding/page.tsx       ← set display name (first time)
│   ├── page.tsx                  ← main app (all 4 tabs)
│   ├── layout.tsx                ← root layout + meta
│   └── globals.css               ← global styles
├── lib/
│   ├── supabase-browser.ts       ← client-side Supabase
│   └── supabase-server.ts        ← server-side Supabase
├── supabase/
│   └── schema.sql                ← database setup (run once)
├── middleware.ts                  ← auth session + route protection
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.local.example            ← copy to .env.local with your keys
```

---

## ❓ Troubleshooting

**Magic link emails not arriving?**
- Check spam/junk folder
- In Supabase → Authentication → Settings, make sure "Enable Email" is ON
- Supabase free tier sends from a shared domain; emails may take a minute

**"Invalid redirect" error after clicking magic link?**
- Make sure your Supabase Redirect URLs match exactly (including https://)
- Make sure Site URL is set to your actual domain

**Domain not working?**
- DNS changes can take up to 48 hours
- Check Vercel → Domains — it will show you if DNS is configured correctly
