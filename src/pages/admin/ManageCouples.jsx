import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase.js'
import AdminGuard from '../../components/AdminGuard.jsx'
import { DUMMY_COUPLES } from '../../lib/dummy.js'

const DIVISIONS   = ['diamant', 'or', 'plata']
const REQUIRED    = ['player_1_name', 'player_2_name', 'division', 'group_code']
const CSV_HEADERS = ['player_1_name', 'player_2_name', 'division', 'group_code', 'centre', 'department']

// Derive "Apellido1 / Apellido2" from two full names
function autoTeamName(p1, p2) {
  const surname = name => name.trim().split(' ').slice(1).join(' ') || name.trim()
  return `${surname(p1)} / ${surname(p2)}`
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
function downloadTemplate(source) {
  const rows = source.map(c => ({
    player_1_name: c.player_1_name,
    player_2_name: c.player_2_name,
    division:      c.division,
    group_code:    c.group_code,
    centre:        c.centre ?? '',
    department:    c.department ?? '',
  }))
  const csv = Papa.unparse({ fields: CSV_HEADERS, data: rows })
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

function ManageCouplesContent() {
  const [couples, setCouples]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('list')  // 'list' | 'import'

  // Import state
  const [preview, setPreview]       = useState(null)   // parsed rows
  const [parseErrors, setParseErrors] = useState([])
  const [importing, setImporting]   = useState(false)
  const [importResult, setImportResult] = useState(null)
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
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: ({ data }) => {
        const errors = data.flatMap((row, i) => validateRow(row, i))
        setParseErrors(errors)
        if (!errors.length) {
          setPreview(data.map(row => ({
            player_1_name: row.player_1_name.trim(),
            player_2_name: row.player_2_name.trim(),
            division:      row.division.toLowerCase().trim(),
            group_code:    row.group_code.trim().toUpperCase(),
            centre:        row.centre?.trim() || null,
            department:    row.department?.trim() || null,
            team_name:     autoTeamName(row.player_1_name, row.player_2_name),
          })))
        } else {
          setPreview(null)
        }
      },
    })
  }

  // ── Supabase import ─────────────────────────────────────────────────────────
  async function handleImport() {
    if (!preview?.length) return
    setImporting(true)
    setImportResult(null)

    const { error } = await supabase.from('couples').insert(preview)

    setImporting(false)
    if (error) {
      setImportResult({ ok: false, message: error.message })
    } else {
      setImportResult({ ok: true, message: `${preview.length} parejas importadas correctamente.` })
      setCouples(prev => [...prev, ...preview])
      setPreview(null)
      setParseErrors([])
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const byDivision = div => couples.filter(c => c.division === div)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Parejas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate(couples.length ? couples : DUMMY_COUPLES)}
            className="text-sm border border-gray-200 text-text-secondary px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
          >
            ↓ Descargar plantilla CSV
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
              Las columnas requeridas son: <code className="bg-gray-100 px-1 rounded">player_1_name</code>, <code className="bg-gray-100 px-1 rounded">player_2_name</code>, <code className="bg-gray-100 px-1 rounded">division</code>, <code className="bg-gray-100 px-1 rounded">group_code</code>.
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
                      {['Jugador 1', 'Jugador 2', 'División', 'Grupo', 'Nombre equipo', 'Centre', 'Dpto.'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2">{row.player_1_name}</td>
                        <td className="px-3 py-2">{row.player_2_name}</td>
                        <td className="px-3 py-2 capitalize">{row.division}</td>
                        <td className="px-3 py-2">{row.group_code}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.team_name}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.centre ?? '—'}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.department ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {importing ? 'Importando…' : `Confirmar importación (${preview.length} parejas)`}
              </button>
            </div>
          )}

          {importResult && (
            <div className={`rounded-lg p-3 text-sm font-medium ${importResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {importResult.message}
            </div>
          )}
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
