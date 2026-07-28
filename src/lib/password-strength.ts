export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  checks: {
    length: boolean
    lower: boolean
    upper: boolean
    number: boolean
    symbol: boolean
  }
}

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }

  if (!password) {
    return { score: 0, label: LABELS[0], checks }
  }

  let raw = 0
  if (checks.length) raw += 1
  if (checks.lower && checks.upper) raw += 1
  if (checks.number) raw += 1
  if (checks.symbol) raw += 1
  if (password.length >= 12 && raw >= 3) raw += 1

  const score = Math.min(4, raw) as PasswordStrength["score"]
  return { score, label: LABELS[score], checks }
}
