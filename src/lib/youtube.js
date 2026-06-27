let scriptInjected = false
const resolvers = []

export function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return }
    resolvers.push(resolve)
    if (!scriptInjected) {
      scriptInjected = true
      window.onYouTubeIframeAPIReady = () => {
        resolvers.forEach(r => r(window.YT))
        resolvers.length = 0
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

export function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}
