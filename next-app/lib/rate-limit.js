const stores = new Map()

function getStoreKey(name, windowMs) {
  return `${name}:${windowMs}`
}

function getBucket(storeName, windowMs, key, now) {
  const storeKey = getStoreKey(storeName, windowMs)
  let store = stores.get(storeKey)

  if (!store) {
    store = new Map()
    stores.set(storeKey, store)
  }

  const bucket = store.get(key)
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs
    const nextBucket = { count: 0, resetAt }
    store.set(key, nextBucket)
    return nextBucket
  }

  return bucket
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return "unknown"
}

export function applyRateLimit({
  request,
  storeName,
  keySuffix = "default",
  limit,
  windowMs,
}) {
  const now = Date.now()
  const ip = getClientIp(request)
  const key = `${ip}:${keySuffix}`
  const bucket = getBucket(storeName, windowMs, key, now)

  bucket.count += 1

  const remaining = Math.max(0, limit - bucket.count)
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

  return {
    success: bucket.count <= limit,
    remaining,
    retryAfterSeconds,
  }
}
