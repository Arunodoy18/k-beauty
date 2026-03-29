# Next.js template

This is a Next.js template with shadcn/ui.

## Production Environment Setup

This project needs these environment variables:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_DASHBOARD_TOKEN=optional_admin_token
```

Use `.env.local` for local development and keep secrets out of git.

## Vercel Deployment Checklist

1. Set Vercel project Root Directory to `next-app` (important for monorepo structure).
2. Add all required environment variables in Vercel:
	- `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `ADMIN_DASHBOARD_TOKEN` (optional)
3. Redeploy after adding or changing environment variables.
4. Verify health route works: `/api/test` should return `{ "status": "API working" }`.
5. Verify waitlist API by submitting from homepage.
6. Confirm new records are in Supabase table `waitlist`.

## Troubleshooting 500 Errors

Most common causes:

- Missing or incorrect environment variables in Vercel.
- Vercel Root Directory not set to `next-app`.
- Supabase service role key not set for server routes.
- Supabase table names missing or incorrect (`waitlist`, `waitlist_events`).

Check runtime logs in Vercel:

`Project -> Deployments -> Latest deployment -> Functions -> Logs`

## Netlify Deployment Checklist

1. Netlify Site Settings -> Build & deploy:
	- Base directory: `next-app`
	- Build command: `npm install && npm run build`
2. Environment variables (Production context):
	- `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `ADMIN_DASHBOARD_TOKEN` (optional)
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
