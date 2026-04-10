import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import AdminGuard from '../../components/AdminGuard.jsx'
import { generateBracket, matchLabel, ROUND_LABELS } from '../../lib/bracketEngine.js'
import { getDummyStandings } from '../../lib/dummy.js'
import { DIVISION_CONFIG, DIVISIONS } from '../../lib/divisions.js'
import Spinner from '../../components/Spinner.jsx'
import { useI18n } from '../../i18n/index.jsx'

const GROUP_CODES = {
  diamant: ['G1', 'G2', 'G3'],
  or:      ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
  plata:   ['G1', 'G2', 'G3'],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Fetch group standings from Supabase; fall back to dummy if empty
async function fetchStandings(division) {
  const groups = GROUP_CODES[division]
  const standingsByGroup = {}

  await Promise.all(groups.map(async gc => {
    const { data } = await supabase
      .from('group_standings')
      .select('couple_id, points, game_differential, rank, couple:couple_id(team_name)')
      .eq('division', division)
      .eq('group_code', gc)
      .order('rank', { nullsFirst: false })
      .order('points', { ascending: false })
      .order('game_differential', { ascending: false })

    standingsByGroup[gc] = data?.length
      ? data
      : getDummyStandings(division, gc)
  }))

  return standingsByGroup
}

// Check whether all group matches for a division are confirmed
async function checkGroupsComplete(division) {
  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('division', division)
    .eq('phase', 'group')
    .neq('status', 'confirmed')

  return count === 0
}

// Check if knockout matches already exist for a division
async function knockoutExists(division) {
  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('division', division)
    .eq('phase', 'knockout')

  return (count ?? 0) > 0
}

// Build a coupleId → couple lookup map from standings
function buildCoupleMap(standingsByGroup) {
  const map = {}
  for (const rows of Object.values(standingsByGroup)) {
    for (const row of rows) {
      if (row.couple_id) {
        map[row.couple_id] = row.couple ?? { team_name: row.couple_id.slice(0, 8) }
      }
    }
  }
  return map
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ManageBrackets() {
  return (
    <AdminGuard>
      <ManageBracketsContent />
    </AdminGuard>
  )
}

function ManageBracketsContent() {
  const { t } = useI18n()
  const [divisionState, setDivisionState] = useState({
    diamant: { loading: true, complete: false, exists: false },
    or:      { loading: true, complete: false, exists: false },
    plata:   { loading: true, complete: false, exists: false },
  })
  const [active, setActive] = useState(null)  // division being previewed/generated

  useEffect(() => {
    DIVISIONS.forEach(async div => {
      const [complete, exists] = await Promise.all([
        checkGroupsComplete(div),
        knockoutExists(div),
      ])
      setDivisionState(s => ({ ...s, [div]: { loading: false, complete, exists } }))
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('brackets.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('brackets.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {DIVISIONS.map(div => (
          <DivisionCard
            key={div}
            division={div}
            state={divisionState[div]}
            expanded={active === div}
            onToggle={() => setActive(active === div ? null : div)}
            onGenerated={() => setDivisionState(s => ({
              ...s, [div]: { ...s[div], exists: true }
            }))}
            onCleared={() => setDivisionState(s => ({
              ...s, [div]: { ...s[div], exists: false }
            }))}
          />
        ))}
      </div>
    </div>
  )
}

// ── Per-division card ─────────────────────────────────────────────────────────

function DivisionCard({ division, state, expanded, onToggle, onGenerated, onCleared }) {
  const { t } = useI18n()
  const [preview, setPreview]       = useState(null)   // { matches, coupleMap }
  const [saving, setSaving]         = useState(false)
  const [clearing, setClearing]     = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [error, setError]           = useState(null)

  const { icon, fullLabel: name, gradient } = DIVISION_CONFIG[division]

  const handleGenerate = useCallback(async () => {
    setError(null)
    try {
      const standingsByGroup = await fetchStandings(division)
      const matches  = generateBracket(division, standingsByGroup)
      const coupleMap = buildCoupleMap(standingsByGroup)
      setPreview({ matches, coupleMap })
    } catch (e) {
      setError(e.message)
    }
  }, [division])

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    setError(null)

    // Strip fields Supabase doesn't need at insert (id is a PK, keep it for linking)
    const rows = preview.matches.map(m => ({
      id:              m.id,
      division:        m.division,
      phase:           m.phase,
      round:           m.round,
      position:        m.position,
      couple_a_id:     m.couple_a_id,
      couple_b_id:     m.couple_b_id,
      status:          m.status,
      next_match_id:   m.next_match_id,
      next_match_slot: m.next_match_slot,
    }))

    const { error: dbError } = await supabase.from('matches').insert(rows)
    setSaving(false)

    if (dbError) {
      setError(dbError.message)
    } else {
      setPreview(null)
      onGenerated()
    }
  }

  async function handleClear() {
    setClearing(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('matches')
      .delete()
      .eq('division', division)
      .eq('phase', 'knockout')

    setClearing(false)
    setConfirmClear(false)

    if (dbError) setError(dbError.message)
    else { setPreview(null); onCleared() }
  }

  const statusBadge = state.loading
    ? { text: null,                              cls: 'bg-gray-100 text-gray-400' }
    : state.exists
      ? { text: t('brackets.status_generated'), cls: 'bg-green-100 text-green-700' }
      : state.complete
        ? { text: t('brackets.status_ready'),   cls: 'bg-accent/20 text-primary' }
        : { text: t('brackets.status_incomplete'), cls: 'bg-yellow-100 text-yellow-700' }

  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-text-primary">{name}</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {GROUP_CODES[division].length} {t('brackets.groups_summary').split('·')[0].trim()} · {GROUP_CODES[division].length * 4} {t('brackets.groups_summary').split('·')[1].trim()}
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusBadge.cls}`}>
          {state.loading ? <Spinner size="sm" className="text-gray-400" /> : statusBadge.text}
        </span>
        <span className="text-text-secondary ml-1">{expanded ? '↑' : '↓'}</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/20">
          {/* Warning when groups not complete (but allow forced generation) */}
          {!state.complete && !state.loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
              {t('brackets.warning_incomplete')}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!state.exists && !preview && (
              <button
                onClick={handleGenerate}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t('brackets.btn_generate')}
              </button>
            )}

            {state.exists && !preview && !confirmClear && (
              <>
                <button
                  onClick={handleGenerate}
                  className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {t('brackets.btn_regenerate')}
                </button>
                <button
                  onClick={() => setConfirmClear(true)}
                  className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  {t('brackets.btn_clear')}
                </button>
              </>
            )}

            {confirmClear && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-red-600 font-medium">
                  ¿{t('brackets.confirm_clear')} {name}?
                </span>
                <button onClick={handleClear} disabled={clearing}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {clearing ? t('brackets.btn_clearing') : t('brackets.btn_confirm')}
                </button>
                <button onClick={() => setConfirmClear(false)}
                  className="border border-gray-200 text-text-secondary px-3 py-1.5 rounded-lg text-sm">
                  {t('brackets.btn_cancel')}
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <BracketPreview matches={preview.matches} coupleMap={preview.coupleMap} />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? t('brackets.btn_saving') : `${t('brackets.btn_save')} (${preview.matches.length})`}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="border border-gray-200 text-text-secondary px-4 py-2.5 rounded-lg text-sm hover:border-gray-300"
                >
                  {t('brackets.btn_discard')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Bracket preview table ─────────────────────────────────────────────────────

function BracketPreview({ matches, coupleMap }) {
  const { t } = useI18n()
  const rounds = [...new Set(matches.map(m => m.round))]
  const ROUND_ORDER = ['quarter', 'semi', 'final', 'third_place', 'consolation']
  rounds.sort((a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b))

  return (
    <div className="space-y-4">
      {rounds.map(round => (
        <div key={round}>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            {ROUND_LABELS[round] ?? round}
          </h3>
          <div className="space-y-1">
            {matches
              .filter(m => m.round === round)
              .sort((a, b) => a.position - b.position)
              .map(m => (
                <div key={m.id}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                  <span className="text-xs text-text-secondary w-5 text-right shrink-0">
                    {m.position}
                  </span>
                  <span className={`flex-1 truncate ${m.couple_a_id ? 'text-text-primary' : 'text-text-secondary italic'}`}>
                    {m.couple_a_id ? coupleMap[m.couple_a_id]?.team_name ?? t('brackets.unknown') : t('brackets.tbd')}
                  </span>
                  <span className="text-text-secondary text-xs shrink-0">vs</span>
                  <span className={`flex-1 truncate text-right ${m.couple_b_id ? 'text-text-primary' : 'text-text-secondary italic'}`}>
                    {m.couple_b_id ? coupleMap[m.couple_b_id]?.team_name ?? t('brackets.unknown') : t('brackets.tbd')}
                  </span>
                  {m.next_match_id && (
                    <span className="text-xs text-accent shrink-0" title="Ganador avanza automáticamente">→</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
