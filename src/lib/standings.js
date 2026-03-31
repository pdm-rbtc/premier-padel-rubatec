// Calculate standings from an array of confirmed match objects
// matches: [{ couple_a_id, couple_b_id, games_a, games_b, winner_id, status }]
export function calculateStandings(matches, coupleIds) {
  const table = Object.fromEntries(
    coupleIds.map(id => [id, {
      couple_id: id,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      games_for: 0,
      games_against: 0,
      game_differential: 0,
      points: 0,
    }])
  )

  for (const m of matches) {
    if (m.status !== 'confirmed') continue
    const a = table[m.couple_a_id]
    const b = table[m.couple_b_id]
    if (!a || !b) continue

    a.matches_played++
    b.matches_played++
    a.games_for += m.games_a
    a.games_against += m.games_b
    b.games_for += m.games_b
    b.games_against += m.games_a

    if (m.winner_id === m.couple_a_id) {
      a.matches_won++; a.points += 3
      b.matches_lost++
    } else {
      b.matches_won++; b.points += 3
      a.matches_lost++
    }
  }

  for (const row of Object.values(table)) {
    row.game_differential = row.games_for - row.games_against
  }

  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.game_differential !== a.game_differential) return b.game_differential - a.game_differential
    return 0
  })
}
