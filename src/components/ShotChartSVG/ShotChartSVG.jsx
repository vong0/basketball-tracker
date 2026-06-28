import { useState, useMemo } from 'react';
import { zoneFromXY } from '../../lib/statsCore.js';
import styles from './ShotChartSVG.module.css';

// shot_x/shot_y (0–100) → SVG viewBox (500×470)
const shotXToSvg = x => (x / 100) * 480 + 10
const shotYToSvg = y => (y / 100) * 450 + 10

export default function ShotChartSVG({ shots = [], showList = true }) {
  const [halfFilter, setHalfFilter] = useState('All')
  const [regionFilter, setRegionFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedIdx, setSelectedIdx] = useState(null)

  const zones = useMemo(() => ['All', ...[...new Set(shots.map(s => zoneFromXY(s.shot_x, s.shot_y).zone))]], [shots])
  const types = useMemo(() => ['All', ...[...new Set(shots.map(s => s.shot_type).filter(Boolean))]], [shots])

  const filtered = useMemo(() => {
    setSelectedIdx(null)
    return shots.filter(s => {
      if (halfFilter !== 'All' && s.half !== halfFilter) return false
      if (regionFilter !== 'All' && zoneFromXY(s.shot_x, s.shot_y).zone !== regionFilter) return false
      if (typeFilter !== 'All' && s.shot_type !== typeFilter) return false
      return true
    })
  }, [shots, halfFilter, regionFilter, typeFilter])

  const makes = filtered.filter(s => s.result === 'make').length
  const misses = filtered.length - makes

  return (
    <div className={styles.wrap}>
      {showList && (
        <div className={styles.filters}>
          <FilterSelect label="Half" options={['All', '1H', '2H']} value={halfFilter} onChange={setHalfFilter} />
          <FilterSelect label="Zone" options={zones} value={regionFilter} onChange={setRegionFilter} />
          <FilterSelect label="Type" options={types} value={typeFilter} onChange={setTypeFilter} />
          <span className={styles.summary}>
            <span className={styles.summaryMake}>{makes}M</span>
            <span className={styles.summarySep}>/</span>
            <span className={styles.summaryMiss}>{misses}X</span>
            {filtered.length > 0 && (
              <span className={styles.summaryPct}> · {Math.round(makes / filtered.length * 100)}%</span>
            )}
          </span>
        </div>
      )}

      <div className={styles.chartRow}>
        <div className={styles.courtWrap}>
          <svg className={styles.court} viewBox="0 0 500 470" xmlns="http://www.w3.org/2000/svg">
            {/* Court background */}
            <rect x="0" y="0" width="500" height="470" fill="#fdf8f0"/>

            <g fill="none" stroke="#1a1a1a" strokeLinecap="round">
              {/* Outer boundary */}
              <rect x="10" y="10" width="480" height="450" strokeWidth="2"/>

              {/* Key / paint */}
              <rect x="170" y="10" width="160" height="185" strokeWidth="1.5"/>

              {/* Free throw circle */}
              <circle cx="250" cy="195" r="60" strokeWidth="1.5"/>

              {/* Backboard */}
              <line x1="228" y1="46" x2="272" y2="46" strokeWidth="3"/>

              {/* Basket ring */}
              <circle cx="250" cy="58" r="10" strokeWidth="2"/>

              {/* Restricted area arc */}
              <path d="M 210 10 A 40 40 0 0 1 290 10" strokeWidth="1.5"/>

              {/* Three-point line: corners + arc */}
              <path d="M 30 10 L 30 140 A 238 238 0 1 1 470 140 L 470 10" strokeWidth="1.5"/>

              {/* Half-court line */}
              <line x1="10" y1="460" x2="490" y2="460" strokeWidth="1.5"/>
            </g>

            {/* Shot dots */}
            {filtered.map((s, i) => (
              <circle
                key={s.shot_id ?? i}
                cx={shotXToSvg(s.shot_x)}
                cy={shotYToSvg(s.shot_y)}
                r={selectedIdx === i ? 8 : 6}
                fill={s.result === 'make' ? '#4ade80' : '#f87171'}
                opacity={selectedIdx === null || selectedIdx === i ? 0.85 : 0.35}
                stroke={selectedIdx === i ? '#2563eb' : 'none'}
                strokeWidth={selectedIdx === i ? 2 : 0}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
              />
            ))}
          </svg>
        </div>

        {showList && filtered.length > 0 && (
          <div className={styles.shotListWrap}>
            <div className={styles.shotList}>
              {filtered.map((s, i) => {
                const pts = s.points ?? (s.result === 'make' ? 2 : 0)
                const zone = zoneFromXY(s.shot_x, s.shot_y).zone
                const isSelected = selectedIdx === i
                return (
                  <div
                    key={s.shot_id ?? i}
                    className={`${styles.shotRow} ${isSelected ? styles.shotRowSelected : ''}`}
                    onClick={() => setSelectedIdx(isSelected ? null : i)}
                  >
                    <span className={styles.shotNum}>{i + 1}</span>
                    <div className={styles.shotMain}>
                      <span className={`${styles.shotPill} ${s.result === 'make' ? styles.pillMake : styles.pillMiss}`}>
                        {s.result === 'make' ? 'Make' : 'Miss'}
                      </span>
                      {' · '}
                      <span className={styles.shotPts}>{pts}pt</span>
                      <div className={styles.shotSub}>{zone}{s.shot_type ? ` · ${s.shot_type}` : ''}{s.player ? ` · ${s.player}` : ''}</div>
                    </div>
                    <span className={styles.shotMeta}>{s.half ?? ''}</span>
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
