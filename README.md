# wiki-wiki

A browser-based hypertext horror game styled as a Wikipedia clone. 

---

## Repo structure

```
build.py                  # Markdown → HTML build script
content/
  wiki-pages/             # Story content (edit these)
    ch1-the-town/
    ch2-the-residents/
    ch3-ally/
    ch4-endings/
  talk-pages/             # Notes/drafts for hinge dialogues
  design/                 # Lore bible, hyperlink map, page state plans
game/
  index.html              # Entry point — open this in a browser (via server)
  style.css
  pages/                  # Built HTML fragments (committed, do not hand-edit)
  js/
    router.js             # Navigation, page consumption
    state.js              # localStorage save/load
    corruption.js         # Per-page degradation logic
    talk.js               # Hinge dialogue scripts and CAPTCHA renderer
    player-page.js        # Runtime variable injection for the ending page
    audio.js              # Ambient sound mapping
    ending.js             # Ending sequence
    browser-horror.js     # Browser-level effects
  assets/
```

---

## Setup

Install the build script's dependency:

```bash
pip install markdown
```

For file-watching during writing:

```bash
pip install markdown watchdog
```

---

## Writing content

All story content lives in `content/`. The engine never touches these files directly — `build.py` converts them to HTML fragments that the game loads.

### Wiki pages

`content/wiki-pages/<chapter>/<page-name>.md`

Write standard Markdown. Use `[[Page Name]]` to link between pages — the build script converts these to in-game links automatically.

```markdown
The town of [[Peculiar, Mississippi]] was incorporated in 1889.
```

To use a custom label: `[[page-id|Display Text]]`

```markdown
[[henry-liang|Dr. Liang]] was not available for comment.
```

The page's filename becomes its ID. `henry-liang.md` → navigated to as `henry-liang`.

### Talk pages (the hinge dialogues)

`content/talk-pages/hinge-*.md`

These are plain Markdown but are mostly decorative — the actual dialogue scripts live in `game/js/talk.js` under `SCRIPTS`. The `.md` files can hold notes/drafts for each hinge.

### Player page

`content/wiki-pages/ch4-endings/player-page.md`

Write this like a normal wiki page but use `{{variables}}` wherever you want the player's own data injected at runtime:

| Variable | Value |
|---|---|
| `{{visit_count}}` | Total number of link clicks |
| `{{pages_visited}}` | Number of distinct pages seen |
| `{{time_spent}}` | Time since first page load |
| `{{most_visited_page}}` | The page they returned to most |
| `{{first_page}}` | First page they visited |
| `{{choices_made}}` | Number of choices recorded |

Add new variables by editing `deriveVariables()` in `game/js/player-page.js`.

---

## Building

Always run from the repo root:

```bash
# Build once
python3 build.py

# Build and watch for changes
python3 build.py --watch
```

Output goes to `game/pages/`. Commit these — they're what the browser loads.

---

## Running the game

Open `game/index.html` in a browser. Because the router uses `fetch()` to load page fragments, you need a local server — opening the file directly with `file://` will get blocked by CORS.

Quickest option:

```bash
cd game
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Adding a new wiki page

1. Create `content/wiki-pages/<chapter>/your-page-name.md`
2. Add `'your-page-name'` to `KNOWN_PAGES` in `game/js/router.js`
3. Run `python3 build.py`
4. Link to it from other pages with `[[your-page-name|Label]]`

## Adding corruption to a page

In `game/js/corruption.js`, add an entry to `PAGE_STATES`:

```js
'your-page-name': [
  { visits: 0, state: 'clean' },
  { visits: 2, state: 'touched' },
  { visits: 5, state: 'degraded' },
  { visits: 10, state: 'corrupted' },
],
```

Then fill in what actually changes at each level inside `applyTouched()`, `applyDegraded()`, `applyCorrupted()` — or add per-page handlers branching off `pageId`.

## Adding a talk hinge

1. Write the dialogue in `game/js/talk.js` under `SCRIPTS['hinge-N']`
2. Set the unlock condition in `HINGE_UNLOCK`
3. The Talk tab appears automatically once the condition is met

## Adding audio

Drop files into `game/assets/audio/`, then assign them in `game/js/audio.js`:

```js
const AMBIENT_MAP = {
  'your-page-name': 'your-track.mp3',
};
```

---

## State & save data

All game state is stored in `localStorage` under the key `wikiwiki_state`. To wipe it during development, run in the browser console:

```js
localStorage.removeItem('wikiwiki_state')
```

Or call `reset()` from `game/js/state.js`.
