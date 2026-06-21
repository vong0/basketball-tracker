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

  const zones = useMemo(() => ['All', ...[...new Set(shots.map(s => zoneFromXY(s.shot_x, s.shot_y).zone))]], [shots])
  const types = useMemo(() => ['All', ...[...new Set(shots.map(s => s.shot_type).filter(Boolean))]], [shots])

  const filtered = useMemo(() => shots.filter(s => {
    if (halfFilter !== 'All' && s.half !== halfFilter) return false
    if (regionFilter !== 'All' && zoneFromXY(s.shot_x, s.shot_y).zone !== regionFilter) return false
    if (typeFilter !== 'All' && s.shot_type !== typeFilter) return false
    return true
  }), [shots, halfFilter, regionFilter, typeFilter])

  const makes = filtered.filter(s => s.result === 'make').length
  const misses = filtered.length - makes

  return (
    <div className={styles.wrap}>
      {showList && (
        <div className={styles.filters}>
          <FilterGroup label="Half" options={['All', '1H', '2H']} value={halfFilter} onChange={setHalfFilter} />
          <FilterGroup label="Region" options={zones} value={regionFilter} onChange={setRegionFilter} />
          <FilterGroup label="Type" options={types} value={typeFilter} onChange={setTypeFilter} />
        </div>
      )}

      <div className={styles.courtWrap}>
        <svg className={styles.court} viewBox="0 0 500 470" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="500" height="470" fill="#f9f5ec"/>
          <g fill="none" stroke="#16140f" strokeWidth="2">
            <rect x="10" y="10" width="480" height="450"/>
            <rect x="170" y="10" width="160" height="190"/>
            <circle cx="250" cy="200" r="60"/>
            <path d="M 210 10 Q 210 70 250 70 Q 290 70 290 10"/>
            <path d="M 50 10 L 50 140 Q 50 320 250 320 Q 450 320 450 140 L 450 10"/>
            <line x1="10" y1="460" x2="490" y2="460"/>
          </g>
          {filtered.map((s, i) => (
            <circle
              key={s.shot_id ?? i}
              cx={shotXToSvg(s.shot_x)}
              cy={shotYToSvg(s.shot_y)}
              r={6}
              fill={s.result === 'make' ? '#6fbb84' : '#d97366'}
              opacity={0.8}
            />
          ))}
        </svg>
      </div>

      <div className={styles.summary}>
        <span className={styles.summaryMake}>{makes} makes</span>
        <span className={styles.summarySep}>·</span>
        <span className={styles.summaryMiss}>{misses} misses</span>
        <span className={styles.summarySep}>·</span>
        <span className={styles.summaryTotal}>{filtered.length} total</span>
        {filtered.length > 0 && (
          <>
            <span className={styles.summarySep}>·</span>
            <span className={styles.summaryPct}>{Math.round(makes / filtered.length * 100)}% FG</span>
          </>
        )}
      </div>

      {showList && filtered.length > 0 && (
        <div className={styles.shotList}>
          {filtered.map((s, i) => (
            <div key={s.shot_id ?? i} className={`${styles.shotRow} ${s.result === 'make' ? styles.shotMake : styles.shotMiss}`}>
              <span className={styles.shotNum}>#{i + 1}</span>
              <span className={`${styles.shotPill} ${s.result === 'make' ? styles.pillMake : styles.pillMiss}`}>
                {s.result === 'make' ? 'Make' : 'Miss'}
              </span>
              <span className={styles.shotPts}>{s.points}pt</span>
              <span className={styles.shotZone}>{zoneFromXY(s.shot_x, s.shot_y).zone}</span>
              {s.shot_type && <span className={styles.shotType}>{s.shot_type}</span>}
              {s.player && <span className={styles.shotPlayer}>{s.player}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}:</span>
      {options.map(opt => (
        <button
          key={opt}
          className={opt === value ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
