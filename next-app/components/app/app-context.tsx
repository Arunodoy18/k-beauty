"use client"

import { createContext, ReactNode, useContext, useMemo, useState } from "react"

export type SkinProfile = {
  skinType?: string
  concerns: string[]
  climate?: string
  routineGoal?: string
}

export type ReportData = {
  hydrationScore?: number
  barrierScore?: number
  pigmentationScore?: number
  acneRisk?: "low" | "medium" | "high"
}

type AppContextValue = {
  userId: string | null
  skinProfile: SkinProfile
  setSkinProfile: (profile: SkinProfile) => void
  reportData: ReportData
  setReportData: (report: ReportData) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId: string | null
}) {
  const [skinProfile, setSkinProfile] = useState<SkinProfile>({
    concerns: ["pigmentation", "barrier care"],
    climate: "humid",
    routineGoal: "even glow",
    skinType: "combination",
  })
  const [reportData, setReportData] = useState<ReportData>({
    acneRisk: "medium",
    barrierScore: 74,
    hydrationScore: 68,
    pigmentationScore: 61,
  })

  const value = useMemo(
    () => ({ userId, skinProfile, setSkinProfile, reportData, setReportData }),
    [reportData, skinProfile, userId]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider")
  }

  return context
}
