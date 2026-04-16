import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase.js'
import AdminGuard from '../../components/AdminGuard.jsx'
import { DUMMY_COUPLES } from '../../lib/dummy.js'

const DIVISIONS   = ['diamant', 'or', 'plata']
const REQUIRED    = ['player_1_name', 'player_1_surname', 'player_2_name', 'player_2_surname', 'division', 'group_code']
// CSV uses semicolon delimiter and per-player centre/department columns
const CSV_HEADERS = ['player_1_name', 'player_1_surname', 'player_1_email', 'player_1_centre', 'player_1_department', 'player_2_name', 'player_2_surname', 'player_2_email', 'player_2_centre', 'player_2_department', 'division', 'group_code', 'seed']

// "J. García / P. López" from separate first name + surname fields
function autoTeamName(p1First, p1Last, p2First, p2Last) {
  const fmt = (first, last) => `${first.trim()[0].toUpperCase()}. ${last.trim()}`
  return `${fmt(p1First, p1Last)} / ${fmt(p2First, p2Last)}`
}

function validateRow(row, index) {
  const errors = []
  for (const field of REQUIRED) {
    if (!row[field]?.trim()) errors.push(`Fila ${index + 2}: falta "${field}"`)
  }
  if (row.division && !DIVISIONS.includes(row.division.toLowerCase().trim())) {
    errors.push(`Fila ${index + 2}: división inválida "${row.division}" (debe ser diamant, or o plata)`)
  }
  return errors
}

// ── Template download ─────────────────────────────────────────────────────────
// Split a stored full name "Joan García" → { name: 'Joan', surname: 'García' }
function splitName(full = '') {
  const parts = full.trim().split(' ')
  return { name: parts[0] ?? '', surname: parts.slice(1).join(' ') || '' }
}

function downloadTemplate(source) {
  const rows = source.map(c => {
    const p1 = splitName(c.player_1_name)
    const p2 = splitName(c.player_2_name)
    // Stored centre is "Centre1 · Centre2" — split back for template
    const [c1, c2] = (c.centre ?? '').split(' · ')
    const [d1, d2] = (c.department ?? '').split(' · ')
    return {
      player_1_name:       p1.name,
      player_1_surname:    p1.surname,
      player_1_email:      c.player_1_email ?? '',
      player_1_centre:     c1 ?? '',
      player_1_department: d1 ?? '',
      player_2_name:       p2.name,
      player_2_surname:    p2.surname,
      player_2_email:      c.player_2_email ?? '',
      player_2_centre:     c2 ?? '',
      player_2_department: d2 ?? '',
      division:            c.division,
      group_code:          c.group_code,
      seed:                c.seed ?? '',
    }
  })
  const csv = Papa.unparse({ fields: CSV_HEADERS, data: rows, delimiter: ';' })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'parejas_torneo.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function ManageCouples() {
  return (
    <AdminGuard>
      <ManageCouplesContent />
    </AdminGuard>
  )
}

// Charset excludes 0/O, 1/I/L to avoid confusion when reading aloud
const PIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generatePin(len = 6) {
  return Array.from({ length: len }, () => PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)]).join('')
}

function ManageCouplesContent() {
  const [couples, setCouples]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('list')  // 'list' | 'import' | 'pins'

  // Import state
  const [preview, setPreview]       = useState(null)   // parsed rows
  const [parseErrors, setParseErrors] = useState([])
  const [importing, setImporting]   = useState(false)
  const [importResult, setImportResult] = useState(null)

  // PIN editing state
  const [editingPinId, setEditingPinId]   = useState(null)
  const [pinDraft, setPinDraft]           = useState('')
  const [pinSaving, setPinSaving]         = useState(false)
  const [pinError, setPinError]           = useState('')
  const [copiedId, setCopiedId]           = useState(null)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [resettingPins, setResettingPins]   = useState(false)

  async function savePin(coupleId) {
    const value = pinDraft.toUpperCase().trim()
    if (!value) return
    setPinSaving(true)
    setPinError('')
    const { error } = await supabase.from('couples').update({ login_pin: value }).eq('id', coupleId)
    setPinSaving(false)
    if (error) {
      setPinError(error.message.includes('unique') ? 'Este PIN ya está en uso.' : error.message)
    } else {
      setCouples(prev => prev.map(c => c.id === coupleId ? { ...c, login_pin: value } : c))
      setEditingPinId(null)
      setPinDraft('')
    }
  }

  function copyPin(pin, id) {
    navigator.clipboard.writeText(pin).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  async function bulkGeneratePins() {
    setBulkGenerating(true)
    const missing = couples.filter(c => !c.login_pin)
    for (const c of missing) {
      let pin, taken = true
      // Generate a unique PIN (retry on collision)
      while (taken) {
        pin = generatePin()
        taken = couples.some(x => x.login_pin === pin)
      }
      const { error } = await supabase.from('couples').update({ login_pin: pin }).eq('id', c.id)
      if (!error) {
        setCouples(prev => prev.map(x => x.id === c.id ? { ...x, login_pin: pin } : x))
      }
    }
    setBulkGenerating(false)
  }

  async function resetAllPins() {
    if (!window.confirm('¿Resetear todos los PINs? Los jugadores no podrán entrar hasta que se les asigne un nuevo PIN.')) return
    setResettingPins(true)
    const { error } = await supabase.from('couples').update({ login_pin: null }).neq('id', '00000000-0000-0000-0000-000000000000')
    setResettingPins(false)
    if (!error) setCouples(prev => prev.map(c => ({ ...c, login_pin: null })))
  }

  const fileRef = useRef()

  useEffect(() => {
    supabase.from('couples').select('*').order('division').then(({ data }) => {
      setCouples(data?.length ? data : DUMMY_COUPLES)
      setLoading(false)
    })
  }, [])

  // ── CSV parse ───────────────────────────────────────────────────────────────
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',   // CSV uses semicolons
      transformHeader: h => h.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, '_'),
      complete: ({ data }) => {
        const errors = data.flatMap((row, i) => validateRow(row, i))
        setParseErrors(errors)
        if (!errors.length) {
          setPreview(data.map(row => {
            // Combine per-player centre/department into "Centre1 · Centre2" for DB storage
            const centres = [row.player_1_centre?.trim(), row.player_2_centre?.trim()].filter(Boolean)
            const depts   = [row.player_1_department?.trim(), row.player_2_department?.trim()].filter(Boolean)
            return {
              player_1_name:  `${row.player_1_name.trim()} ${row.player_1_surname.trim()}`.trim(),
              player_1_email: row.player_1_email?.trim().toLowerCase() || null,
              player_2_name:  `${row.player_2_name.trim()} ${row.player_2_surname.trim()}`.trim(),
              player_2_email: row.player_2_email?.trim().toLowerCase() || null,
              division:       row.division.toLowerCase().trim(),
              group_code:     row.group_code.trim().toUpperCase(),
              seed:           row.seed ? parseInt(row.seed, 10) || null : null,
              centre:         centres.length ? centres.join(' · ') : null,
              department:     depts.length   ? depts.join(' · ')   : null,
              team_name:      autoTeamName(row.player_1_name, row.player_1_surname, row.player_2_name, row.player_2_surname),
            }
          }))
        } else {
          setPreview(null)
        }
      },
    })
  }

  // ── Supabase import ─────────────────────────────────────────────────────────
  async function handleImport({ replace = false } = {}) {
    if (!preview?.length) return
    setImporting(true)
    setImportResult(null)

    try {
      if (replace) {
        // Tear-down in FK order: null users.couple_id → delete matches → delete standings → delete couples
        const { data: existingCouples } = await supabase.from('couples').select('id')
        const ids = (existingCouples ?? []).map(c => c.id)
        if (ids.length) {
          // Null FK on users
          await supabase.from('users').update({ couple_id: null }).in('couple_id', ids)
          // Delete group matches (group_standings FK → matches doesn't exist, but matches.couple_a/b_id → couples does)
          await supabase.from('matches').delete().eq('phase', 'group')
          // Delete knockout matches too
          await supabase.from('matches').delete().eq('phase', 'knockout')
          // Delete standings
          await supabase.from('group_standings').delete().in('couple_id', ids)
          // Delete couples in chunks to avoid URL length limits
          for (let i = 0; i < ids.length; i += 20) {
            await supabase.from('couples').delete().in('id', ids.slice(i, i + 20))
          }
        }
      }

      // Insert couples
      const { data: inserted, error: insertError } = await supabase
        .from('couples')
        .insert(preview)
        .select()

      if (insertError) throw new Error(insertError.message)

      // Create blank group_standings rows for each inserted couple
      const standingsRows = inserted.map(c => ({
        couple_id:         c.id,
        division:          c.division,
        group_code:        c.group_code,
        matches_played:    0,
        matches_won:       0,
        matches_lost:      0,
        games_for:         0,
        games_against:     0,
        game_differential: 0,
        points:            0,
        rank:              c.seed ?? null,
      }))
      const { error: standingsError } = await supabase
        .from('group_standings')
        .upsert(standingsRows, { onConflict: 'couple_id,division,group_code' })

      if (standingsError) throw new Error(`Parejas importadas, pero error en clasificaciones: ${standingsError.message}`)

      setImportResult({ ok: true, message: `${inserted.length} parejas importadas y clasificaciones inicializadas.` })
      setCouples(replace ? inserted : prev => [...prev, ...inserted])
      setPreview(null)
      setParseErrors([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setImportResult({ ok: false, message: e.message })
    } finally {
      setImporting(false)
    }
  }

  const byDivision = div => couples.filter(c => c.division === div)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Parejas</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { if (!loading && couples.length) downloadTemplate(couples) }}
            disabled={loading || !couples.length}
            className="text-sm border border-gray-200 text-text-secondary px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↓ Plantilla CSV
          </button>
          <button
            onClick={() => setActiveTab('pins')}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors
              ${activeTab === 'pins'
                ? 'bg-secondary text-white'
                : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
          >
            🔑 PINs
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'import' ? 'list' : 'import')}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors
              ${activeTab === 'import'
                ? 'bg-primary text-white'
                : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
          >
            {activeTab === 'import' ? '← Volver' : '↑ Importar CSV'}
          </button>
        </div>
      </div>

      {/* Import panel */}
      {activeTab === 'import' && (
        <div className="bg-surface border border-gray-100 rounded-xl p-5 space-y-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Importar parejas desde CSV</h2>
            <p className="text-xs text-text-secondary">
              Descarga la plantilla, rellénala en Excel o Google Sheets y súbela aquí.
              Obligatorias: <code className="bg-gray-100 px-1 rounded">player_1_name</code>, <code className="bg-gray-100 px-1 rounded">player_1_surname</code>, <code className="bg-gray-100 px-1 rounded">player_2_name</code>, <code className="bg-gray-100 px-1 rounded">player_2_surname</code>, <code className="bg-gray-100 px-1 rounded">division</code>, <code className="bg-gray-100 px-1 rounded">group_code</code>. Opcionales: emails, <code className="bg-gray-100 px-1 rounded">centre</code>, <code className="bg-gray-100 px-1 rounded">department</code>.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />

          {/* Validation errors */}
          {parseErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-red-700">Errores en el archivo ({parseErrors.length}):</p>
              {parseErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {preview && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-green-700">{preview.length} parejas</span> listas para importar:
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-text-secondary">
                    <tr>
                      {['Jugador 1', 'Email 1', 'Jugador 2', 'Email 2', 'División', 'Grupo', 'Pos.', 'Nombre equipo', 'Centres', 'Dptos.'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2">{row.player_1_name}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.player_1_email ?? '—'}</td>
                        <td className="px-3 py-2">{row.player_2_name}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.player_2_email ?? '—'}</td>
                        <td className="px-3 py-2 capitalize">{row.division}</td>
                        <td className="px-3 py-2">{row.group_code}</td>
                        <td className="px-3 py-2 text-center text-text-secondary">{row.seed ?? '—'}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.team_name}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.centre ?? '—'}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.department ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleImport({ replace: false })}
                  disabled={importing}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {importing ? 'Importando…' : `↑ Añadir (${preview.length} parejas)`}
                </button>
                <button
                  onClick={() => handleImport({ replace: true })}
                  disabled={importing}
                  className="flex-1 border-2 border-red-400 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {importing ? 'Importando…' : `↻ Reemplazar todo (${preview.length} parejas)`}
                </button>
              </div>
            </div>
          )}

          {importResult && (
            <div className={`rounded-lg p-3 text-sm font-medium ${importResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {importResult.message}
            </div>
          )}
        </div>
      )}

      {/* PIN management tab */}
      {activeTab === 'pins' && (
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p className="text-sm text-text-secondary">
                Códigos PIN para jugadores sin cuenta <code className="bg-gray-100 px-1 rounded">@rubatec.cat</code>.
                Da cada PIN al jugador correspondiente para que pueda acceder al portal.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={bulkGeneratePins}
                disabled={bulkGenerating || couples.every(c => c.login_pin)}
                style={{
                  background: bulkGenerating ? '#f1f5f9' : 'rgba(4,51,255,.07)',
                  color: bulkGenerating ? '#94a3b8' : '#0433FF',
                  border: '1px solid',
                  borderColor: bulkGenerating ? '#e2e8f0' : 'rgba(4,51,255,.2)',
                  borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  cursor: bulkGenerating || couples.every(c => c.login_pin) ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {bulkGenerating ? 'Generando…' : '✦ Generar PINs faltantes'}
              </button>
              <button
                onClick={resetAllPins}
                disabled={resettingPins || couples.every(c => !c.login_pin)}
                style={{
                  background: resettingPins ? '#f1f5f9' : 'rgba(239,68,68,.07)',
                  color: resettingPins ? '#94a3b8' : '#ef4444',
                  border: '1px solid',
                  borderColor: resettingPins ? '#e2e8f0' : 'rgba(239,68,68,.2)',
                  borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  cursor: resettingPins || couples.every(c => !c.login_pin) ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {resettingPins ? 'Reseteando…' : '↺ Resetear todos'}
              </button>
            </div>
          </div>

          {DIVISIONS.map(div => {
            const divCouples = couples.filter(c => c.division === div)
            if (!divCouples.length) return null
            const groups = [...new Set(divCouples.map(c => c.group_code))].sort()
            return (
              <div key={div}>
                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 capitalize">
                  División {div}
                </h2>
                <div className="bg-surface border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-text-secondary">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Grupo</th>
                        <th className="text-left px-4 py-2 font-medium">Pareja</th>
                        <th className="text-left px-4 py-2 font-medium">Jugadores</th>
                        <th className="text-left px-4 py-2 font-medium">PIN</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {groups.flatMap(g =>
                        divCouples
                          .filter(c => c.group_code === g)
                          .map(c => (
                            <tr key={c.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-medium text-primary">{g}</td>
                              <td className="px-4 py-2.5 font-semibold text-text-primary">{c.team_name}</td>
                              <td className="px-4 py-2.5 text-text-secondary">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <span>
                                    {c.player_1_name}
                                    {c.player_1_email
                                      ? <span style={{ color: '#94a3b8', fontSize: 10, marginLeft: 4 }}>{c.player_1_email}</span>
                                      : <span style={{ color: '#ef4444', fontSize: 10, marginLeft: 4 }}>sin email</span>
                                    }
                                  </span>
                                  <span>
                                    {c.player_2_name}
                                    {c.player_2_email
                                      ? <span style={{ color: '#94a3b8', fontSize: 10, marginLeft: 4 }}>{c.player_2_email}</span>
                                      : <span style={{ color: '#ef4444', fontSize: 10, marginLeft: 4 }}>sin email</span>
                                    }
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                {editingPinId === c.id ? (
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      value={pinDraft}
                                      onChange={e => { setPinDraft(e.target.value.toUpperCase()); setPinError('') }}
                                      onKeyDown={e => { if (e.key === 'Enter') savePin(c.id); if (e.key === 'Escape') { setEditingPinId(null); setPinDraft('') } }}
                                      maxLength={8}
                                      autoFocus
                                      style={{
                                        width: 80, border: '1px solid #e2e8f0',
                                        borderRadius: 5, padding: '3px 7px', fontSize: 11,
                                        fontWeight: 700, letterSpacing: 2, fontFamily: 'DM Mono, monospace',
                                        outline: 'none', color: '#0032a0',
                                      }}
                                    />
                                    <button onClick={() => { setPinDraft(generatePin()); setPinError('') }}
                                      style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#64748b' }}>
                                      ↺
                                    </button>
                                    <button onClick={() => savePin(c.id)} disabled={pinSaving}
                                      style={{ fontSize: 10, padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', background: '#0032a0', color: 'white', fontWeight: 600 }}>
                                      {pinSaving ? '…' : '✓'}
                                    </button>
                                    <button onClick={() => { setEditingPinId(null); setPinDraft(''); setPinError('') }}
                                      style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#94a3b8' }}>
                                      ✕
                                    </button>
                                  </div>
                                ) : c.login_pin ? (
                                  <span style={{
                                    fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 12,
                                    letterSpacing: 2, color: '#0433FF', background: 'rgba(4,51,255,.07)',
                                    padding: '3px 8px', borderRadius: 5,
                                  }}>{c.login_pin}</span>
                                ) : (
                                  <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>
                                )}
                                {editingPinId === c.id && pinError && (
                                  <p style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>{pinError}</p>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {c.login_pin && (
                                    <button onClick={() => copyPin(c.login_pin, c.id)}
                                      style={{ fontSize: 11, padding: '3px 7px', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', background: 'white', color: copiedId === c.id ? '#0cb882' : '#94a3b8' }}>
                                      {copiedId === c.id ? '✓ Copiado' : '⎘ Copiar'}
                                    </button>
                                  )}
                                  <button onClick={() => { setEditingPinId(c.id); setPinDraft(c.login_pin ?? generatePin()); setPinError('') }}
                                    style={{ fontSize: 11, padding: '3px 7px', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', background: 'white', color: '#64748b' }}>
                                    {c.login_pin ? '✎' : '+ Asignar'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Couple list */}
      {activeTab === 'list' && (
        loading ? (
          <p className="text-text-secondary text-sm">Cargando…</p>
        ) : (
          <div className="space-y-6">
            {DIVISIONS.map(div => {
              const divCouples = byDivision(div)
              if (!divCouples.length) return null
              const groups = [...new Set(divCouples.map(c => c.group_code))].sort()
              return (
                <div key={div}>
                  <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3 capitalize">
                    División {div} — {divCouples.length} parejas
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups.map(g => (
                      <div key={g} className="bg-surface border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-primary/5 px-3 py-2 text-xs font-bold text-primary">
                          Grupo {g}
                        </div>
                        {divCouples.filter(c => c.group_code === g).map((c, i) => (
                          <div key={c.id} className={`px-3 py-2.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                            <div className="font-semibold text-sm text-text-primary">{c.team_name}</div>
                            <div className="text-xs text-text-secondary mt-0.5">
                              {c.player_1_name} · {c.player_2_name}
                            </div>
                            {(c.centre || c.department) && (
                              <div className="text-xs text-text-secondary/60 mt-0.5">
                                {[c.centre, c.department].filter(Boolean).join(' · ')}
                              </div>
                            )}

                            {/* PIN row */}
                            {editingPinId === c.id ? (
                              <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={pinDraft}
                                  onChange={e => { setPinDraft(e.target.value.toUpperCase()); setPinError('') }}
                                  onKeyDown={e => { if (e.key === 'Enter') savePin(c.id); if (e.key === 'Escape') { setEditingPinId(null); setPinDraft('') } }}
                                  maxLength={8}
                                  autoFocus
                                  placeholder="PIN"
                                  style={{
                                    flex: 1, border: pinError ? '1px solid #fecaca' : '1px solid #e2e8f0',
                                    borderRadius: 6, padding: '3px 7px', fontSize: 11, fontWeight: 700,
                                    letterSpacing: 2, fontFamily: 'DM Mono, monospace', outline: 'none', color: '#0032a0',
                                  }}
                                />
                                <button onClick={() => { setPinDraft(generatePin()); setPinError('') }}
                                  style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', background: 'white', color: '#64748b', whiteSpace: 'nowrap' }}>
                                  ↺ Generar
                                </button>
                                <button onClick={() => savePin(c.id)} disabled={pinSaving}
                                  style={{ fontSize: 10, padding: '3px 8px', border: 'none', borderRadius: 5, cursor: 'pointer', background: '#0032a0', color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {pinSaving ? '…' : 'Guardar'}
                                </button>
                                <button onClick={() => { setEditingPinId(null); setPinDraft(''); setPinError('') }}
                                  style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', background: 'white', color: '#94a3b8' }}>
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                                {c.login_pin ? (
                                  <>
                                    <span style={{
                                      fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 11,
                                      letterSpacing: 2, color: '#0433FF', background: 'rgba(4,51,255,.07)',
                                      padding: '2px 7px', borderRadius: 5,
                                    }}>{c.login_pin}</span>
                                    <button onClick={() => copyPin(c.login_pin, c.id)}
                                      style={{ fontSize: 10, padding: '2px 5px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'white', color: copiedId === c.id ? '#0cb882' : '#94a3b8' }}>
                                      {copiedId === c.id ? '✓' : '⎘'}
                                    </button>
                                    <button onClick={() => { setEditingPinId(c.id); setPinDraft(c.login_pin ?? ''); setPinError('') }}
                                      style={{ fontSize: 10, padding: '2px 5px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#64748b' }}>
                                      ✎
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => { setEditingPinId(c.id); setPinDraft(generatePin()); setPinError('') }}
                                    style={{ fontSize: 10, padding: '2px 8px', border: '1px dashed #e2e8f0', borderRadius: 5, cursor: 'pointer', background: 'white', color: '#94a3b8' }}>
                                    + Asignar PIN
                                  </button>
                                )}
                              </div>
                            )}
                            {editingPinId === c.id && pinError && (
                              <p style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{pinError}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
