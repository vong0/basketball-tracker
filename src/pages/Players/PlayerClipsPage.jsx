import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Banner from '../../components/Banner/Banner'
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer'
import Playlist from '../../components/Playlist/Playlist'
import { PLAYLISTS, presetFilter, filterClips, buildFilter } from '../../lib/clipsCore'
import { parseLabel, segmentMatchesFilter } from '../../lib/parseLabel'
import { getPlayer, getClips } from '../../lib/backend.js'
import styles from './PlayerClipsPage.module.css'

export default function PlayerClipsPage({ playerId, preset: initialPreset, isMobile }) {
  const [player, setPlayer] = useState(null)
  const [clips, setClips] = useState(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [filterChoice, setFilterChoice] = useState({ player: null, preset: 'all' })
  const videoRef = useRef(null)

  const activePreset = useMemo(
    () => PLAYLISTS.find(pl => pl.key === initialPreset) ?? PLAYLISTS[0],
    [initialPreset]
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlayer(playerId), getClips({})])
      .then(([p, { clips: allClips }]) => {
        if (cancelled) return
        setPlayer(p)
        const filtered = filterClips(allClips, presetFilter(activePreset, p.clipName))
        setClips(filtered)
      })
      .catch(e => console.error('PlayerClipsPage load error:', e))
    return () => { cancelled = true }
  }, [playerId, initialPreset]) // eslint-disable-line react-hooks/exhaustive-deps

  const segments = clips ?? []
  const parsedSegments = useMemo(
    () => segments.map(s => parseLabel(s.name || '')),
    [segments]
  )

  const filter = useMemo(() => buildFilter(filterChoice), [filterChoice])

  const visibleIndices = useMemo(() => {
    if (!filter) return segments.map((_, i) => i)
    const out = []
    for (let i = 0; i < segments.length; i++) {
      if (segmentMatchesFilter(parsedSegments[i], filter)) out.push(i)
    }
    return out
  }, [segments, parsedSegments, filter])

  const prevFilterRef = useRef(filter)
  useEffect(() => {
    if (prevFilterRef.current === filter) return
    prevFilterRef.current = filter
    setActiveIdx(visibleIndices.length > 0 ? visibleIndices[0] : -1)
  }, [filter, visibleIndices])

  const [videoCollapsed, setVideoCollapsed] = useState(false)
  const toggleVideoCollapsed = useCallback(() => setVideoCollapsed(v => !v), [])

  if (!clips) {
    // All hooks declared above — safe to return early here
    return (
      <div className={styles.app}>
        <Banner isMobile={isMobile} />
      </div>
    )
  }

  return (
    <div className={styles.app}>
      {!isFullscreen && <Banner isMobile={isMobile} />}
      <div className={`${styles.main} ${videoCollapsed ? styles.videoCollapsed : ''}`}>
        <div className={styles.videoWrap}>
          <VideoPlayer
            ref={videoRef}
            key={isMobile ? 'mobile' : 'desktop'}
            cutSegments={segments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            visibleIndices={visibleIndices}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
            multiVideo
          />
        </div>
        {!isFullscreen && (
          <Playlist
            title={activePreset.label + (player ? ' — ' + player.name : '')}
            cutSegments={segments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            visibleIndices={visibleIndices}
            filterChoice={filterChoice}
            setFilterChoice={setFilterChoice}
            isMobile={isMobile}
            onFilterOpen={() => videoRef.current?.pauseAndRemember?.()}
            onFilterClose={() => videoRef.current?.resumeIfWasPlaying?.()}
            videoCollapsed={videoCollapsed}
            onToggleVideoCollapsed={toggleVideoCollapsed}
            multiGame
          />
        )}
      </div>
    </div>
  )
}
