// Bracket generation engine
// standingsByGroup: { G1: [s1, s2, s3, s4], G2: [...], ... }
// Each standing: { couple_id, points, game_differential, ... }
//
// Returns an array of match objects ready for Supabase insert.
// next_match_id is pre-wired for the main bracket (QF→SF→F).
// 3rd-place and consolation matches are standalone (no auto-advancement).

// ── Helpers ───────────────────────────────────────────────────────────────────

function rankTeams(teams) {
  return [...teams]
    .filter(Boolean)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.game_differential !== a.game_differential) return b.game_differential - a.game_differential
      return 0
    })
}

function makeMatch(division, round, position, coupleA, coupleB) {
  return {
    id:           crypto.randomUUID(),
    division,
    phase:        'knockout',
    round,
    position,
    couple_a_id:  coupleA?.couple_id ?? null,
    couple_b_id:  coupleB?.couple_id ?? null,
    status:       'scheduled',
    next_match_id:   null,
    next_match_slot: null,
  }
}

// Get the nth place (1-indexed) from a group's standings array
function place(standingsByGroup, group, rank) {
  return standingsByGroup[group]?.[rank - 1] ?? null
}

// ── Diamant ───────────────────────────────────────────────────────────────────
// Groups: G1, G2, G3 (4 couples each)
// QF → SF → Final; consolation for surplus 3rds and all 4ths
function generateDiamant(standingsByGroup) {
  const g = (group, rank) => place(standingsByGroup, group, rank)

  const thirds = rankTeams(['G1', 'G2', 'G3'].map(gc => g(gc, 3)))

  // Quarter-finals
  const a1 = makeMatch('diamant', 'quarter', 1, g('G1', 1), g('G3', 2))
  const a2 = makeMatch('diamant', 'quarter', 2, g('G2', 1), thirds[0])
  const a3 = makeMatch('diamant', 'quarter', 3, g('G3', 1), thirds[1])
  const a4 = makeMatch('diamant', 'quarter', 4, g('G1', 2), g('G2', 2))

  // Semis
  const s1 = makeMatch('diamant', 'semi', 1, null, null)
  const s2 = makeMatch('diamant', 'semi', 2, null, null)

  // Final + 3rd place
  const fin   = makeMatch('diamant', 'final',       1, null, null)
  const third = makeMatch('diamant', 'third_place', 1, null, null)

  // Consolation
  const c1 = makeMatch('diamant', 'consolation', 1, thirds[2], g('G1', 4))
  const c2 = makeMatch('diamant', 'consolation', 2, g('G2', 4),  g('G3', 4))

  // Wire winners: QF → SF → Final
  a1.next_match_id = s1.id;  a1.next_match_slot = 'couple_a'
  a2.next_match_id = s1.id;  a2.next_match_slot = 'couple_b'
  a3.next_match_id = s2.id;  a3.next_match_slot = 'couple_a'
  a4.next_match_id = s2.id;  a4.next_match_slot = 'couple_b'
  s1.next_match_id = fin.id; s1.next_match_slot = 'couple_a'
  s2.next_match_id = fin.id; s2.next_match_slot = 'couple_b'

  return [a1, a2, a3, a4, s1, s2, fin, third, c1, c2]
}

// ── Or ────────────────────────────────────────────────────────────────────────
// Groups: G1–G6 (4 couples each)
// QF → SF → Final; extensive consolation tiers
function generateOr(standingsByGroup) {
  const g = (group, rank) => place(standingsByGroup, group, rank)
  const groups = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']

  const seconds = rankTeams(groups.map(gc => g(gc, 2)))
  const fourths  = rankTeams(groups.map(gc => g(gc, 4)))

  // Quarter-finals
  const a1 = makeMatch('or', 'quarter', 1, g('G1', 1), seconds[0])
  const a2 = makeMatch('or', 'quarter', 2, g('G2', 1), seconds[1])
  const a3 = makeMatch('or', 'quarter', 3, g('G3', 1), g('G4', 1))
  const a4 = makeMatch('or', 'quarter', 4, g('G5', 1), g('G6', 1))

  // Semis
  const s1 = makeMatch('or', 'semi', 1, null, null)
  const s2 = makeMatch('or', 'semi', 2, null, null)

  // Final + 3rd place
  const fin   = makeMatch('or', 'final',       1, null, null)
  const third = makeMatch('or', 'third_place', 1, null, null)

  // Consolation — 2nd place tier (3rd–6th best 2nd)
  const c1 = makeMatch('or', 'consolation', 1, seconds[2], seconds[3])
  const c2 = makeMatch('or', 'consolation', 2, seconds[4], seconds[5])

  // Consolation — 3rd place tier (paired by group)
  const c3 = makeMatch('or', 'consolation', 3, g('G1', 3), g('G2', 3))
  const c4 = makeMatch('or', 'consolation', 4, g('G3', 3), g('G4', 3))
  const c5 = makeMatch('or', 'consolation', 5, g('G5', 3), g('G6', 3))

  // Consolation — 4th place tier (top 4 of ranked 4ths)
  const c6 = makeMatch('or', 'consolation', 6, fourths[0], fourths[1])
  const c7 = makeMatch('or', 'consolation', 7, fourths[2], fourths[3])

  // Wire winners: QF → SF → Final
  a1.next_match_id = s1.id;  a1.next_match_slot = 'couple_a'
  a2.next_match_id = s1.id;  a2.next_match_slot = 'couple_b'
  a3.next_match_id = s2.id;  a3.next_match_slot = 'couple_a'
  a4.next_match_id = s2.id;  a4.next_match_slot = 'couple_b'
  s1.next_match_id = fin.id; s1.next_match_slot = 'couple_a'
  s2.next_match_id = fin.id; s2.next_match_slot = 'couple_b'

  return [a1, a2, a3, a4, s1, s2, fin, third, c1, c2, c3, c4, c5, c6, c7]
}

// ── Plata ─────────────────────────────────────────────────────────────────────
// Groups: G1, G2, G3 (4 couples each)
// SF → Final; no quarter-finals
function generatePlata(standingsByGroup) {
  const g = (group, rank) => place(standingsByGroup, group, rank)

  const seconds = rankTeams(['G1', 'G2', 'G3'].map(gc => g(gc, 2)))
  const thirds  = rankTeams(['G1', 'G2', 'G3'].map(gc => g(gc, 3)))

  // Semis
  const s1 = makeMatch('plata', 'semi', 1, g('G1', 1), g('G2', 1))
  const s2 = makeMatch('plata', 'semi', 2, g('G3', 1), seconds[0])

  // Final + 3rd place
  const fin   = makeMatch('plata', 'final',       1, null, null)
  const third = makeMatch('plata', 'third_place', 1, null, null)

  // Consolation — 2nd place tier
  const c1 = makeMatch('plata', 'consolation', 1, seconds[1], seconds[2])

  // Consolation — 3rd place tier
  const c2 = makeMatch('plata', 'consolation', 2, thirds[0],  thirds[1])
  const c3 = makeMatch('plata', 'consolation', 3, thirds[2],  g('G1', 4))

  // Consolation — 4th place tier
  const c4 = makeMatch('plata', 'consolation', 4, g('G2', 4), g('G3', 4))

  // Wire winners: SF → Final
  s1.next_match_id = fin.id; s1.next_match_slot = 'couple_a'
  s2.next_match_id = fin.id; s2.next_match_slot = 'couple_b'

  return [s1, s2, fin, third, c1, c2, c3, c4]
}

// ── Public API ────────────────────────────────────────────────────────────────

const GENERATORS = { diamant: generateDiamant, or: generateOr, plata: generatePlata }

// standingsByGroup comes from Supabase group_standings or dummy data.
// Returns { matches: [...] } or throws if division is unknown.
export function generateBracket(division, standingsByGroup) {
  const gen = GENERATORS[division]
  if (!gen) throw new Error(`Unknown division: ${division}`)
  return gen(standingsByGroup)
}

// Summarise match for display: "García / Fernández vs López / Martínez"
export function matchLabel(match, coupleMap) {
  const nameA = coupleMap[match.couple_a_id]?.team_name ?? 'TBD'
  const nameB = coupleMap[match.couple_b_id]?.team_name ?? 'TBD'
  return `${nameA} vs ${nameB}`
}

export const ROUND_LABELS = {
  quarter:     'Cuartos de final',
  semi:        'Semifinales',
  final:       'Final',
  third_place: '3er/4º puesto',
  consolation: 'Cuadro B',
}
