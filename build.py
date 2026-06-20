#!/usr/bin/env python3
"""
build.py — converts content/wiki-pages/**/*.md into game/pages/*.html fragments.

Talk pages are NOT built — they are rendered entirely in JavaScript (talk.js).
The content/talk-pages/ folder exists for writing notes and CAPTCHA scripts only.

Output is always flat in game/pages/ regardless of chapter subdirectory.

Run:
    python3 build.py            # build everything
    python3 build.py --watch    # rebuild on file change (requires watchdog)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import markdown
except ImportError:
    sys.exit("Missing dependency: pip install markdown")

CONTENT_DIR   = Path("content")
WIKI_PAGES_DIR = CONTENT_DIR / "wiki-pages"
OUTPUT_DIR     = Path("game/pages")

CHAPTERS = {
    "ch1-the-town":      "Chapter 1 — The Town",
    "ch2-the-residents": "Chapter 2 — The Residents",
    "ch3-ally":          "Chapter 3 — Ally",
    "ch4-endings":       "Chapter 4 — Endings",
}


def wiki_link(match):
    """Convert [[Page Name]] or [[page-id|Label]] to an in-game anchor."""
    raw   = match.group(1)
    label = match.group(2) if match.group(2) else raw
    page_id = raw.lower().replace(" ", "-")
    return f'<a data-page="{page_id}">{label}</a>'


def process_md(text: str) -> str:
    text = re.sub(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', wiki_link, text)
    return text


def build_page(md_path: Path, out_path: Path):
    raw       = md_path.read_text(encoding="utf-8")
    processed = process_md(raw)
    html      = markdown.markdown(processed, extensions=["tables", "fenced_code"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    print(f"  {md_path.relative_to(CONTENT_DIR)}  →  {out_path.name}")


def build_all():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for chapter_dir in sorted(WIKI_PAGES_DIR.iterdir()):
        if not chapter_dir.is_dir():
            continue
        label = CHAPTERS.get(chapter_dir.name, chapter_dir.name)
        print(f"\n{label}")
        for md_path in sorted(chapter_dir.glob("*.md")):
            out_path = OUTPUT_DIR / f"{md_path.stem}.html"
            build_page(md_path, out_path)

    print("\nDone.")


def watch():
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        sys.exit("Missing dependency for --watch: pip install watchdog")

    class Handler(FileSystemEventHandler):
        def on_modified(self, event):
            p = Path(event.src_path)
            if p.suffix != ".md":
                return
            # Only build files inside wiki-pages/ — skip talk-pages and design/
            try:
                p.relative_to(WIKI_PAGES_DIR)
            except ValueError:
                return
            out = OUTPUT_DIR / f"{p.stem}.html"
            build_page(p, out)

    observer = Observer()
    observer.schedule(Handler(), str(WIKI_PAGES_DIR), recursive=True)
    observer.start()
    print(f"Watching {WIKI_PAGES_DIR}/ for changes… (Ctrl-C to stop)")
    try:
        while True:
            import time; time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--watch", action="store_true")
    args = parser.parse_args()

    if args.watch:
        build_all()
        watch()
    else:
        build_all()
