// Shorten "Firstname Surname" → "F. Surname" when name exceeds maxLength
export function formatName(fullName, maxLength = 13) {
  if (!fullName) return ''
  if (fullName.length <= maxLength) return fullName
  const parts = fullName.trim().split(' ')
  if (parts.length < 2) return fullName
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

// "Firstname Surname" → "Surname" (everything after the first word)
function extractSurname(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(' ')
  return parts.slice(1).join(' ')
}

// "García / Fernández" from two full names — falls back to formatName if surname is empty
export function formatTeamLabel(p1Name, p2Name) {
  const s1 = extractSurname(p1Name) || formatName(p1Name)
  const s2 = extractSurname(p2Name) || formatName(p2Name)
  return `${s1} / ${s2}`
}
