# Next.js template

This is a Next.js template with shadcn/ui.

## Production Environment Setup

This project needs these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Use `.env.local` for local development and keep secrets out of git.

## Supabase Auth Setup

1. In Supabase, enable Email under `Authentication -> Providers`.
2. If email confirmation is enabled, add this redirect URL:
   `http://localhost:3000/dashboard`.
3. In production, add your deployed dashboard URL as an additional redirect URL.

## Vercel Deployment Checklist

1. Set Vercel project Root Directory to `next-app` (important for monorepo structure).
2. Add all required environment variables in Vercel:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy after adding or changing environment variables.
4. Verify health route works: `/api/test` should return `{ "status": "API working" }`.
5. Verify signup and login with Supabase Auth.

## Troubleshooting 500 Errors

Most common causes:

- Missing or incorrect environment variables in Vercel.
- Vercel Root Directory not set to `next-app`.
- Supabase email/password provider is disabled.
- Supabase redirect URLs do not include your dashboard URL.

Check runtime logs in Vercel:

`Project -> Deployments -> Latest deployment -> Functions -> Logs`

## Netlify Deployment Checklist

1. Netlify Site Settings -> Build & deploy:
	- Base directory: `next-app`
	- Build command: `npm install && npm run build`
2. Environment variables (Production context):
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Clear build cache and redeploy after any environment change.
4. Verify endpoint health after deploy:
	- `/api/test` must return `{ "status": "API working" }`.

If Netlify returns 500 on all routes including `/api/test`, this is usually platform/runtime config and not form logic. Check Function logs first, then redeploy with cache cleared.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
