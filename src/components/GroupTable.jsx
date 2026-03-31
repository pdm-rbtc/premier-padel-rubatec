import { useStandings } from '../hooks/useStandings.js'

export default function GroupTable({ division, groupCode }) {
  const { standings, loading } = useStandings(division, groupCode)

  if (loading) return <div className="text-text-secondary text-sm">Cargando...</div>

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-primary text-white px-4 py-2 text-sm font-semibold">
        {groupCode}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-text-secondary text-xs">
          <tr>
            <th className="text-left px-4 py-2">Pareja</th>
            <th className="text-center px-2 py-2">PJ</th>
            <th className="text-center px-2 py-2">PG</th>
            <th className="text-center px-2 py-2">PP</th>
            <th className="text-center px-2 py-2">DIF</th>
            <th className="text-center px-2 py-2">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.couple_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 font-medium">{row.couple?.team_name}</td>
              <td className="text-center px-2 py-2">{row.matches_played}</td>
              <td className="text-center px-2 py-2">{row.matches_won}</td>
              <td className="text-center px-2 py-2">{row.matches_lost}</td>
              <td className="text-center px-2 py-2">{row.game_differential > 0 ? '+' : ''}{row.game_differential}</td>
              <td className="text-center px-2 py-2 font-bold text-primary">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
