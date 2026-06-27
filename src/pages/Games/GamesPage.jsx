import { useState, useEffect } from 'react';
import Banner from '../../components/Banner/Banner';
import GameCard from './GameCard';
import { getSeasons, getGames } from '../../lib/backend.js';
import styles from './GamesPage.module.css';

export default function GamesPage() {
  const [seasons, setSeasons] = useState(null)
  const [games, setGames] = useState(null)
  const [seasonFilter, setSeasonFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    getSeasons().then(setSeasons)
  }, [])

  useEffect(() => {
    setGames(null)
    getGames({ season: seasonFilter || undefined, result: resultFilter || undefined })
      .then(setGames)
  }, [seasonFilter, resultFilter])

  const hasFilter = seasonFilter || resultFilter || searchQuery

  const filteredGames = games
    ? games.filter(g => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          g.opponentName?.toLowerCase().includes(q) ||
          g.game?.toLowerCase().includes(q)
        )
      })
    : null

  function clearAll() {
    setSeasonFilter('')
    setResultFilter('')
    setSearchQuery('')
    setSheetOpen(false)
  }

  const resultCount = filteredGames?.length ?? 0

  return (
    <div className={styles.page}>
      <Banner />

      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search teams…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Desktop selects */}
          <select
            className={styles.filterSelect}
            value={seasonFilter}
            onChange={e => setSeasonFilter(e.target.value)}
          >
            <option value="">All Seasons</option>
            {(seasons ?? []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value)}
          >
            <option value="">All Results</option>
            <option value="W">Wins</option>
            <option value="L">Losses</option>
          </select>

          {hasFilter && (
            <button className={styles.filterClear} onClick={clearAll}>
              Clear
            </button>
          )}

          {/* Mobile filter pill */}
          <button
            className={`${styles.filterPill} ${(seasonFilter || resultFilter) ? styles.filterPillActive : ''}`}
            onClick={() => setSheetOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters{(seasonFilter || resultFilter) ? ' ·' : ''}
          </button>
        </div>

        {filteredGames && (
          <div className={styles.filterInner}>
            <span className={styles.resultCount}>
              {resultCount} {resultCount === 1 ? 'game' : 'games'} found
            </span>
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <>
          <div className={styles.filterSheetBackdrop} onClick={() => setSheetOpen(false)} />
          <div className={styles.filterSheet}>
            <div className={styles.filterSheetHeader}>
              <span className={styles.filterSheetTitle}>Filters</span>
              {hasFilter && (
                <button className={styles.filterSheetClearLink} onClick={clearAll}>Clear all</button>
              )}
            </div>
            <div className={styles.filterSheetItem}>
              <select
                className={styles.filterSheetSelect}
                value={seasonFilter}
                onChange={e => setSeasonFilter(e.target.value)}
              >
                <option value="">All Seasons</option>
                {(seasons ?? []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterSheetItem}>
              <select
                className={styles.filterSheetSelect}
                value={resultFilter}
                onChange={e => setResultFilter(e.target.value)}
              >
                <option value="">All Results</option>
                <option value="W">Wins</option>
                <option value="L">Losses</option>
              </select>
            </div>
            <div className={styles.filterSheetActions}>
              <button className={styles.filterSheetDone} onClick={() => setSheetOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </>
      )}

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {!filteredGames ? (
            <p className={styles.loading}>Loading…</p>
          ) : (
            <div className={styles.grid}>
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
