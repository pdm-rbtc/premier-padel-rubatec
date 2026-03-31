// Parse a set score string like "6-4" into [6, 4]
function parseSet(setStr) {
  const parts = setStr.trim().split('-')
  if (parts.length !== 2) return null
  const [a, b] = parts.map(Number)
  if (isNaN(a) || isNaN(b)) return null
  return [a, b]
}

// Parse full score string like "6-4" or "6-4 3-6 7-5"
// Returns { gamesA, gamesB, setsA, setsB, valid }
export function parseScore(scoreStr) {
  if (!scoreStr || typeof scoreStr !== 'string') {
    return { valid: false }
  }
  const sets = scoreStr.trim().split(/\s+/).map(parseSet)
  if (sets.some(s => s === null)) return { valid: false }
  if (sets.length < 1 || sets.length > 3) return { valid: false }

  let gamesA = 0, gamesB = 0, setsA = 0, setsB = 0
  for (const [a, b] of sets) {
    gamesA += a
    gamesB += b
    if (a > b) setsA++
    else setsB++
  }
  return { gamesA, gamesB, setsA, setsB, valid: true }
}

// Validate that a score string is well-formed
export function isValidScore(scoreStr) {
  return parseScore(scoreStr).valid
}
