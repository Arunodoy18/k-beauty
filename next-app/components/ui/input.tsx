import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[var(--text)] placeholder:text-[var(--muted)] selection:bg-[var(--gold)] selection:text-[var(--bg)] flex h-11 w-full min-w-0 rounded-[12px] border border-[var(--border)] bg-[var(--bg2)] px-3 py-1 text-base text-[var(--text)] shadow-xs outline-none transition-all file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[var(--gold)] focus-visible:ring-[3px] focus-visible:ring-[rgba(196,154,108,0.24)]",
        "aria-invalid:border-[var(--red)] aria-invalid:ring-[rgba(192,80,96,0.25)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
