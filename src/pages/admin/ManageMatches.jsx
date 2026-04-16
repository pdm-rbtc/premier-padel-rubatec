import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'
import AdminGuard from '../../components/AdminGuard.jsx'

const DIV_MAP   = { Diamante: 'diamant', Oro: 'or', Plata: 'plata' }
const HORA_MAP  = {
  '9.30':  '9:30h - 10:00h',
  '10':    '10:00h - 10:30h',
  '10.30': '10:30h - 11:00h',
  '11':    '11:00h - 11:30h',
  '11.30': '11:30h - 12:00h',
  '12':    '12:00h - 12:30h',
  '12.30': '12:30h - 13:00h',
  '13':    '13:00h - 13:30h',
  '13.30': '13:30h - 14:00h',
}
// Maps the sorted seed pair (e.g. "1-2") to DB round/position,
// which is fixed by how seed_group_matches() creates matches.
const PAIR_TO_ROUND = {
  '1-2': { round: 'R1', position: 1 },
  '3-4': { round: 'R1', position: 2 },
  '1-3': { round: 'R2', position: 1 },
  '2-4': { round: 'R2', position: 2 },
  '1-4': { round: 'R3', position: 1 },
  '2-3': { round: 'R3', position: 2 },
}

function parseCourtCSV(text) {
  const rows = []
  const errors = []
  const lines = text.trim().split('\n').slice(1)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split(';').map(s => s.trim())
    if (parts.length < 4) { errors.push(`Línea ${i + 2}: formato incorrecto`); continue }
    const [divRaw, partido, horaRaw, pistaRaw] = parts
    const division = DIV_MAP[divRaw]
    if (!division) { errors.push(`Línea ${i + 2}: división desconocida "${divRaw}"`); continue }
    const m = partido.match(/^(G\d+)\.(\d+)\s*[–\-]\s*G\d+\.(\d+)$/)
    if (!m) { errors.push(`Línea ${i + 2}: partido no reconocido "${partido}"`); continue }
    const time_slot = HORA_MAP[horaRaw]
    if (!time_slot) { errors.push(`Línea ${i + 2}: hora desconocida "${horaRaw}"`); continue }
    const court = parseInt(pistaRaw)
    if (isNaN(court) || court < 1 || court > 12) { errors.push(`Línea ${i + 2}: pista inválida "${pistaRaw}"`); continue }
    const sa = parseInt(m[2]), sb = parseInt(m[3])
    const pairKey = `${Math.min(sa, sb)}-${Math.max(sa, sb)}`
    const rp = PAIR_TO_ROUND[pairKey]
    if (!rp) { errors.push(`Línea ${i + 2}: combinación de seeds desconocida "${pairKey}"`); continue }
    rows.push({
      division,
      group_code: m[1],
      round: rp.round,
      position: rp.position,
      label: `${m[1]} ${sa}v${sb}`,
      time_slot,
      court: `Pista ${court}`,
      court_label: String.fromCharCode(64 + court),
    })
  }
  return { rows, errors }
}

function CourtImportPanel({ onClose }) {
  const fileRef = useRef()
  const [parsed, setParsed]     = useState(null)
  const [errors, setErrors]     = useState([])
  const [preview, setPreview]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [result, setResult]     = useState(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const { rows, errors } = parseCourtCSV(ev.target.result)
      setParsed(rows)
      setErrors(errors)
      setPreview(null)
      setResult(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handlePreview() {
    if (!parsed?.length) return
    const { data: matches } = await supabase
      .from('matches').select('id, division, group_code, round, position')
      .eq('phase', 'group')

    const matchMap = {}
    for (const m of (matches ?? [])) {
      matchMap[`${m.division}-${m.group_code}-${m.round}-${m.position}`] = m.id
    }

    const resolved = []
    const unresolved = []
    for (const row of parsed) {
      const key = `${row.division}-${row.group_code}-${row.round}-${row.position}`
      const matchId = matchMap[key]
      if (!matchId) { unresolved.push(`${row.division} ${row.group_code} ${row.label}: partido no encontrado`); continue }
      resolved.push({ matchId, court: row.court, court_label: row.court_label, time_slot: row.time_slot,
        label: `${row.division.toUpperCase()} ${row.group_code} ${row.label}` })
    }
    setErrors(prev => [...prev, ...unresolved])
    setPreview(resolved)
  }

  async function handleSave() {
    if (!preview?.length) return
    setSaving(true)
    setResult(null)
    let failed = 0
    for (const row of preview) {
      const { error } = await supabase.from('matches').update({
        court: row.court,
        court_label: row.court_label,
        time_slot: row.time_slot,
      }).eq('id', row.matchId)
      if (error) failed++
    }
    setSaving(false)
    setResult(failed === 0
      ? { ok: true,  msg: `${preview.length} partidos actualizados correctamente.` }
      : { ok: false, msg: `${failed} partidos fallaron. Revisa la consola.` })
  }

  return (
    <div className="bg-surface border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Importar distribución de pistas</h2>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-sm">✕ Cerrar</button>
      </div>
      <p className="text-xs text-text-secondary">
        CSV con cabecera <code className="bg-gray-100 px-1 rounded">Division;Partido;Hora;Pista</code>. Separador punto y coma. Actualiza pista y franja horaria en los partidos de grupo existentes.
      </p>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
        className="block w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          <p className="text-sm font-medium text-red-700">Advertencias ({errors.length}):</p>
          {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

      {parsed && !preview && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">{parsed.length} filas parseadas</span>
          <button onClick={handlePreview}
            className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
            Vista previa
          </button>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-gray-100 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-text-secondary sticky top-0">
                <tr>
                  {['Partido', 'Pista', 'Franja'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2">{r.court}</td>
                    <td className="px-3 py-2">{r.time_slot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? 'Guardando…' : `Aplicar ${preview.length} cambios`}
          </button>
        </div>
      )}

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.msg}
        </div>
      )}
    </div>
  )
}

const FILTERS = [
  { value: 'disputed',             label: 'En disputa',          color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'pending_confirmation', label: 'Pend. confirmación',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'scheduled',            label: 'Programados',         color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'confirmed',            label: 'Confirmados',         color: 'text-green-700 bg-green-50 border-green-200' },
]

export default function ManageMatches() {
  return (
    <AdminGuard>
      <ManageMatchesContent />
    </AdminGuard>
  )
}

function ManageMatchesContent() {
  const { user } = useAuth()
  const [filter, setFilter]           = useState('disputed')
  const [matches, setMatches]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [resolving, setResolving]     = useState(null)
  const [showImport, setShowImport]   = useState(false)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('matches')
      .select('*, couple_a:couple_a_id(*), couple_b:couple_b_id(*)')
      .eq('status', filter)
      .order('scheduled_at')
      .then(({ data }) => { setMatches(data ?? []); setLoading(false) })
  }, [filter])

  async function resolveDispute(matchId, winnerId, scoreA, scoreB) {
    setResolving(matchId)
    const parseGames = (score, side) =>
      score.split(' ').reduce((s, p) => s + (parseInt(p.split('-')[side] || 0) || 0), 0)
    const gamesA = parseGames(scoreA, 0)
    const gamesB = parseGames(scoreB, 1)

    const { error } = await supabase.rpc('admin_resolve_match', {
      p_match_id:  matchId,
      p_actor_id:  user.id,
      p_winner_id: winnerId,
      p_score_a:   scoreA,
      p_score_b:   scoreB,
      p_games_a:   gamesA,
      p_games_b:   gamesB,
    })

    setResolving(null)
    if (!error) setMatches(prev => prev.filter(m => m.id !== matchId))
  }

  async function adminConfirm(matchId) {
    setResolving(matchId)
    const { error } = await supabase.rpc('confirm_match', {
      p_match_id: matchId,
      p_actor_id: user.id,
    })
    setResolving(null)
    if (!error) setMatches(prev => prev.filter(m => m.id !== matchId))
  }

  const currentFilter = FILTERS.find(f => f.value === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Partidos</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImport(v => !v)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors
              ${showImport ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
          >
            {showImport ? '← Volver' : '↑ Importar pistas'}
          </button>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
                ${filter === f.value ? f.color : 'text-text-secondary bg-white border-gray-200 hover:border-gray-300'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {showImport && <CourtImportPanel onClose={() => setShowImport(false)} />}

      {!showImport && (loading ? (
        <p className="text-text-secondary text-sm">Cargando…</p>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-text-secondary text-sm">
          No hay partidos en estado "{currentFilter?.label}".
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <MatchAdminRow
              key={m.id}
              match={m}
              filter={filter}
              resolving={resolving === m.id}
              onAdminConfirm={() => adminConfirm(m.id)}
              onResolveDispute={(winnerId, sa, sb) => resolveDispute(m.id, winnerId, sa, sb)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function MatchAdminRow({ match, filter, resolving, onAdminConfirm, onResolveDispute }) {
  const [expanded, setExpanded] = useState(filter === 'disputed')
  const [overrideScore, setOverrideScore] = useState({
    score_a: match.score_a ?? '',
    score_b: match.score_b ?? '',
    winner:  match.winner_id ?? match.couple_a_id,
  })

  const nameA = match.couple_a?.team_name ?? 'Pareja A'
  const nameB = match.couple_b?.team_name ?? 'Pareja B'

  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {match.division && (
              <span className="text-xs text-text-secondary capitalize">{match.division}</span>
            )}
            {match.round && (
              <span className="text-xs text-text-secondary">· {match.round}</span>
            )}
            {match.time_slot && (
              <span className="text-xs text-text-secondary">· {match.time_slot}</span>
            )}
            {match.court && (
              <span className="text-xs text-text-secondary">· {match.court}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="truncate">{nameA}</span>
            <span className="text-text-secondary shrink-0 font-normal">vs</span>
            <span className="truncate">{nameB}</span>
          </div>
          {match.score_a && (
            <div className="text-xs font-mono text-primary mt-1">
              {match.score_a} — {match.score_b}
            </div>
          )}
        </div>
        <span className="text-text-secondary shrink-0">{expanded ? '↑' : '↓'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/30 space-y-4">

          {/* Pending confirmation — admin can just confirm */}
          {filter === 'pending_confirmation' && (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">
                Resultado enviado:
                <span className="font-mono font-bold text-primary ml-2">
                  {match.score_a} — {match.score_b}
                </span>
                <span className="ml-2 text-xs">(esperando confirmación del rival)</span>
              </p>
              <button
                onClick={onAdminConfirm}
                disabled={resolving}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {resolving ? 'Confirmando…' : 'Confirmar como admin'}
              </button>
            </div>
          )}

          {/* Disputed — admin override with editable score */}
          {filter === 'disputed' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600">Resultado en disputa — introduce el resultado correcto:</p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Resultado (ej: 6-4 4-6 7-5)</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={overrideScore.score_a}
                    onChange={e => setOverrideScore(s => ({ ...s, score_a: e.target.value }))}
                    placeholder="6-4"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                  <span className="text-text-secondary">—</span>
                  <input
                    value={overrideScore.score_b}
                    onChange={e => setOverrideScore(s => ({ ...s, score_b: e.target.value }))}
                    placeholder="4-6"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Ganador</label>
                <div className="flex gap-2">
                  {[
                    { id: match.couple_a_id, name: nameA },
                    { id: match.couple_b_id, name: nameB },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setOverrideScore(s => ({ ...s, winner: opt.id }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${overrideScore.winner === opt.id
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-text-primary border-gray-200 hover:border-primary/50'}`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onResolveDispute(overrideScore.winner, overrideScore.score_a, overrideScore.score_b)}
                disabled={resolving || !overrideScore.score_a || !overrideScore.score_b}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {resolving ? 'Guardando…' : 'Guardar resolución'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
