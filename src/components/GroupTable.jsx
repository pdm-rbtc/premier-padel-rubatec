import { useStandings } from '../hooks/useStandings.js'
import { DIVISION_CONFIG } from '../lib/divisions.js'

export default function GroupTable({ division, groupCode, standings: standingsProp }) {
  const shouldFetch = !standingsProp
  const { standings: fetched, loading } = useStandings(
    shouldFetch ? division : null,
    shouldFetch ? groupCode : null,
  )

  const standings  = standingsProp ?? fetched
  const isLoading  = shouldFetch ? loading : false
  const divColor   = DIVISION_CONFIG[division]?.color ?? '#0433FF'

  if (isLoading) return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: 20,
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: 12,
    }}>
      Cargando...
    </div>
  )

  const matchesPlayed = standings[0]?.matches_played ?? 0

  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,29,114,.05)',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 14px',
        background: `linear-gradient(135deg,#001d72,${divColor})`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: '#11efb5', fontWeight: 700, fontSize: 12, letterSpacing: .5 }}>
          GRUPO {groupCode}
        </span>
        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 10 }}>
          {matchesPlayed > 0 ? `${matchesPlayed}/3` : '—'}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              {['#', 'Pareja', 'PJ', 'G', 'P', 'JF', 'JC', '±', 'PTS'].map(h => (
                <th key={h} style={{
                  padding: '7px 5px',
                  textAlign: h === 'Pareja' ? 'left' : 'center',
                  color: '#94a3b8',
                  fontWeight: 500,
                  fontSize: 9,
                  letterSpacing: .5,
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const df   = row.game_differential ?? (row.games_for - row.games_against)
              const dept = row.couple?.department ?? row.couple?.centre ?? ''
              return (
                <tr key={row.couple_id} style={{
                  borderBottom: '1px solid #f8fafc',
                  background: i === 0 ? 'rgba(17,239,181,.03)' : 'transparent',
                }}>
                  {/* # rank */}
                  <td style={{
                    padding: '8px 5px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                    color: i === 0 ? '#0cb882' : i === 1 ? '#0433FF' : '#cbd5e1',
                  }}>
                    {i + 1}
                  </td>

                  {/* Pareja */}
                  <td style={{ padding: '8px 5px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12, lineHeight: 1.2 }}>
                      {row.couple?.team_name}
                    </div>
                    {dept && (
                      <div style={{ color: '#b0b8c8', fontSize: 9, marginTop: 1 }}>{dept}</div>
                    )}
                  </td>

                  {/* PJ */}
                  <td style={{ textAlign: 'center', color: '#64748b', padding: '8px 5px' }}>
                    {row.matches_played}
                  </td>

                  {/* G (wins) */}
                  <td style={{ textAlign: 'center', color: '#0cb882', fontWeight: 600, padding: '8px 5px' }}>
                    {row.matches_won}
                  </td>

                  {/* P (losses) */}
                  <td style={{
                    textAlign: 'center',
                    padding: '8px 5px',
                    color: row.matches_lost > 0 ? '#ef4444' : '#cbd5e1',
                  }}>
                    {row.matches_lost}
                  </td>

                  {/* JF */}
                  <td style={{ textAlign: 'center', color: '#64748b', padding: '8px 5px' }}>
                    {row.games_for}
                  </td>

                  {/* JC */}
                  <td style={{ textAlign: 'center', color: '#64748b', padding: '8px 5px' }}>
                    {row.games_against}
                  </td>

                  {/* ± differential */}
                  <td style={{
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 11,
                    padding: '8px 5px',
                    color: df > 0 ? '#0cb882' : df < 0 ? '#ef4444' : '#cbd5e1',
                  }}>
                    {df > 0 ? '+' : ''}{df}
                  </td>

                  {/* PTS */}
                  <td style={{
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#001d72',
                    fontSize: 14,
                    padding: '8px 5px',
                  }}>
                    {row.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
