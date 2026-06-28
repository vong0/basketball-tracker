import { useState, useMemo, useRef } from 'react';
import { zoneFromXY } from '../../lib/statsCore.js';
import styles from './ShotChartSVG.module.css';

// FIBA coordinate system: shot_x/shot_y (0–100) → SVG viewBox (-0.25 -0.25 15.5 14.5)
const toSvgX = x => (x / 100) * 15
const toSvgY = y => (y / 100) * 14

function shotKey(s) {
  return s.shot_id ?? `${s.game_id}|${s.half}|${s.player}|${s.shot_x}|${s.shot_y}|${s.result}`
}

function MakeMarker({ cx, cy }) {
  return <circle cx={cx} cy={cy} r="0.15" fill="#2f7d4f" stroke="#111" strokeWidth="0.035" />
}

function MissMarker({ cx, cy }) {
  return (
    <>
      <line x1={cx - 0.15} y1={cy - 0.15} x2={cx + 0.15} y2={cy + 0.15}
        stroke="#b8392b" strokeWidth="0.055" strokeLinecap="round" />
      <line x1={cx + 0.15} y1={cy - 0.15} x2={cx - 0.15} y2={cy + 0.15}
        stroke="#b8392b" strokeWidth="0.055" strokeLinecap="round" />
    </>
  )
}

function ShotPopup({ x, y, shot }) {
  const popW = 4.4
  const popH = 1.1
  let px = x - popW / 2
  let py = y - 1.4 - popH
  if (px < -0.2) px = -0.2
  if (px + popW > 15.2) px = 15.2 - popW
  if (py < -0.2) py = y + 0.45

  const zone = (shot.shot_x != null && shot.shot_y != null)
    ? zoneFromXY(shot.shot_x, shot.shot_y).zone
    : ''
  const pts = shot.points ?? 2
  const line1 = `${shot.player ?? '—'} · ${shot.result} · ${pts}PT`
  const line2parts = [zone, shot.shot_type, shot.contest].filter(Boolean)
  const line2 = line2parts.join(' · ')

  return (
    <g>
      <rect
        x={px} y={py} width={popW} height={popH} rx="0.12"
        fill="#111827" opacity="0.97"
        style={{ filter: 'drop-shadow(0 0.05px 0.08px rgba(0,0,0,0.35))' }}
      />
      <text x={px + popW / 2} y={py + 0.38} textAnchor="middle"
        fontSize="0.30" fill="#fff" fontWeight="900">{line1}</text>
      <text x={px + popW / 2} y={py + 0.74} textAnchor="middle"
        fontSize="0.245" fill="#e5e7eb" fontWeight="700">{line2}</text>
    </g>
  )
}

export default function ShotChartSVG({ shots = [], showList = true, showPlayerFilter = true }) {
  const [halfFilter,   setHalfFilter]   = useState('All')
  const [regionFilter, setRegionFilter] = useState('All')
  const [typeFilter,   setTypeFilter]   = useState('All')
  const [playerFilter, setPlayerFilter] = useState('All')
  const [selectedId,   setSelectedId]   = useState(null)
  const listRef = useRef(null)

  const zones   = useMemo(() => ['All', ...[...new Set(shots.map(s => s.shot_x != null ? zoneFromXY(s.shot_x, s.shot_y).zone : null).filter(Boolean))]], [shots])
  const types   = useMemo(() => ['All', ...[...new Set(shots.map(s => s.shot_type).filter(Boolean))]], [shots])
  const players = useMemo(() => ['All', ...[...new Set(shots.map(s => s.player).filter(Boolean))]], [shots])

  const filtered = useMemo(() => {
    setSelectedId(null)
    return shots.filter(s => {
      if (halfFilter   !== 'All' && s.half      !== halfFilter)   return false
      if (regionFilter !== 'All' && s.shot_x != null && zoneFromXY(s.shot_x, s.shot_y).zone !== regionFilter) return false
      if (typeFilter   !== 'All' && s.shot_type !== typeFilter)   return false
      if (playerFilter !== 'All' && s.player    !== playerFilter) return false
      return true
    })
  }, [shots, halfFilter, regionFilter, typeFilter, playerFilter])

  const makes = filtered.filter(s => s.result === 'make').length
  const misses = filtered.length - makes

  const selectedShot = selectedId !== null
    ? filtered.find(s => shotKey(s) === selectedId) ?? null
    : null

  function handleShotClick(s, e) {
    e.stopPropagation()
    const key = shotKey(s)
    const newId = selectedId === key ? null : key
    setSelectedId(newId)
    if (newId !== null) {
      setTimeout(() => {
        const row = listRef.current?.querySelector(`[data-shotid="${key}"]`)
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }, 0)
    }
  }

  function handleListClick(s) {
    const key = shotKey(s)
    setSelectedId(selectedId === key ? null : key)
  }

  // Render selected shot last so it appears on top
  const ordered = selectedShot
    ? [...filtered.filter(s => shotKey(s) !== selectedId), selectedShot]
    : filtered

  const showPlayer = showPlayerFilter && players.length > 2

  return (
    <div className={styles.wrap}>
      <div className={styles.filters}>
        <FilterSelect label="Half"   options={['All', '1H', '2H']} value={halfFilter}   onChange={v => { setHalfFilter(v);   setSelectedId(null) }} />
        <FilterSelect label="Region" options={zones}                value={regionFilter} onChange={v => { setRegionFilter(v); setSelectedId(null) }} />
        <FilterSelect label="Type"   options={types}                value={typeFilter}   onChange={v => { setTypeFilter(v);   setSelectedId(null) }} />
        {showPlayer && (
          <FilterSelect label="Player" options={players} value={playerFilter} onChange={v => { setPlayerFilter(v); setSelectedId(null) }} />
        )}
        <span className={styles.summary}>
          <span className={styles.summaryMake}>{makes} Made</span>
          <span className={styles.summarySep}> / </span>
          <span className={styles.summaryMiss}>{misses} Missed</span>
          {filtered.length > 0 && (
            <span className={styles.summaryPct}> ({Math.round(makes / filtered.length * 100)}%)</span>
          )}
        </span>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendDot} style={{ background: '#2f7d4f' }} />
        <span className={styles.legendText}>Make</span>
        <span className={styles.legendX} style={{ color: '#b8392b' }}>✕</span>
        <span className={styles.legendText}>Miss</span>
        <span className={styles.legendHint}>Click a shot or row for details · click court to clear</span>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.courtWrap}>
          <svg
            className={styles.court}
            viewBox="-0.25 -0.25 15.5 14.5"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => setSelectedId(null)}
          >
            {/* Court */}
            <rect x="0" y="0" width="15" height="14" fill="#fff" />
            <path d="M0 0H15V14H0Z" fill="none" stroke="#111" strokeWidth="0.08" />
            <path d="M5.05 0V5.8H9.95V0" fill="none" stroke="#111" strokeWidth="0.08" />
            <path d="M0 4.9H15" fill="none" stroke="#111" strokeWidth="0.035" opacity=".25" />
            <circle cx="7.5" cy="1.575" r="0.225" fill="none" stroke="#111" strokeWidth="0.08" />
            <path d="M6.7 1.2H8.3" stroke="#111" strokeWidth="0.08" />
            <path d="M0.9 0V2.99M14.1 0V2.99" stroke="#111" strokeWidth="0.08" />
            <path d="M0.9 2.99A6.75 6.75 0 0 0 14.1 2.99" fill="none" stroke="#111" strokeWidth="0.08" />

            {/* Shot markers */}
            {ordered.map(s => {
              const key = shotKey(s)
              const isSelected = key === selectedId
              const isDimmed = selectedId !== null && !isSelected
              const cx = toSvgX(s.shot_x)
              const cy = toSvgY(s.shot_y)
              return (
                <g
                  key={key}
                  style={{ cursor: 'pointer', opacity: isDimmed ? 0.25 : 1 }}
                  onClick={e => handleShotClick(s, e)}
                >
                  {isSelected && (
                    <>
                      <circle cx={cx} cy={cy} r="0.37" fill="#2563eb" fillOpacity="0.16" />
                      <circle cx={cx} cy={cy} r="0.38" fill="none" stroke="#111" strokeWidth="0.035" strokeOpacity="0.75" />
                      <circle cx={cx} cy={cy} r="0.30" fill="none" stroke="#2563eb" strokeWidth="0.135" />
                    </>
                  )}
                  {s.result === 'make'
                    ? <MakeMarker cx={cx} cy={cy} />
                    : <MissMarker cx={cx} cy={cy} />
                  }
                </g>
              )
            })}

            {/* In-SVG popup for selected shot */}
            {selectedShot && (
              <ShotPopup
                x={toSvgX(selectedShot.shot_x)}
                y={toSvgY(selectedShot.shot_y)}
                shot={selectedShot}
              />
            )}
          </svg>
        </div>

        {showList && (
          <div className={styles.shotListWrap}>
            <div className={styles.listHeader}>Filtered Shot List</div>
            <div className={styles.shotList} ref={listRef}>
              {filtered.length === 0 && (
                <div className={styles.emptyList}>No shots match the filters</div>
              )}
              {filtered.map((s, i) => {
                const key = shotKey(s)
                const isSelected = key === selectedId
                const zone = s.shot_x != null ? zoneFromXY(s.shot_x, s.shot_y).zone : '—'
                const pts = s.points ?? 2
                const subParts = [zone, s.shot_type, s.contest].filter(Boolean)
                if (s.screen_assist_by) subParts.push(`screen ${s.screen_assist_by}`)
                return (
                  <div
                    key={key}
                    data-shotid={key}
                    className={`${styles.shotRow} ${isSelected ? styles.shotRowSelected : ''}`}
                    onClick={() => handleListClick(s)}
                  >
                    <span className={styles.shotNum}>{i + 1}</span>
                    <div>
                      <div className={styles.shotMain}>
                        {s.player ?? '—'} · {s.result} · {pts}PT
                      </div>
                      <div className={styles.shotSub}>{subParts.join(' · ')}</div>
                    </div>
                    <span className={`${styles.shotPill} ${s.result === 'make' ? styles.pillMake : styles.pillMiss}`}>
                      {s.result}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      <select
        className={styles.filterSelect}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}
