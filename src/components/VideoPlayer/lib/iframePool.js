import { loadYouTubeAPI } from '../../../lib/youtube'
import { YT_IFRAME_WIDTH, YT_IFRAME_HEIGHT } from './constants'

const MAX_POOL_SIZE = 3

// Off-screen portal — iframes live here when not attached to a visible container.
// position:fixed + left:-9999px keeps them in the document (not throttled/suspended)
// without appearing on screen.
let _portal = null
function getPortal() {
  if (_portal) return _portal
  _portal = document.createElement('div')
  Object.assign(_portal.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '1920px',
    height: '1080px',
    pointerEvents: 'none',
    zIndex: '-9999',
  })
  document.body.appendChild(_portal)
  return _portal
}

// slot = { videoId, wrapEl, player, ready, hasPlayedOnce, listeners, lastUsed }
const _slots = new Map()

function _evict() {
  let oldest = null
  for (const slot of _slots.values()) {
    if (!oldest || slot.lastUsed < oldest.lastUsed) oldest = slot
  }
  if (!oldest) return
  try { oldest.player?.destroy() } catch (e) {}
  oldest.wrapEl.remove()
  _slots.delete(oldest.videoId)
}

function _fireListeners(slot, type, data) {
  // Copy array before iterating — listeners may remove themselves
  for (const L of [...slot.listeners]) {
    if (L.type === type) {
      try { L.fn(data) } catch (e) {}
    }
  }
}

function _createPlayerInSlot(slot, YT) {
  const targetEl = document.createElement('div')
  const targetId = 'yt-pool-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  targetEl.id = targetId
  slot.wrapEl.appendChild(targetEl)

  slot.player = new YT.Player(targetId, {
    videoId: slot.videoId,
    width: YT_IFRAME_WIDTH,
    height: YT_IFRAME_HEIGHT,
    playerVars: {
      controls: 0, rel: 0, fs: 0, disablekb: 1,
      iv_load_policy: 3, playsinline: 1, vq: 'hd1080',
    },
    events: {
      onReady: (e) => {
        try { e.target.mute() } catch (err) {}
        slot.ready = true
        _fireListeners(slot, 'ready', slot.player)
      },
      onStateChange: (e) => {
        _fireListeners(slot, 'state', e.data)
        if (e.data === 1) slot.hasPlayedOnce = true
      },
      onPlaybackRateChange: (e) => {
        _fireListeners(slot, 'rate', e.data)
      },
    },
  })

  // Fire 'created' AFTER slot.player is assigned so listeners can use it
  _fireListeners(slot, 'created', slot.player)
}

export function acquire(videoId) {
  if (_slots.has(videoId)) {
    const slot = _slots.get(videoId)
    slot.lastUsed = Date.now()
    return slot
  }

  if (_slots.size >= MAX_POOL_SIZE) _evict()

  const slot = {
    videoId,
    wrapEl: document.createElement('div'),
    player: null,
    ready: false,
    hasPlayedOnce: false,
    listeners: [],
    lastUsed: Date.now(),
  }
  Object.assign(slot.wrapEl.style, {
    width: '100%',
    height: '100%',
    display: 'block',
  })
  getPortal().appendChild(slot.wrapEl)
  _slots.set(videoId, slot)

  // Create player synchronously if YT is already loaded, else wait for it
  if (window.YT?.Player) {
    _createPlayerInSlot(slot, window.YT)
  } else {
    loadYouTubeAPI().then((YT) => {
      if (!_slots.has(videoId)) return // evicted while loading
      if (!slot.player) _createPlayerInSlot(slot, YT)
    })
  }

  return slot
}

// Move wrapEl to containerEl using a clean DOM move (no innerHTML).
// Cleanup always calls detach before the next attach, so the container
// is empty — no need to clear it. Just appendChild moves the node.
export function attach(slot, containerEl) {
  if (!containerEl) return
  if (slot.wrapEl.parentNode !== containerEl) {
    containerEl.appendChild(slot.wrapEl)
  }
  // Force iframe to fill the container — YT sets pixel dimensions we need to override
  const forceSize = () => {
    const iframe = slot.wrapEl.querySelector('iframe')
    if (iframe) {
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.background = '#000'
    }
  }
  forceSize()
  setTimeout(forceSize, 0)
  setTimeout(forceSize, 300)
}

export function detach(slot) {
  if (!slot) return
  slot.lastUsed = Date.now()
  // Pause before moving off-screen so the slot is in a known paused state
  // when re-acquired. Prevents audio playing off-screen and ensures only
  // the seek effect's seekTo+playVideo starts playback on next attach.
  if (slot.player?.pauseVideo) {
    try { slot.player.pauseVideo() } catch (e) {}
  }
  getPortal().appendChild(slot.wrapEl)
}

export function addListener(slot, type, fn) {
  const L = { type, fn }
  slot.listeners.push(L)
  return () => {
    const i = slot.listeners.indexOf(L)
    if (i >= 0) slot.listeners.splice(i, 1)
  }
}
