const SLOTS = [
  { s: 1, t: '9:30'  },
  { s: 2, t: '10:00' },
  { s: 3, t: '10:30' },
  { s: 4, t: '11:00' },
  { s: 5, t: '11:30' },
  { s: 6, t: '12:00' },
  { s: 7, t: '12:30', n: 'QF'    },
  { s: 8, t: '13:00', n: 'SF'    },
  { s: 9, t: '13:30', n: 'FINAL' },
]

function currentSlot() {
  const now  = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  if (mins < 570) return 0   // before 9:30
  if (mins < 600) return 1   // 9:30–10:00
  if (mins < 630) return 2   // 10:00–10:30
  if (mins < 660) return 3   // 10:30–11:00
  if (mins < 690) return 4   // 11:00–11:30
  if (mins < 720) return 5   // 11:30–12:00
  if (mins < 750) return 6   // 12:00–12:30
  if (mins < 780) return 7   // 12:30–13:00
  if (mins < 810) return 8   // 13:00–13:30
  return 9                   // after 13:30
}

export default function Timeline() {
  const cur = currentSlot()

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 1px 4px rgba(0,29,114,.05)',
      marginBottom: 14,
      overflowX: 'auto',
    }}>
      <div style={{ display: 'flex', gap: 0, minWidth: 560, alignItems: 'flex-start' }}>
        {SLOTS.map(s => {
          const active = s.s === cur
          const done   = s.s < cur
          return (
            <div key={s.s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 3,
                borderRadius: 2,
                marginBottom: 5,
                background: done
                  ? '#11efb5'
                  : active
                    ? 'linear-gradient(90deg,#11efb5,#0433FF)'
                    : '#eef2f7',
              }} />
              <div style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? '#001d72' : done ? '#0cb882' : '#b0b8c8',
              }}>
                {s.t}
              </div>
              {s.n && (
                <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 1 }}>{s.n}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
