const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 15 * 60 * 1000  // 15 minutes

export function checkLoginLockout(email: string): { locked: boolean; remainingMs: number } {
  const key     = `admin_attempts_${email}`
  const stored  = localStorage.getItem(key)
  if (!stored) return { locked: false, remainingMs: 0 }

  try {
    const { count, lastAttempt } = JSON.parse(stored)
    const elapsed = Date.now() - lastAttempt

    if (count >= MAX_ATTEMPTS && elapsed < LOCKOUT_MS) {
      return { locked: true, remainingMs: LOCKOUT_MS - elapsed }
    }

    if (elapsed >= LOCKOUT_MS) {
      localStorage.removeItem(key)
      return { locked: false, remainingMs: 0 }
    }
  } catch (err) {
    localStorage.removeItem(key)
  }

  return { locked: false, remainingMs: 0 }
}

export function recordLoginAttempt(email: string, success: boolean) {
  const key = `admin_attempts_${email}`
  if (success) {
    localStorage.removeItem(key)
    return
  }
  const stored = localStorage.getItem(key)
  try {
    const data = stored ? JSON.parse(stored) : { count: 0 }
    localStorage.setItem(key, JSON.stringify({
      count:       data.count + 1,
      lastAttempt: Date.now()
    }))
  } catch (err) {
    localStorage.setItem(key, JSON.stringify({
      count:       1,
      lastAttempt: Date.now()
    }))
  }
}
