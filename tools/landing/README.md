# Spartans site boilerplate v0.1

This is a simple GitHub Pages-friendly landing/data site for the Spartans basketball project.

It has four main clickable sections:

- **Players** — name, jersey, position, role, notes
- **Games** — opponent, score, YouTube link, report link, notes
- **Opponents** — team name and scouting notes for now
- **Strategies** — notes for offensive/defensive ideas

It also has a global **Backup / Data** page. That page backs up/imports **everything** in one JSON file, not just the current section.

## Files

```txt
index.html                         # GitHub Pages entry
standalone-preview.html            # Open directly in browser for quick preview
src/site-app.js                    # Landing/data app logic
src/site-styles.css                # Landing/data app styling
src/site-data.js                   # Boilerplate editable data
src/spartans-stats-core.js         # Reusable stats functions from tracker package
src/shot-chart-renderer.js         # Reusable shot chart renderer
public/data/site-data.json         # Combined JSON data for future fetch/commit workflow
public/data/players.json           # Split JSON
public/data/games.json             # Split JSON
public/data/opponents.json         # Split JSON
public/data/strategies.json        # Split JSON
public/data/spartans-tracked-data.json # Current stat tracker JSON
```

## Local preview

Fastest preview: open `standalone-preview.html`.

For the GitHub-style module version:

```bash
cd spartans-site-boilerplate-v0.1
python3 -m http.server 8000
```

Then open:

```txt
http://localhost:8000
```

## Data notes

Browser edits save to `localStorage`. They do not automatically commit back to GitHub.

Use **Backup / Data → Download all JSON** to export the current full dataset. Later, that exported JSON can be committed to `public/data/site-data.json`, or split into the per-section JSON files.

## For Vite/React later

Your friend can use the reusable modules:

```js
import SpartansStats from './src/spartans-stats-core.js';
import { renderShotChart } from './src/shot-chart-renderer.js';
```

The landing/data app is intentionally plain HTML/CSS/JS so it is easy to inspect and replace with React pages later.
