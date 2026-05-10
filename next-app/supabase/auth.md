# Supabase Auth Setup

This phase uses Supabase Auth email/password accounts.

Required environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

In Supabase, enable Email under Authentication -> Providers.
For local development, add `http://localhost:3000/dashboard` to the redirect URLs if email confirmation is enabled.
