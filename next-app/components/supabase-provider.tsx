'use client'

import { createContext, ReactNode, useContext, useMemo } from 'react'

import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => supabase, [])
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
}

export function useSupabaseClient() {
  const client = useContext(SupabaseContext)
  if (!client) {
    throw new Error('Supabase client is not available')
  }
  return client
}
