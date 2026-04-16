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

function makeMatch(division, round, position, coupleA, coupleB,
                   court = null, courtLabel = null, timeSlot = null) {
  return {
    id:              crypto.randomUUID(),
    division,
    phase:           'knockout',
    round,
    position,
    couple_a_id:     coupleA?.couple_id ?? null,
    couple_b_id:     coupleB?.couple_id ?? null,
    status:          'scheduled',
    next_match_id:   null,
    next_match_slot: null,
    court,
    court_label:     courtLabel,
    time_slot:       timeSlot,
  }
}

// Get the nth place (1-indexed) from a group's standings array
function place(standingsByGroup, group, rank) {
  return standingsByGroup[group]?.[rank - 1] ?? null
}

// ── Diamant ───────────────────────────────────────────────────────────────────
// Groups: G1, G2, G3 (4 couples each)
// QF (slot 7, P1-P4) → SF (slot 8, P1-P2) → Final (slot 9, P1)
// Consolation: slot 8 on P3-P4
function generateDiamant(standingsByGroup) {
  const g = (group, rank) => place(standingsByGroup, group, rank)

  const thirds = rankTeams(['G1', 'G2', 'G3'].map(gc => g(gc, 3)))

  const QF = '12:30h - 13:00h'
  const SF = '13:00h - 13:30h'
  const FN = '13:30h - 14:00h'

  // Quarter-finals
  const a1 = makeMatch('diamant', 'quarter', 1, g('G1', 1), g('G3', 2),  'Pista 1', 'A', QF)
  const a2 = makeMatch('diamant', 'quarter', 2, g('G2', 1), thirds[0],   'Pista 2', 'B', QF)
  const a3 = makeMatch('diamant', 'quarter', 3, g('G3', 1), thirds[1],   'Pista 3', 'C', QF)
  const a4 = makeMatch('diamant', 'quarter', 4, g('G1', 2), g('G2', 2),  'Pista 4', 'D', QF)

  // Semis
  const s1 = makeMatch('diamant', 'semi', 1, null, null, 'Pista 1', 'A', SF)
  const s2 = makeMatch('diamant', 'semi', 2, null, null, 'Pista 2', 'B', SF)

  // Final + 3rd place
  const fin   = makeMatch('diamant', 'final',       1, null, null, 'Pista 1', 'A', FN)
  const third = makeMatch('diamant', 'third_place', 1, null, null, 'Pista 2', 'B', FN)

  // Consolation (3rd-best 3rd vs 4th G1 | 4th G2 vs 4th G3)
  const c1 = makeMatch('diamant', 'consolation', 1, thirds[2], g('G1', 4), 'Pista 3', 'C', SF)
  const c2 = makeMatch('diamant', 'consolation', 2, g('G2', 4), g('G3', 4), 'Pista 4', 'D', SF)

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
// Groups: G1–G5 (4 couples each, 5 groups)
// QF (slot 7, P5-P8) → SF (slot 8, P5-P6) → Final (slot 9, P5)
//
// Bracket:
//   A1: 1st G1  vs best 2nd
//   A2: 1st G2  vs 2nd-best 2nd
//   A3: 1st G3  vs 1st G4
//   A4: 1st G5  vs 3rd-best 2nd
//
// Consolation 2nd-tier: 4th-best 2nd vs 5th-best 2nd (C1)
// Consolation 3rd-tier: rank pairs (C2, C3)
// Consolation 4th-tier: rank pairs (C4, C5)
function generateOr(standingsByGroup) {
  const g = (group, rank) => place(standingsByGroup, group, rank)
  const groups = Object.keys(standingsByGroup).sort()

  const seconds = rankTeams(groups.map(gc => g(gc, 2)))
  const thirds  = rankTeams(groups.map(gc => g(gc, 3)))
  const fourths = rankTeams(groups.map(gc => g(gc, 4)))

  const QF  = '12:30h - 13:00h'
  const SF  = '13:00h - 13:30h'
  const FN  = '13:30h - 14:00h'

  // Quarter-finals
  const a1 = makeMatch('or', 'quarter', 1, g('G1', 1), seconds[0], 'Pista 5', 'E', QF)
  const a2 = makeMatch('or', 'quarter', 2, g('G2', 1), seconds[1], 'Pista 6', 'F', QF)
  const a3 = makeMatch('or', 'quarter', 3, g('G3', 1), g('G4', 1), 'Pista 7', 'G', QF)
  const a4 = makeMatch('or', 'quarter', 4, g('G5', 1), seconds[2], 'Pista 8', 'H', QF)

  // Semis
  const s1 = makeMatch('or', 'semi', 1, null, null, 'Pista 5', 'E', SF)
  const s2 = makeMatch('or', 'semi', 2, null, null, 'Pista 6', 'F', SF)

  // Final + 3rd place
  const fin   = makeMatch('or', 'final',       1, null, null, 'Pista 5', 'E', FN)
  const third = makeMatch('or', 'third_place', 1, null, null, 'Pista 6', 'F', FN)

  // Consolation — 2nd-place tier (4th and 5th best 2nds)
  const c1 = makeMatch('or', 'consolation', 1, seconds[3], seconds[4], 'Pista 7', 'G', SF)

  // Consolation — 3rd-place tier (paired by rank)
  const c2 = makeMatch('or', 'consolation', 2, thirds[0], thirds[1], 'Pista 8',  'H', SF)
  const c3 = makeMatch('or', 'consolation', 3, thirds[2], thirds[3], 'Pista 9',  'I', SF)
  // thirds[4] (5th 3rd) has no opponent with 5 groups — omitted

  // Consolation — 4th-place tier (top 4 of ranked 4ths)
  const c4 = makeMatch('or', 'consolation', 4, fourths[0], fourths[1], 'Pista 7', 'G', FN)
  const c5 = makeMatch('or', 'consolation', 5, fourths[2], fourths[3], 'Pista 8', 'H', FN)

  // Wire winners: QF → SF → Final
  a1.next_match_id = s1.id;  a1.next_match_slot = 'couple_a'
  a2.next_match_id = s1.id;  a2.next_match_slot = 'couple_b'
  a3.next_match_id = s2.id;  a3.next_match_slot = 'couple_a'
  a4.next_match_id = s2.id;  a4.next_match_slot = 'couple_b'
  s1.next_match_id = fin.id; s1.next_match_slot = 'couple_a'
  s2.next_match_id = fin.id; s2.next_match_slot = 'couple_b'

  return [a1, a2, a3, a4, s1, s2, fin, third, c1, c2, c3, c4, c5]
}

// ── Plata ─────────────────────────────────────────────────────────────────────
// Groups: G1, G2, G3 (4 couples each)
// No QF — SF starts in slot 7 on P11-P12 (groups end slot 6)
// SF (slot 7, P11-P12) → Final (slot 9, P11)
function generatePlata(standingsByGroup) {
  const g = (group, rank) => place(standingsByGroup, group, rank)

  const seconds = rankTeams(['G1', 'G2', 'G3'].map(gc => g(gc, 2)))
  const thirds  = rankTeams(['G1', 'G2', 'G3'].map(gc => g(gc, 3)))

  const SF = '12:30h - 13:00h'   // Plata SF runs in slot 7 (courts free after groups end slot 6)
  const C1 = '13:00h - 13:30h'
  const FN = '13:30h - 14:00h'

  // Semis
  const s1 = makeMatch('plata', 'semi', 1, g('G1', 1), g('G2', 1),  'Pista 11', 'K', SF)
  const s2 = makeMatch('plata', 'semi', 2, g('G3', 1), seconds[0],  'Pista 12', 'L', SF)

  // Final + 3rd place
  const fin   = makeMatch('plata', 'final',       1, null, null, 'Pista 11', 'K', FN)
  const third = makeMatch('plata', 'third_place', 1, null, null, 'Pista 12', 'L', FN)

  // Consolation — 2nd-place tier
  const c1 = makeMatch('plata', 'consolation', 1, seconds[1], seconds[2], 'Pista 9',  'I', C1)

  // Consolation — 3rd-place tier
  const c2 = makeMatch('plata', 'consolation', 2, thirds[0], thirds[1],   'Pista 10', 'J', C1)
  const c3 = makeMatch('plata', 'consolation', 3, thirds[2], g('G1', 4),  'Pista 11', 'K', C1)

  // Consolation — 4th-place tier
  const c4 = makeMatch('plata', 'consolation', 4, g('G2', 4), g('G3', 4), 'Pista 12', 'L', C1)

  // Wire winners: SF → Final
  s1.next_match_id = fin.id; s1.next_match_slot = 'couple_a'
  s2.next_match_id = fin.id; s2.next_match_slot = 'couple_b'

  return [s1, s2, fin, third, c1, c2, c3, c4]
}

// ── Public API ────────────────────────────────────────────────────────────────

const GENERATORS = { diamant: generateDiamant, or: generateOr, plata: generatePlata }

export function generateBracket(division, standingsByGroup) {
  const gen = GENERATORS[division]
  if (!gen) throw new Error(`Unknown division: ${division}`)
  return gen(standingsByGroup)
}

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
