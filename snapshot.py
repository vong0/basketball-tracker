"""
snapshot.py

Walks src/ (and a few other key files) and writes each file's contents
with a clear header to patch.txt, so you can paste the full state of
your repo into chat.

Usage:
  python snapshot.py
"""

from pathlib import Path


# Folders/files to include (relative to script location)
INCLUDE_PATHS = [
    "src",
    "public/data",
]

# Individual files to include (relative to script location)
INCLUDE_FILES = [
    "package.json",
    "vite.config.js",
    "index.html",
]
# INCLUDE_FILES += [
#     "tools/stats-core/standalone/basketball-tracker-v0.4.17.3-locked-game-final-fix.html", "public/data/stats.html",
#     "../html/games-g1.html", "../html/games.html", "../html/players.html", "../html/players-adam.html", "../html/tables/ab.html",
#     "tools/stats-core/src/stats/basketballConstants.js", "tools/stats-core/src/stats/basketballStats.js",
# ]


# File extensions to cat
INCLUDE_EXTENSIONS = {
    ".jsx", ".js", ".ts", ".tsx",
    ".css", ".module.css",
    ".json",
}

# Folders to skip even if inside an included path
SKIP_DIRS = {"node_modules", "dist", ".git", "build", ".vite"}

# Files to skip
SKIP_FILES = {"package-lock.json"}

OUTPUT_FILE = "snapshot.txt"


def should_include(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    if any(part in SKIP_DIRS for part in path.parts):
        return False
    name = path.name.lower()
    if name.endswith(".module.css"):
        return True
    return path.suffix.lower() in INCLUDE_EXTENSIONS


def collect_files(root: Path) -> list[Path]:
    files = []

    for rel in INCLUDE_PATHS:
        base = root / rel
        if not base.exists():
            continue
        for p in sorted(base.rglob("*")):
            if p.is_file() and should_include(p):
                files.append(p)

    for rel in INCLUDE_FILES:
        p = root / rel
        if p.exists() and p.is_file():
            files.append(p)

    return files


def format_file(path: Path, root: Path) -> str:
    rel = path.relative_to(root).as_posix()
    sep = "=" * 80
    lines = [f"\n{sep}", f"FILE: {rel}", sep]
    try:
        lines.append(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        lines.append(f"[binary or non-utf8 file, skipped: {rel}]")
    return "\n".join(lines)


def main() -> None:
    root = Path(__file__).parent.resolve()
    files = collect_files(root)

    out_lines = []
    out_lines.append("REPO SNAPSHOT")
    out_lines.append(f"Root: {root}")
    out_lines.append(f"Files: {len(files)}\n")

    out_lines.append("TREE:")
    for f in files:
        out_lines.append(f"  {f.relative_to(root).as_posix()}")

    for f in files:
        out_lines.append(format_file(f, root))

    output_path = root / OUTPUT_FILE
    output_path.write_text("\n".join(out_lines), encoding="utf-8")

    print(f"Wrote snapshot of {len(files)} files to: {output_path}")


if __name__ == "__main__":
    main()
