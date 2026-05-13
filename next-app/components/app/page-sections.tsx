"use client"

import { motion } from "framer-motion"
import { Camera, Droplets, FileText, ShieldCheck, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { useAppContext } from "@/components/app/app-context"

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

export function HomeScreen() {
  const { skinProfile, reportData } = useAppContext()

  return (
    <AppScreen eyebrow="Daily ritual" title="Your glow starts with a precise skin profile.">
      <div className="app-hero-panel">
        <div>
          <p>Current focus</p>
          <h2>{skinProfile.routineGoal}</h2>
          <span>{skinProfile.skinType} skin | {skinProfile.climate} climate</span>
        </div>
        <Link href="/scan">Start scan</Link>
      </div>
      <div className="app-card-grid two">
        <MetricCard label="Hydration" value={`${reportData.hydrationScore ?? 0}%`} tone="green" />
        <MetricCard label="Barrier" value={`${reportData.barrierScore ?? 0}%`} tone="amber" />
      </div>
    </AppScreen>
  )
}

export function ScanScreen() {
  return (
    <AppScreen eyebrow="AI scan" title="Capture a calm, front-facing photo for analysis.">
      <div className="scan-stage">
        <Camera size={46} />
        <p>Face scan module will connect here in Phase 3.</p>
        <button type="button">Open camera</button>
      </div>
      <div className="app-card-grid">
        <InfoCard icon={ShieldCheck} title="Private by design" text="Photo handling and consent will be explicit before analysis." />
        <InfoCard icon={Sparkles} title="Concern-aware" text="We will focus on acne, pigmentation, texture, oiliness, and barrier stress." />
      </div>
    </AppScreen>
  )
}

export function ReportScreen() {
  const { reportData } = useAppContext()

  return (
    <AppScreen eyebrow="Skin report" title="A readable report, not a confusing diagnosis.">
      <div className="report-stack">
        <MetricCard label="Hydration" value={`${reportData.hydrationScore ?? 0}%`} tone="green" />
        <MetricCard label="Barrier strength" value={`${reportData.barrierScore ?? 0}%`} tone="amber" />
        <MetricCard label="Pigmentation focus" value={`${reportData.pigmentationScore ?? 0}%`} tone="red" />
      </div>
    </AppScreen>
  )
}

export function RoutineScreen() {
  return (
    <AppScreen eyebrow="Routine" title="A Korean skincare ritual edited for Indian weather.">
      <div className="routine-list">
        {["Gentle cleanse", "Hydrating toner", "Niacinamide serum", "Barrier cream", "Daily SPF"].map(
          (step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{step}</h2>
              <p>Ingredient logic and product matching will connect in the commerce phase.</p>
            </article>
          )
        )}
      </div>
    </AppScreen>
  )
}

export function ProfileScreen() {
  const { skinProfile, userId } = useAppContext()

  return (
    <AppScreen eyebrow="Profile" title="Your skin context stays at the center.">
      <div className="profile-panel">
        <p>User ID</p>
        <h2>{userId ? userId.slice(0, 8) : "Not loaded"}</h2>
      </div>
      <div className="app-card-grid">
        <InfoCard icon={Droplets} title="Skin type" text={skinProfile.skinType ?? "Set in Phase 2"} />
        <InfoCard icon={FileText} title="Concerns" text={skinProfile.concerns.join(", ")} />
      </div>
    </AppScreen>
  )
}

function AppScreen({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <motion.section
      className="app-screen"
      initial="hidden"
      animate="show"
      variants={reveal}
      transition={{ duration: 0.42, ease: [0.22, 0.68, 0, 1] }}
    >
      <div className="app-screen-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </motion.section>
  )
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string
  tone: "green" | "amber" | "red"
  value: string
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <p>{label}</p>
      <h2>{value}</h2>
    </article>
  )
}

function InfoCard({
  icon: Icon,
  text,
  title,
}: {
  icon: LucideIcon
  text: string
  title: string
}) {
  return (
    <article className="info-card">
      <Icon size={20} />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}
