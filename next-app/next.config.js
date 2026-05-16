// Prevent repeated SWC lockfile patch warnings during builds.
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1"

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {
    root: __dirname,
  },
}

// next-pwa with Next 16 compatible setup
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})

module.exports = withPWA(nextConfig)
