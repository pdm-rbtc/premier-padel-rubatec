import { useStandings } from '../hooks/useStandings.js'
import { formatName } from '../lib/utils.js'
import { DIVISION_CONFIG } from '../lib/divisions.js'

export default function GroupTable({ division, groupCode, standings: standingsProp }) {
  const shouldFetch = !standingsProp
  const { standings: fetched, loading } = useStandings(
    shouldFetch ? division : null,
    shouldFetch ? groupCode : null,
  )

  const standings = standingsProp ?? fetched
  const isLoading = shouldFetch ? loading : false

  if (isLoading) return <div className="text-text-secondary text-sm px-4 py-6">Cargando...</div>

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm font-bold tracking-wide">Grupo {groupCode}</span>
        <span className="text-xs text-accent/80">{DIVISION_CONFIG[division]?.label ?? division}</span>
      </div>

      {/* Table — wraps for horizontal scroll on very narrow screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-text-secondary text-xs border-b border-gray-100">
              <th className="text-left px-4 py-2 font-medium">Pareja</th>
              <th className="text-center px-2 py-2 font-medium">PJ</th>
              <th className="text-center px-2 py-2 font-medium hidden sm:table-cell">PG</th>
              <th className="text-center px-2 py-2 font-medium hidden sm:table-cell">PP</th>
              <th className="text-center px-2 py-2 font-medium">DIF</th>
              <th className="text-center px-2 py-2 font-medium">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {standings.map((row, i) => (
              <tr
                key={row.couple_id}
                className={`${i < 2 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${i === 0 ? 'bg-accent text-primary' :
                        i === 1 ? 'bg-primary/10 text-primary' :
                        'bg-gray-100 text-text-secondary'}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">
                        {row.couple?.team_name}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {formatName(row.couple?.player_1_name)} · {formatName(row.couple?.player_2_name)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center px-2 py-2.5 text-text-secondary">{row.matches_played}</td>
                <td className="text-center px-2 py-2.5 text-text-secondary hidden sm:table-cell">{row.matches_won}</td>
                <td className="text-center px-2 py-2.5 text-text-secondary hidden sm:table-cell">{row.matches_lost}</td>
                <td className="text-center px-2 py-2.5 text-text-secondary">
                  {row.game_differential > 0 ? '+' : ''}{row.game_differential}
                </td>
                <td className="text-center px-2 py-2.5 font-bold text-primary">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
