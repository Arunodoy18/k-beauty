import { createClient } from "@supabase/supabase-js"

let adminClient
let browserClient

export class MissingEnvironmentError extends Error {
  constructor(message, missingVars = []) {
    super(message)
    this.name = "MissingEnvironmentError"
    this.missingVars = missingVars
  }
}

function getMissingEnvVars(envMap) {
  return Object.entries(envMap)
    .filter(([, value]) => !value)
    .map(([name]) => name)
}

function logMissingEnv(scope, missingVars) {
  console.error(`[supabase] Missing ${scope} environment variables: ${missingVars.join(", ")}`)
}

export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const missingVars = getMissingEnvVars({
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (missingVars.length > 0 || !supabaseUrl || !serviceRoleKey) {
    logMissingEnv("server", missingVars)
    throw new MissingEnvironmentError(
      "Supabase server configuration is missing required environment variables.",
      missingVars
    )
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const missingVars = getMissingEnvVars({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  })

  if (missingVars.length > 0 || !supabaseUrl || !anonKey) {
    logMissingEnv("browser", missingVars)
    throw new MissingEnvironmentError(
      "Supabase browser configuration is missing required environment variables.",
      missingVars
    )
  }

  browserClient = createClient(supabaseUrl, anonKey)
  return browserClient
}
