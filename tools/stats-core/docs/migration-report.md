# Excel to JSON migration report

Source workbook: `Basketball_Stats_Tracker_Dashboard_Breakdowns_Updated_FIXED.xlsx`
Output JSON: `spartans-tracked-data-from-excel-v0.2.json`

## Imported records

- players: 7
- games: 1
- shots: 51
- events: 111
- free throws: 10
- lineup stints: 2
- opponents inferred: 0

## Warnings / things to manually review

- Lineup_Stints row 2 has unusual half value: 'result'; preserved as-is.

## What this means

This JSON is now the clean portable data source for the standalone tracker and the future website/stat engine.
Excel can remain an optional export/backup, but the formulas no longer need to be the main source of truth.

## Stat-engine validation on imported data

The imported JSON was run through the JavaScript stat engine. Core totals matched the existing workbook totals for the current tracked game:

- Team PTS: 52
- FGM/FGA: 18/51
- 3PM/3PA: 11/28
- FTM/FTA: 5/10
- AST: 14
- TOV: 10
- REB: 36
- OREB/DREB: 9/27
- Potential_AST: 17
- Adv_Created: 7
- Screen_Created_Total: 22

Player scoring from imported JSON:

- Emanuel: 11 PTS, 4/10 FG, 3/6 3PT, 6 AST
- Alex: 0 PTS, 0/1 FG, 2 AST
- Adam: 26 PTS, 9/26 FG, 6/16 3PT, 3 AST
- George: 1 PTS, 1/2 FT
- Mushi: 0 PTS
- Vong: 0 PTS
- Matt: 14 PTS, 5/14 FG, 2/6 3PT, 3 AST

Full validation output is in `docs/validation-output.json`.
