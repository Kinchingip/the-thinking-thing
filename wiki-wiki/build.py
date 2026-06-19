#!/usr/bin/env python3
"""
build.py — converts content/*.md files into game/pages/*.html fragments.

Each .md file is converted to an HTML fragment (no <html>/<body> wrapper)
that the router injects into #wiki-content at runtime.

Run:
    python3 build.py            # build everything
    python3 build.py --watch    # rebuild on file change (requires watchdog)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import markdown  # pip install markdown
except ImportError:
    sys.exit("Missing dependency: pip install markdown")

CONTENT_DIR = Path("content")
OUTPUT_DIR  = Path("game/pages")

WIKI_PAGES_DIR = CONTENT_DIR / "wiki-pages"
TALK_PAGES_DIR = CONTENT_DIR / "talk-pages"


def wiki_link(match):
    """Convert [[Page Name]] to <a data-page="page-name">Page Name</a>."""
    raw = match.group(1)
    label = match.group(2) if match.group(2) else raw
    page_id = raw.lower().replace(" ", "-")
    return f'<a data-page="{page_id}">{label}</a>'


def process_md(text: str) -> str:
    """Apply wiki-style preprocessing before markdown conversion."""
    # [[Page Name]] or [[page-id|Label]]
    text = re.sub(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', wiki_link, text)
    return text


def build_page(md_path: Path, out_path: Path):
    raw = md_path.read_text(encoding="utf-8")
    processed = process_md(raw)
    html = markdown.markdown(processed, extensions=["tables", "fenced_code"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    print(f"  built {out_path.relative_to(Path('.'))}")


def build_all():
    print("Building wiki pages…")
    for md_path in WIKI_PAGES_DIR.glob("*.md"):
        out_path = OUTPUT_DIR / f"{md_path.stem}.html"
        build_page(md_path, out_path)

    print("Building talk pages…")
    for md_path in TALK_PAGES_DIR.glob("*.md"):
        out_path = OUTPUT_DIR / f"talk-{md_path.stem}.html"
        build_page(md_path, out_path)

    print("Done.")


def watch():
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        sys.exit("Missing dependency for --watch: pip install watchdog")

    class Handler(FileSystemEventHandler):
        def on_modified(self, event):
            if event.src_path.endswith(".md"):
                p = Path(event.src_path)
                is_talk = p.parent.name == "talk-pages"
                stem = p.stem
                out = OUTPUT_DIR / (f"talk-{stem}.html" if is_talk else f"{stem}.html")
                build_page(p, out)

    observer = Observer()
    observer.schedule(Handler(), str(CONTENT_DIR), recursive=True)
    observer.start()
    print(f"Watching {CONTENT_DIR}/ for changes… (Ctrl-C to stop)")
    try:
        while True:
            import time; time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--watch", action="store_true", help="Watch for changes and rebuild")
    args = parser.parse_args()

    if args.watch:
        build_all()
        watch()
    else:
        build_all()
