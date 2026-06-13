# Basketball Stats Core v0.4.6 Report Extras

Bugfix/control release for the standalone tracker.

Adds:
- Clear recent tracking log only
- Clear browser save
- JSON import confirmation and fresh file-input reset
- New localStorage key so v0.3.1 test data does not automatically bleed into v0.3.2

Use `standalone/basketball-tracker-standalone-v0.3.2-save-controls.html` for the latest standalone app.

# Basketball Stats Core v0.4.6 Report Extras

This package contains the standalone tracking app, migrated data, and stat calculation foundation for the Spartans basketball tracker.

## Main file

Open `standalone/basketball-tracker-standalone-v0.3.2-film-workflow.html` in a browser.

## v0.3.2 focus

The main addition is the `Track Game` workflow for watching film and entering shots, events, free throws, and lineup stints without touching Excel. JSON is the source of truth. Excel export is preserved as a backup/bridge.

# Basketball stats core v0.2

This is a portable starter kit for moving the basketball tracker away from fragile Excel formulas and toward a website/app structure.

It does **not** modify the existing Vong website. It gives us the pieces to plug in later:

- JSON schema that mirrors the Excel tabs
- JavaScript stat engine replacing the Excel formulas
- React-compatible FIBA shot chart component
- CSV/TSV export helpers for Excel backup
- Standalone all-in-one tracking HTML app
- Stat parity checklist so we do not forget anything

## Key files

```text
src/schema/basketballDataSchema.md
src/stats/basketballStats.js
src/stats/basketballConstants.js
src/importExport/csvExport.js
src/components/FibaShotChart.jsx
standalone/basketball-tracker-standalone-v0.2-migrated.html
sample-data/sampleData.json
docs/excel-stat-parity-checklist.md
docs/integration-notes-for-vong-site.md
```

## Test the stat engine

```bash
npm test
```

## Recommended workflow now

```text
1. Track games in standalone/basketball-tracker-standalone-v0.2-migrated.html
2. Export JSON after every game
3. Use the stat engine to calculate player/team/game reports
4. Export to Excel only as backup
5. Later, plug the stat engine and components into the React website
```

## What the stat engine currently calculates

- Player and team shooting stats
- Free throw stats
- eFG%, TS%, possession-used estimate, PTS/poss
- Assists and assist points
- Potential assists
- Advantage created
- Paint touches created
- Drive-kick 3PA created
- Screen assists
- Screen-created opportunities
- Screen advantages
- Rebounds, steals, blocks, deflections, turnovers, fouls, charges drawn
- Defensive playmaking
- Zone breakdowns
- Contest breakdowns
- Open/bad shot rates
- Transition stats
- Lineup ratings and player plus-minus from lineup stints


## v0.2 update

The next step has been done: the current Excel workbook data has been migrated into the portable JSON format and validated through the JavaScript stat engine.

New files:

```text
tools/importExcelWorkbookToJson.py
tools/validateImportedData.mjs
migrated-data/spartans-tracked-data-from-excel-v0.2.json
docs/migration-report.md
docs/validation-output.json
standalone/basketball-tracker-standalone-v0.2-migrated.html
```

Use `standalone/basketball-tracker-standalone-v0.2-migrated.html` to keep tracking from the imported data, or import `migrated-data/spartans-tracked-data-from-excel-v0.2.json` into another frontend.

The one thing flagged for manual review is the second `Lineup_Stints` row: the `half` value is currently `result`. It was preserved exactly from the workbook, but it should probably be changed later to `ALL`, `2H`, or another deliberate value.


## v0.4.6 Report Extras

- Removed `deep top 3`; long/deep center threes now stay as `top 3`.
- Added locked event type/subtype combinations for rebound, turnover, foul, charge drawn, steal, block, deflection, creation, and screen events.
- Added on-screen usage notes for event combinations so tracking decisions match the Excel event guide.


## v0.4.6 Report Extras

Cleaned up event entry by removing the duplicate quick preset buttons. Use dynamic type/subtype dropdowns for event tracking. Deep top 3 is normalized to top 3.


## v0.4.6 Report Extras

Adds the first proper presentation/report-builder layer on top of the tracking data:

- game report hero with score, result, leaders, shot quality notes, best/cold zones
- filtered FIBA shot map inside Reports
- filtered shot list
- expanded all-player advanced table
- download current report as a standalone HTML file

This is still separate from the Spartans website, but it is structured to make eventual React/Vite integration easier.


## v0.4.6 Report Extras
- Shot list now stretches to match the FIBA shot map height.
- Zone/contest tables now combine FGM and FGA as FG.
- Score/points card is cleaner.
- Selected player advanced stats use compact grouped cards.
- Added event breakdown by type/subtype for selected filters.


## v0.4.6 report extras
- Report labels now use **Extra Potential AST** for the missed/no-assist creation events.
- Shot popup placement is clamped left/right so text is less likely to get cut off on edge shots.
- Added a shot-map toggle to show transparent zone labels with zone name, FGM/FGA, and FG%.
- Added game-story cards for efficiency, shot quality, creation/screening, and possession battle.
- Added lineup impact cards before the detailed lineup table.
- Filtered shot list and shot map use matching vertical sizing.


## v0.4.6 Report insights

- Improved FIBA shot-map region labels for readability.
- Added report takeaways / notes saved into JSON.
- Added half splits table.
- Added team control dashboard.
- Added creation leaders and screening leaders tables.


## v0.4.12.1.1

Use `standalone/basketball-tracker-standalone-v0.4.12.1.1-interactive-report-fixed.html`; it fixes the broken v0.4.12.1.1 HTML load/export issue.


## v0.4.12.1.1 report export fix

Fixes the interactive report export so the downloaded report is report-only, desktop-forced on phones, and the Game/Half/Player dropdowns stay interactive after export. The fix avoids injecting the report init script into the wrong place and avoids unescaped script closing tags.


## v0.4.12.1.1 updates
- Added season-aware game labels such as `2026-S2 G1`. Legacy `G1` imports are normalized to `2026-S2 G1`.
- Added report URL parameters: `?tab=reports&season=2026-S2&game=2026-S2%20G1&half=ALL&player=Adam`.
- Added edit buttons for Shots, Events, Free Throws, and Lineup Stints.
- Exported interactive reports remain report-only and desktop-width on phones.


## v0.4.12.1.1 report export polish
- Exported interactive report removes the full tracker top bar and tab titles from the file itself.
- Exported interactive report now shows the date/time it was generated at the top.
- Exported report remains desktop-only on phones and keeps interactive season/game/half/player dropdowns.
