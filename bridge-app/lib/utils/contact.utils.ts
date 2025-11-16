/**
 * Contact utility functions for normalization and matching
 */

/**
 * Normalize email address
 * - Convert to lowercase
 * - Handle Gmail aliases (remove dots, handle +aliases)
 */
export function normalizeEmail(email: string): string {
  if (!email) return ''
  
  const trimmed = email.trim().toLowerCase()
  
  // Handle Gmail aliases
  if (trimmed.includes('@gmail.com')) {
    const [local, domain] = trimmed.split('@')
    // Remove dots and everything after +
    const normalized = local.replace(/\./g, '').split('+')[0]
    return `${normalized}@${domain}`
  }
  
  return trimmed
}

/**
 * Normalize name
 * - Trim whitespace
 * - Handle common variations
 */
export function normalizeName(name: string): string {
  if (!name) return ''
  
  return name
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .toLowerCase()
}

/**
 * Normalize phone number
 * - Remove all non-digit characters
 * - Handle country codes (assume US if 10 digits, +1 if 11)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Handle US numbers: remove leading 1 if present
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1)
  }
  
  return digits
}

/**
 * Calculate name similarity using Levenshtein distance
 * Returns a score between 0 and 1 (1 = identical, 0 = completely different)
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeName(name1)
  const normalized2 = normalizeName(name2)
  
  if (normalized1 === normalized2) return 1.0
  
  // Handle initials (e.g., "J. Smith" vs "John Smith")
  const parts1 = normalized1.split(' ')
  const parts2 = normalized2.split(' ')
  
  // If one is initial and other is full name
  if (parts1.length === parts2.length) {
    let allMatch = true
    for (let i = 0; i < parts1.length; i++) {
      const p1 = parts1[i]
      const p2 = parts2[i]
      
      // If one is a single character (initial) and starts the other
      if (p1.length === 1 && p2.startsWith(p1)) continue
      if (p2.length === 1 && p1.startsWith(p2)) continue
      
      if (p1 !== p2) {
        allMatch = false
        break
      }
    }
    if (allMatch) return 0.95
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)
  
  if (maxLength === 0) return 1.0
  
  return 1 - (distance / maxLength)
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = []
  
  for (let i = 0; i <= m; i++) {
    dp[i] = [i]
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }
  
  return dp[m][n]
}

/**
 * Fuzzy email matching
 * - Normalize both emails
 * - Check if normalized versions match
 */
export function fuzzyMatchEmail(email1: string, email2: string): boolean {
  const normalized1 = normalizeEmail(email1)
  const normalized2 = normalizeEmail(email2)
  
  return normalized1 === normalized2
}

/**
 * Check if two phone numbers match (after normalization)
 */
export function matchPhone(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhone(phone1)
  const normalized2 = normalizePhone(phone2)
  
  if (!normalized1 || !normalized2) return false
  
  // Exact match
  if (normalized1 === normalized2) return true
  
  // Check if one is a suffix of the other (for partial matches)
  if (normalized1.length >= 10 && normalized2.length >= 10) {
    // Last 10 digits should match for US numbers
    return normalized1.slice(-10) === normalized2.slice(-10)
  }
  
  return false
}

