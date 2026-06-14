# Spartans Basketball Tracker v0.4.17.3 — full package

## Use this first
Open `index.html` or `standalone/basketball-tracker-v0.4.17.3-locked-game-final-fix.html` in a browser. That is the safest working version because CSS, JavaScript, and embedded data are all in one file.

## Source files
- `src/app.js` — extracted JavaScript from the standalone tracker
- `src/styles.css` — extracted CSS
- `data/embedded-data.json` — data embedded in this build
- `dev-index-split.html` — same app with external CSS/JS links for easier editing/testing

## Notes
The standalone HTML is still the source of truth for actual use, because exported interactive reports are generated from the current document. The split files are included so the JavaScript/CSS can be inspected or moved into the future GitHub/Vite/React project.

Current important behavior included:
- season/game tracking
- add/edit game
- edit/delete shots, events, free throws, and lineups
- smarter Needs Attention report logic
- shot-popup clear behavior
- normal interactive report export
- locked-game report export
