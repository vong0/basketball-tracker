#!/usr/bin/env python3
"""Import the basketball Excel tracker into the portable JSON schema.

This intentionally reads the .xlsx package XML directly so it does not depend on
Excel, LibreOffice, openpyxl, or pandas. It only extracts typed table rows from
the workbook tabs that matter to the app/stat engine.
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

TABLE_SHEETS = {
    "Roster": {
        "key": "players",
        "id_prefix": "player",
        "field_map": {"player": "player_id"},
        "number_fields": set(),
    },
    "Games": {
        "key": "games",
        "id_prefix": "game",
        "field_map": {"our_score": "team_score", "opp_score": "opponent_score"},
        "number_fields": {"team_score", "opponent_score"},
    },
    "Shots": {
        "key": "shots",
        "id_prefix": "shot",
        "field_map": {},
        "number_fields": {"points", "shot_x", "shot_y", "approx_distance_m"},
    },
    "Events": {
        "key": "events",
        "id_prefix": "event",
        "field_map": {},
        "number_fields": {"count", "points_created"},
    },
    "Free_Throws": {
        "key": "freeThrows",
        "id_prefix": "ft",
        "field_map": {},
        "number_fields": set(),
    },
    "Lineup_Stints": {
        "key": "lineupStints",
        "id_prefix": "stint",
        "field_map": {"TIME start": "time_start", "TIME END": "time_end"},
        "number_fields": {
            "off_poss", "def_poss", "points_for", "points_against",
            "net_points", "off_rating", "def_rating", "net_rating",
        },
    },
}


def col_to_index(col_letters: str) -> int:
    idx = 0
    for ch in col_letters:
        idx = idx * 26 + ord(ch) - 64
    return idx


def cell_ref_to_rc(ref: str) -> tuple[int, int]:
    match = re.match(r"([A-Z]+)(\d+)", ref)
    if not match:
        raise ValueError(f"Bad cell ref: {ref}")
    return int(match.group(2)), col_to_index(match.group(1))


def norm_header(value: Any) -> str:
    text = str(value or "").strip()
    if text in {"TIME start", "TIME END"}:
        return text
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def clean_scalar(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, str):
        value = value.strip()
        # The raw XML stores some whole numbers as 52.0-like strings depending on the source.
        return value
    return value


def to_number(value: Any) -> Any:
    if value in (None, ""):
        return None
    try:
        n = float(str(value).strip())
    except ValueError:
        return value
    if n.is_integer():
        return int(n)
    return n


class XlsxReader:
    def __init__(self, path: Path):
        self.path = path
        self.z = zipfile.ZipFile(path)
        self.shared_strings = self._read_shared_strings()
        self.sheet_paths = self._read_sheet_paths()

    def close(self) -> None:
        self.z.close()

    def _read_shared_strings(self) -> list[str]:
        if "xl/sharedStrings.xml" not in self.z.namelist():
            return []
        root = ET.fromstring(self.z.read("xl/sharedStrings.xml"))
        strings: list[str] = []
        for si in root.findall("a:si", NS):
            parts = []
            for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"):
                parts.append(t.text or "")
            strings.append("".join(parts))
        return strings

    def _read_sheet_paths(self) -> dict[str, str]:
        wb = ET.fromstring(self.z.read("xl/workbook.xml"))
        rels = ET.fromstring(self.z.read("xl/_rels/workbook.xml.rels"))
        relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
        out: dict[str, str] = {}
        for sh in wb.find("a:sheets", NS):
            name = sh.attrib["name"]
            rid = sh.attrib[REL]
            target = relmap[rid]
            if not target.startswith("worksheets/"):
                target = "worksheets/" + target
            out[name] = "xl/" + target
        return out

    def _cell_value(self, cell: ET.Element) -> Any:
        ctype = cell.attrib.get("t")
        if ctype == "s":
            v = cell.find("a:v", NS)
            return self.shared_strings[int(v.text)] if v is not None and v.text is not None else ""
        if ctype == "inlineStr":
            parts = []
            isel = cell.find("a:is", NS)
            if isel is not None:
                for t in isel.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"):
                    parts.append(t.text or "")
            return "".join(parts)
        if ctype == "b":
            v = cell.find("a:v", NS)
            return v is not None and v.text == "1"
        v = cell.find("a:v", NS)
        return v.text if v is not None and v.text is not None else ""

    def rows(self, sheet_name: str) -> list[dict[int, Any]]:
        path = self.sheet_paths[sheet_name]
        root = ET.fromstring(self.z.read(path))
        rows: list[dict[int, Any]] = []
        for row in root.findall(".//a:sheetData/a:row", NS):
            vals: dict[int, Any] = {}
            for cell in row.findall("a:c", NS):
                _, col = cell_ref_to_rc(cell.attrib["r"])
                vals[col] = clean_scalar(self._cell_value(cell))
            rows.append(vals)
        return rows


def table_from_sheet(reader: XlsxReader, sheet_name: str, spec: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    rows = reader.rows(sheet_name)
    # Header row is normally row 4, but find the first row with known table-ish labels as a fallback.
    header_idx = None
    for idx, row in enumerate(rows):
        values = [str(v).strip() for v in row.values() if str(v).strip()]
        if not values:
            continue
        normed = [norm_header(v) for v in values]
        if sheet_name == "Roster" and "player" in normed:
            header_idx = idx
            break
        if sheet_name == "Games" and "game_id" in normed:
            header_idx = idx
            break
        if sheet_name == "Shots" and {"game_id", "player", "result"}.issubset(normed):
            header_idx = idx
            break
        if sheet_name == "Events" and {"game_id", "player", "event_type"}.issubset(normed):
            header_idx = idx
            break
        if sheet_name == "Free_Throws" and {"game_id", "player", "result"}.issubset(normed):
            header_idx = idx
            break
        if sheet_name == "Lineup_Stints" and {"game_id", "lineup_label"}.issubset(normed):
            header_idx = idx
            break
    if header_idx is None:
        return [], [f"No header row found for {sheet_name}"]

    raw_header = rows[header_idx]
    headers: dict[int, str] = {}
    for col, value in raw_header.items():
        if str(value).strip():
            h = norm_header(value)
            mapped = spec.get("field_map", {}).get(h, h)
            # Also allow maps keyed by exact original header.
            mapped = spec.get("field_map", {}).get(str(value).strip(), mapped)
            headers[col] = mapped

    records: list[dict[str, Any]] = []
    for row in rows[header_idx + 1:]:
        record: dict[str, Any] = {}
        for col, field in headers.items():
            value = clean_scalar(row.get(col, ""))
            if field in spec.get("number_fields", set()):
                value = to_number(value)
            record[field] = value
        # Stop only if row is truly empty across the imported table headers.
        if not any(str(v).strip() for v in record.values() if v is not None):
            continue
        records.append(record)

    return records, warnings


def import_workbook(path: Path) -> tuple[dict[str, Any], list[str]]:
    reader = XlsxReader(path)
    warnings: list[str] = []
    data = {
        "version": 2,
        "source": {
            "kind": "xlsx",
            "file": path.name,
            "imported_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        },
        "team": {"name": "Spartans"},
        "players": [],
        "games": [],
        "shots": [],
        "events": [],
        "freeThrows": [],
        "lineupStints": [],
        "opponents": [],
        "strategies": [],
        "clips": [],
    }
    try:
        for sheet_name, spec in TABLE_SHEETS.items():
            if sheet_name not in reader.sheet_paths:
                warnings.append(f"Sheet missing: {sheet_name}")
                continue
            records, sheet_warnings = table_from_sheet(reader, sheet_name, spec)
            warnings.extend(sheet_warnings)
            key = spec["key"]
            for i, record in enumerate(records, start=1):
                if key == "players":
                    record.setdefault("name", record.get("player_id", ""))
                    record.setdefault("active", True)
                if key == "shots":
                    record.setdefault("shot_id", f"shot_{i:04d}")
                elif key == "events":
                    record.setdefault("event_id", f"event_{i:04d}")
                    if record.get("count") in (None, ""):
                        record["count"] = 1
                    if record.get("points_created") in (None, ""):
                        record["points_created"] = 0
                elif key == "freeThrows":
                    record.setdefault("ft_id", f"ft_{i:04d}")
                elif key == "lineupStints":
                    record.setdefault("stint_id", f"stint_{i:04d}")
                data[key].append(record)

        # Build opponent records from games if present.
        seen_opps = set()
        for game in data["games"]:
            opponent = str(game.get("opponent") or "").strip()
            if opponent and opponent not in seen_opps:
                seen_opps.add(opponent)
                opponent_id = re.sub(r"[^a-z0-9]+", "-", opponent.lower()).strip("-") or opponent
                data["opponents"].append({"opponent_id": opponent_id, "name": opponent, "notes": "", "tendencies": []})
                game.setdefault("opponent_id", opponent_id)

        # Basic data warnings / validation hints.
        valid_halves = {"1H", "2H", "OT", "ALL", "all", ""}
        for i, row in enumerate(data["lineupStints"], start=1):
            half = row.get("half", "")
            if half not in valid_halves:
                warnings.append(f"Lineup_Stints row {i} has unusual half value: {half!r}; preserved as-is.")
        return data, warnings
    finally:
        reader.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx", type=Path)
    parser.add_argument("json_out", type=Path)
    parser.add_argument("--report", type=Path, default=None)
    args = parser.parse_args()

    data, warnings = import_workbook(args.xlsx)
    args.json_out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    if args.report:
        lines = [
            "# Excel to JSON migration report",
            "",
            f"Source workbook: `{args.xlsx.name}`",
            f"Output JSON: `{args.json_out.name}`",
            "",
            "## Imported records",
            "",
            f"- players: {len(data['players'])}",
            f"- games: {len(data['games'])}",
            f"- shots: {len(data['shots'])}",
            f"- events: {len(data['events'])}",
            f"- free throws: {len(data['freeThrows'])}",
            f"- lineup stints: {len(data['lineupStints'])}",
            f"- opponents inferred: {len(data['opponents'])}",
            "",
            "## Warnings / things to manually review",
            "",
        ]
        if warnings:
            lines.extend([f"- {w}" for w in warnings])
        else:
            lines.append("- No importer warnings.")
        lines.extend([
            "",
            "## What this means",
            "",
            "This JSON is now the clean portable data source for the standalone tracker and the future website/stat engine.",
            "Excel can remain an optional export/backup, but the formulas no longer need to be the main source of truth.",
        ])
        args.report.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
