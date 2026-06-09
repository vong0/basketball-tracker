# Segment Label Format

Free-text format for tagging basketball video segments. Optimized for fast typing during review.

## Grammar

```
TEAM[QUALITY](TYPE) [players]: note [| more...] [>> summary]
```

| Part | Values | Required | Notes |
|---|---|---|---|
| `TEAM` | `U` (us) / `O` (opponent) | Yes (first action) | Inherits to subsequent actions if omitted |
| `QUALITY` | `G` (good) / `B` (bad) / omit (neutral) | No | Global perspective: good for the acting team, bad for the acting team |
| `TYPE` | `O` / `D` / `MAN` / `2-3` / `3-2` | Yes (first action) | **Frozen set — no new codes** |
| `players` | comma-separated short names | No | e.g. `matt`, `matt,vong`. Omit or use `all` for team-wide actions (rendered without player names) |
| `: note` | free text | No | Becomes searchable keywords |
| `\|` | action separator | No | Subsequent actions inherit `TEAM(TYPE)` if omitted |
| `>> summary` | free text | No | Overrides row title; useful for multi-action segments |

## Segment vs marker

A **segment** has `start` + `end` and is a clip. A **marker** has only `start` and is a moment-in-time tag (e.g. defensive scheme change). Both use the same label format.

```js
// Segment (clip)
{ start: 95.04, end: 106.97, name: 'UG(O) matt: drives baseline' }

// Marker (no end, applies until next marker of same kind)
{ start: 52.90, name: 'U(MAN)' }
```

## Inheritance via `|`

```
UG(O) matt: drives | vong: screens | george: pops for three
```

All three actions inherit `UG(O)`. Equivalent to writing the prefix three times.

To switch context mid-segment, restate the prefix:

```
UG(O) matt: great cut | O(MAN) : opponent switches man
```

## Summary override

A trailing `>> text` provides a one-line description of the whole segment. Shown on the playlist row instead of the auto-generated title from the first action. Useful for multi-action segments where no single action captures the play.

```
UG(O) matt: drives | vong: relocates | george,kap: double screen | matt: kicks to george for three >> textbook flow offense, four-man action, open three
```

## Free-text keywords

The note is free text — no special syntax needed. The viewer:

1.  Full-text searches the note.
2.  Auto-extracts common action words as clickable filter chips: `screen`, `drive`, `cut`, `roll`, `pop`, `iso`, `post-up`, `help`, `closeout`, `hedge`, `recover`, `block`, `rotation`, `jumper`, `fastbreak`, `fb`, `pnr`, `transition`, `kick-out`, `skip`, `dump`, `slip`, `flare`, `curl`, `pin-down`, `back-screen`, `backdoor`, `paint`, `corner`, `wing`, `top`.
3.  Suggests new keywords based on words used repeatedly.
4.  Optional `#tag` suffix promotes a word to a guaranteed primary tag:  
    `UG(O) matt: high screen and roll #pnr    UG(D) vong: great hedge and recover #hedge`  
    Multiple tags: `#pnr,roll`. Everything before `#` stays as free-text note.

---

# Display Rules

## Quality dots

**Each action has its own quality dot.** Dots are rendered per-player/per-action, not aggregated for the segment.

**Dot colors:**

| Quality | Us | Opponent |
|---|---|---|
| Good (G) | Green dot | Blue dot |
| Bad (B) | Red dot | Blue dot |
| Neutral (no G/B) | Gray dot | Blue dot |

All opponent actions get a blue dot regardless of quality. The `G`/`B`/neutral distinction is preserved internally for future filtering but does not change the dot color.

```
UG(O) matt: drives | vong: screens
```

→ matt has a green dot, vong has a green dot.

```
UB(O) matt: bad pass | UG(D) george: deflects, recovers
```

→ matt has a red dot, george has a green dot.

```
OG(O) opponent: fastbreak layup
```

→ blue dot (good for opponent, bad for us).

```
OB(O) opponent: missed open three
```

→ blue dot (bad for opponent, good for us).

## No dot for scheme-only segments/markers

When TYPE is `MAN`, `2-3`, or `3-2` with no quality indicator (no G/B prefix), omit the dot. The type badge alone is sufficient. If quality is specified on a scheme (e.g. `UG(MAN)`), the dot still appears.

## Inactive row layout

| Actions | Layout |
| --- | --- |
| 1 | Single line, ellipsis-truncated |
| 2 | Two lines, one per action, each ellipsis-truncated |
| 3+ | Two lines (actions 1 and 2), `· +N` indicator at end of line 2 |

Each rendered action line is:

```
●  <players joined with ", ">: <note>
```

- **No players specified (or `all`):** Render as `●  <note>`. Player name is omitted.
- **Players specified, no note:** `●  <players>`.
- **Both players and note:** `●  <players>: <note>`.
- **Scheme-only (no dot):** `<note>` without leading dot.

Dot is always present unless scheme-only with no quality. Colon only when both players and note exist.

## Active row layout

Always fully expanded. Every action on its own line. No clamping, no `+N` indicator. The active row is visibly taller for multi-action segments — that height change is its own visual cue, no extra styling needed.

## Same-player multi-action

If the same player has two actions in one segment, render both lines as-is, even if names repeat:

```
1:35  [O]  ● matt: drives baseline...
           ● matt: bad pass on next possession
```

Truthful and simple. No de-duplication.

## Same-action multi-player

A single action with multiple players is **one line**:

```
UG(O) matt,vong: pick and pop
```

→

```
1:35  [O]  ● matt, vong: pick and pop for open three
```

## Type badge

Indicates offense/defense/scheme/team. Color-coded:

| Code | Meaning | Visual |
| --- | --- | --- |
| `[O]` / `[D]` (us) | Our offense / our defense | Orange-tinted pill |
| `[X]` (opponent) | Opponent's possession | Red-tinted pill |
| `[2-3]` / `[3-2]` / `[MAN]` | Defensive scheme | Gray pill |

The dot sits **next to the player name** (if present), not at the start of the row. For team-wide actions with no players listed, the dot is followed directly by the note.

## Markers on the timeline

Markers (no `end`) render as a vertical tick at `start`, labeled with `TYPE` (e.g. `MAN`, `2-3`).

---

# Examples

### 1. Simple single action, good offense

```
UG(O) matt: drives baseline and kicks for open three
```

**Inactive row:**

```
1:35  [O]  ● matt: drives baseline and kicks for open three
```

### 2. Bad defense, no player called out (team-wide, defaults to all)

```
UB(D) lost rotation on weak side, easy layup for opponent
```

**Inactive row (no player name rendered):**

```
1:35  [D]  ● lost rotation on weak side, easy layup for opponent
```

### 3. Neutral opponent offense (blue dot)

```
O(O) opponent: fastbreak layup
```

**Inactive row:**

```
1:35  [X]  ● opponent: fastbreak layup
```

### 4. Good opponent offense (blue dot, good for them)

```
OG(O) opponent: well-executed pick and roll for open dunk
```

**Inactive row:**

```
1:35  [X]  ● opponent: well-executed pick and roll for open dunk
```

### 5. Bad opponent offense (blue dot, bad for them, good for us)

```
OB(O) opponent: forced shot, shot clock violation
```

**Inactive row:**

```
1:35  [X]  ● opponent: forced shot, shot clock violation
```

### 6. Neutral opponent, zone scheme (no dot — scheme-only, no quality)

```
O(2-3) opponent runs 2-3 zone, we get stuck on perimeter
```

**Inactive row:**

```
1:35  [2-3]  opponent runs 2-3 zone, we get stuck on perimeter
```

### 7. Multiple players, single action

```
UG(O) matt,vong: pick and roll, vong rolls hard for layup
```

**Inactive row (one line, both names share one dot):**

```
1:35  [O]  ● matt, vong: pick and roll, vong rolls hard for layup
```

### 8. Two actions, same prefix inherited

```
UG(O) matt: drives baseline | george,vong: pick and pop for open three
```

**Inactive row (two lines, two green dots):**

```
1:35  [O]  ● matt: drives baseline
           ● george, vong: pick and pop for open three
```

### 9. Mixed quality, mixed team

```
UB(O) george: forces shot in traffic | OG(O) opponent: clean rebound and outlet
```

**Inactive row (red dot then blue dot):**

```
1:35  [O]  ● george: forces shot in traffic
           ● opponent: clean rebound and outlet
```

### 10. Team-wide action with `all` (rendered without player name)

```
UG(MAN) all: full rotation snuffs out drive and kick
```

**Inactive row:**

```
1:35  [MAN]  ● full rotation snuffs out drive and kick
```

### 11. Multi-action with summary override (4 actions)

```
UG(O) matt: drives | vong: relocates | george,kap: double screen | matt: kicks to george for three >> textbook flow offense, four-man action, open three
```

**Inactive row (summary as title, +2 indicator):**

```
1:35  [O]  ● matt: drives
           ● vong: relocates  · +2
```

**Active row (all four actions, no truncation):**

```
1:35  [O]  ● matt: drives
           ● vong: relocates
           ● george, kap: double screen
           ● matt: kicks to george for three
```

### 12. Same player, two actions in one segment

```
UB(O) matt: bad pass | UG(O) matt: recovers and finishes
```

**Inactive row (two lines, red then green, name repeats):**

```
1:35  [O]  ● matt: bad pass
           ● matt: recovers and finishes
```

### 13. Mixed-result segment with summary

```
UB(O) matt: bad pass | UG(D) george: deflects, recovers | UG(O) vong: fastbreak layup >> turnover into transition score
```

**Inactive row:**

```
1:35  [O]  ● matt: bad pass
           ● george: deflects, recovers  · +1
```

### 14. Zone with no players, no quality (no dot)

```
U(3-2) trap on the wing forces shot clock violation
```

**Inactive row:**

```
1:35  [3-2]  trap on the wing forces shot clock violation
```

### 15. Marker (scheme change for rest of game)

```js
{ start: 52.90, name: 'U(MAN)' }
```

**Timeline:** vertical tick at 52.90s labeled `MAN`. Applies until next marker of same kind.

### 16. Long segment, many actions, with summary

```
UG(O) vong: brings up | matt: dho | george: slips | vong: skip pass corner | kap: shot fake drive | kap: kicks back | vong: open three >> 12 second possession, ball touches 5 hands, open three
```

**Inactive row:**

```
1:35  [O]  ● vong: brings up
           ● matt: dho  · +5
```

**Active row:** all 7 lines, no truncation.

### 17. Optional `#tag` for guaranteed filter

```
UG(O) matt: high screen and roll, great read #pnr
```

**Inactive row (tag is part of free-text, filter chip extracted automatically):**

```
1:35  [O]  ● matt: high screen and roll, great read
```

### 18. Note-only action, team-wide

```
U(O) set runs perfectly but shot rims out
```

**Inactive row:**

```
1:35  [O]  ● set runs perfectly but shot rims out
```