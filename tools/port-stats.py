#!/usr/bin/env python3
"""
port-stats.py — migrate spartans-tracked-data.json to public/data/stats.json

Usage:
    py tools/port-stats.py [--src PATH] [--out PATH]

Defaults:
    --src  tools/landing/public/data/spartans-tracked-data.json
    --out  public/data/stats.json

What it does:
  - Extracts shots / events / freeThrows / lineupStints
  - Normalises game_id: "2026-S2 G1" -> "2026-S2-G1" (space -> hyphen)
  - Lowercases all player-name fields across all four arrays
  - Drops stints with half="result" (data-entry error; those are summary rows)
  - Strips computed / legacy fields not in the target schema
"""

import argparse
import json
import sys
from pathlib import Path

# ── field sets (only these keys survive into stats.json) ─────────────────────

SHOT_FIELDS = {
    "shot_id", "game_id", "half", "player", "result", "points",
    "shot_x", "shot_y", "shot_type", "contest",
    "assisted_by", "screen_assist_by", "transition", "paint_touch",
    "drive_kick", "notes",
}

EVENT_FIELDS = {
    "event_id", "game_id", "half", "player", "event_type",
    "event_subtype", "count", "points_created", "related_player",
}

FT_FIELDS = {
    "ft_id", "game_id", "half", "player", "result", "ft_type",
}

STINT_FIELDS = {
    "stint_id", "game_id", "half",
    "player_1", "player_2", "player_3", "player_4", "player_5",
    "off_poss", "def_poss", "points_for", "points_against",
}

# Fields that hold player names and must be lowercased
PLAYER_NAME_FIELDS = {
    "player", "assisted_by", "screen_assist_by", "related_player",
    "player_1", "player_2", "player_3", "player_4", "player_5",
}


def normalise_game_id(gid: str) -> str:
    """'2026-S2 G1' -> '2026-S2-G1'"""
    return gid.replace(" ", "-")


def lowercase_players(row: dict) -> dict:
    for field in PLAYER_NAME_FIELDS:
        if field in row and isinstance(row[field], str):
            row[field] = row[field].lower()
    return row


def filter_fields(row: dict, keep: set) -> dict:
    return {k: v for k, v in row.items() if k in keep}


def process_shots(shots: list) -> list:
    out = []
    for row in shots:
        row = dict(row)
        row["game_id"] = normalise_game_id(row.get("game_id", ""))
        row = lowercase_players(row)
        out.append(filter_fields(row, SHOT_FIELDS))
    return out


def process_events(events: list) -> list:
    out = []
    for row in events:
        row = dict(row)
        row["game_id"] = normalise_game_id(row.get("game_id", ""))
        row = lowercase_players(row)
        out.append(filter_fields(row, EVENT_FIELDS))
    return out


def process_free_throws(fts: list) -> list:
    out = []
    for row in fts:
        row = dict(row)
        row["game_id"] = normalise_game_id(row.get("game_id", ""))
        row = lowercase_players(row)
        out.append(filter_fields(row, FT_FIELDS))
    return out


def process_stints(stints: list) -> tuple[list, int]:
    out = []
    for row in stints:
        row = dict(row)
        row["game_id"] = normalise_game_id(row.get("game_id", ""))
        row = lowercase_players(row)
        out.append(filter_fields(row, STINT_FIELDS))
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "src",
        help="Path to spartans-tracked-data.json",
    )
    parser.add_argument(
        "out",
        help="Output path for stats.json",
    )
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)

    if not src.exists():
        print(f"ERROR: source not found: {src}", file=sys.stderr)
        sys.exit(1)

    with open(src, encoding="utf-8") as f:
        data = json.load(f)

    # support both camelCase and snake_case keys for the four arrays
    shots = data.get("shots") or data.get("shots", [])
    events = data.get("events", [])
    free_throws = data.get("freeThrows") or data.get("free_throws", [])
    lineup_stints = data.get("lineupStints") or data.get("lineup_stints", [])

    shots_out = process_shots(shots)
    events_out = process_events(events)
    fts_out = process_free_throws(free_throws)
    stints_out = process_stints(lineup_stints)

    stats = {
        "shots": shots_out,
        "events": events_out,
        "freeThrows": fts_out,
        "lineupStints": stints_out,
    }

    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Written: {out}")
    print(f"  shots:        {len(shots_out)}")
    print(f"  events:       {len(events_out)}")
    print(f"  freeThrows:   {len(fts_out)}")
    print(f"  lineupStints: {len(stints_out)}")


if __name__ == "__main__":
    main()
