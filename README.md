# The Hallow Archive

A connected object/graph system for Scott's worldbuilding and campaign content.
See [CLAUDE.md](./CLAUDE.md) for the full project background, design philosophy,
and decisions.

This is v1: a single-user (Scott-only) admin app for creating typed objects and
linking them with labeled, bidirectional connections. Player accounts and the
suggestion-review workflow are a later phase — see CLAUDE.md's open questions.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (Postgres, Auth)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema migration.** In the Supabase dashboard, open the SQL Editor
   and run the contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
3. **Create your login.** In the Supabase dashboard, go to Authentication →
   Users → Add user, and create an account with your email/password (this is
   the only account v1 needs).
4. **Copy environment variables.** Copy `.env.local.example` to `.env.local`
   and fill in your Supabase project's URL (Project Settings → Data API, or
   the "Connect" button) and **Publishable key** (Project Settings → API Keys
   — not the Secret key, which must never be exposed to the browser).

   ```bash
   cp .env.local.example .env.local
   ```

5. **Install dependencies and run:**

   ```bash
   npm install
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) and sign in with the
   account you created in step 3.

## Deployment

Deploy the Next.js app to [Vercel](https://vercel.com):

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add the same two environment variables from `.env.local` in the Vercel
   project settings.
4. Deploy.

The Supabase project itself needs no separate deployment step — it's already
hosted.
