# The Rabbit Hole Archive

Conspiracy theories, unsolved mysteries and true stories that sound made up, sorted by what we actually know. Every case file keeps **what we know** apart from **what's speculation**, carries a verdict stamp, and links to its sources.

It's built in the **Grand Archive** look: black editorial pages, SF type with serif-italic accents, gold eyebrows, real photographs (never cartoons), and calm, Apple-like motion. There's also a cream **Manuscript** theme (the sun/moon button in the top bar) and a **Motion: Off** switch in the Case Index.

Plain HTML, CSS and vanilla JavaScript. No build step, no framework, no dependencies. It runs on GitHub Pages as-is.

---

## What's in the archive

25 case files and 243 people, each file with Wikipedia plus one or two other reputable sources. Every detail was checked against those sources, and no `factCheck` flags are open.

**Conspiracy Theories** (10): The JFK Assassination (Unproven), The Moon Landing Hoax (Debunked), 9/11 Theories (Debunked), Area 51 & Roswell (Debunked), The Illuminati (Debunked), The Flat Earth (Debunked), The Chemtrail Conspiracy (Debunked), Paul Is Dead (Debunked), The Death of Diana (Debunked), COVID-19 Origins (Unproven)

**Unsolved Mysteries** (8): Amelia Earhart, D.B. Cooper, Jack the Ripper, The Zodiac Killer, Flight MH370, The Dyatlov Pass Incident, The Voynich Manuscript, The Lost Colony of Roanoke (all Unsolved)

**Hidden History** (4): Project MKUltra, Operation Northwoods, The Dancing Plague of 1518, The Great Emu War (all Actually True)

**Strange Places & Phenomena** (3): The Bermuda Triangle (Debunked), The Loch Ness Monster (Unproven), The Tunguska Event (Actually True)

COVID-19 Origins is the one file on a moving topic: re-check the latest official assessments now and then.

---

## Run it locally

Browsers block data files when a page is opened straight from disk (`file://`), so start a tiny local server in this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

---

## What's where

```
index.html          00 The archive, opened (3D wall of every photo) · 01 Where to, detective? (scroll reel)
                    · Today's pulls · Four verdicts · Every case file · Your clearance
story.html          ONE template for every story (story.html?id=dyatlov-pass)
explore.html        Search + filters (drawer, verdict, rabbit hole level); filters live in the URL
people.html         Who's Who: every person in every file, A–Z, filter by role; each opens a role-styled dossier
library-card.html   Clearance ID card, stamped files, drawer progress, ranks, wax seals
about.html          Ground rules, verdicts, levels, credits
404.html            "This case file has gone missing"

data/stories.json        Every story lives here
data/achievements.json   Seal rules (data, not code)

assets/js/config.js   Site name, drawers, verdicts, levels, clearance ranks, fallback photo
assets/js/app.js      Shared: data, top bar, Case Index, themes, progress, clearance, seals, random
assets/js/home.js     The wall, the reel, homepage sections
assets/js/story.js    Story page: hero, gallery, timeline, foil card, depth gauge, quiz, evidence wall
assets/js/dossier.js  Persons of interest: roster, role-styled dossiers, phone bottom sheet
assets/js/people.js   The Who's Who page
assets/js/explore.js | library.js

assets/css/base.css        Tokens (Archive + Manuscript), type, top bar, Case Index, footer, toasts
assets/css/components.css  Wall, reel, spotlight, stamps, cards, clearance, explore, library, seals
assets/css/story.css       Story page
assets/css/people.css      Roster, the nine dossier designs, Who's Who, names marquee

assets/svg/   Custom illustrations (e.g. dyatlov-pass-slope.svg)
```

---

## Rename the site

Change `name` (and `tagline`) in [`assets/js/config.js`](assets/js/config.js). The top bar, footer, Case Index and every page title read from it. The `<title>` tags in the HTML files are only fallbacks.

---

## Add a new story

Adding a story means adding **one object** to the `stories` array in [`data/stories.json`](data/stories.json). The homepage wall, the reel, search, the Case Index, random, progress and seals all pick it up automatically. Copy an existing entry as a starting point.

| Field | Required | What it is |
|---|---|---|
| `id` | ✓ | URL slug: `"db-cooper"` → `story.html?id=db-cooper` |
| `caseNo` | ✓ | Case number (sets the order). Shown as "Case 013" |
| `title` | ✓ | Title. Wrap one word in `*asterisks*` to set it in gold serif italic: `"D.B. *Cooper*"` |
| `hook` | ✓ | One-line hook (used on cards and in search) |
| `category` | ✓ | `conspiracy-theories`, `unsolved-mysteries`, `hidden-history` or `strange-places` |
| `verdict` | ✓ | `debunked`, `unproven`, `unsolved` or `true` |
| `verdictNote` |  | One line of nuance next to the stamp |
| `rabbitHoleLevel` | ✓ | 1 (shallow) to 5 (bottomless) |
| `depthNote` |  | Extra line in "How deep does this go?" |
| `readMinutes`, `year`, `location.name`, `tags` |  | Shown in the facts strip / used by search and sorting |
| `featured` |  | `true` puts it in the homepage "Featured file" slot |
| `draft` |  | `true` hides it everywhere |
| `hero` |  | The main photograph (see **Images**) |
| `gallery` |  | More photographs, shown as a "From the file" film strip (tap to enlarge) and added to the homepage wall |
| `illustrations` |  | Inline SVG figures (see **Custom illustrations**) |
| `story` | ✓ | 3–5 paragraphs: hook → build the mystery → what we actually know |
| `timeline` | ✓ | `{ "date": "1959-02-26", "label": "...", "detail": "..." }`. Dates: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`; `"dateLabel"` overrides the display text; `"year"` overrides the year marker (e.g. `"240 BC"`) |
| `known` | ✓ | "What we know" points |
| `speculation` | ✓ | "What's speculation" points, each saying how well the theory holds up |
| `whyPeopleWonder` | ✓ | Paragraph(s) on the psychology/history. The first is shown as a serif pull quote |
| `funFact` | ✓ | One surprising, *true* fact (shown as a foil trading card) |
| `quiz` | ✓ | 2–3 of `{ "q", "options": [...], "answer": 0, "explain" }` (`answer` is the index from 0) |
| `sources` | ✓ | `{ "title", "publisher", "url", "year"?, "type"? }`: Wikipedia + 1–2 reputable sources (`"type": "paper"` for journals) |
| `people` |  | Everyone involved, shown as "Who's who" on the story and on the Who's Who page (see **People**) |
| `related` | ✓ | Story ids for the evidence wall. Ids not written yet show as a redacted "CLASSIFIED" polaroid |
| `factCheck` |  | Story-level notes for the reviewer |

Story text supports `**bold**` and `*italic*`, nothing else.

**Writing rules (the accuracy promise):** stick to well-documented dates, names and numbers; say so in the text when something is disputed; theories never go in `known`; the verdict follows the best evidence, not the most exciting option.

---

## People (Who's who)

Each story can list everyone involved. Every person gets a **role**, and each role opens its own dossier design and colour:

| `role` | Shown as | Design |
|---|---|---|
| `victim` | In memoriam | Quiet, centred memorial page with a candle glow |
| `suspect` | Suspect | Red file with a hazard stripe and fingerprint |
| `witness` | Witness | Yellow testimony slip, ruled like a notebook |
| `survivor` | Survivor | Green, with a heartbeat line |
| `investigator` | Investigator | Blue credential with a badge |
| `expert` | Expert | Teal graph-paper findings |
| `source` | Theory source | Orange "where the theory came from", with broadcast rings |
| `official` | Official | Purple official record with a ribboned seal |
| `keeper` | Keeper | Bronze provenance chain (owners of an object) |

```json
"people": [{
  "name": "Ralph Himmelsbach",
  "role": "investigator",
  "life": "1925 – 2019",
  "tag": "FBI special agent",
  "status": "Led the manhunt",
  "summary": "Two or three sentences about who they were and why they matter.",
  "quote": { "text": "...", "by": "Ralph Himmelsbach, 1986" },
  "facts": ["Optional extra points"],
  "photo": { "src": "https://upload.wikimedia.org/...", "w": 600, "h": 800, "credit": "...", "license": "Public domain", "focus": "50% 25%" },
  "sort": "Himmelsbach",
  "factCheck": "Optional note for review mode"
}]
```

Only `name`, `role` and `summary` are required. Leave out `life` when the dates aren't confirmed. `sort` sets the A–Z letter on the Who's Who page for names like "The crew of Flight 19". Roles, labels and colours live in `config.js` (`roles`).

---

## Fact-check flags and review mode

Any detail you're not fully sure about gets a `factCheck` note. Turn a string into an object to flag it:

```json
{ "text": "Footprints led about 1.5 km downhill.", "factCheck": "Some sources say 1–1.5 km." }
```

You can flag items in `story`, `known`, `speculation`, `whyPeopleWonder`, `funFact`, any `timeline` event, `hero`, any `gallery` image or any person in `people`, or add story-level notes in `"factCheck": [...]`.

Readers never see these. **To review, add `&review=1` to a story's address** (`story.html?id=dyatlov-pass&review=1`): a yellow banner lists every flag and each flagged detail is highlighted. Delete the note once you've verified it.

---

## Images

Only **Wikimedia Commons** images (public domain or a free licence), credited on the page.

```json
"hero": {
  "src": "https://upload.wikimedia.org/wikipedia/commons/9/98/Aldrin_Apollo_11_original.jpg",
  "w": 3912, "h": 3936,
  "alt": "What's in the photo, for screen readers",
  "caption": "One line of context",
  "credit": "Neil Armstrong / NASA",
  "license": "Public domain",
  "licenseUrl": "https://...",
  "sourceUrl": "https://commons.wikimedia.org/wiki/File:Aldrin_Apollo_11_original.jpg",
  "focus": "50% 35%",
  "layout": "full"
}
```

- Use the **original** `upload.wikimedia.org` URL plus its width `w` and height `h` (both are on the file's Commons page). The site then asks Wikimedia for the right-sized thumbnail automatically, so phones never download a 4,000-pixel original.
- `focus` (optional) is the CSS `object-position` for cropping.
- `layout`: small or portrait photos are shown **framed** like a photo pinned in a dossier. Big landscape photos go **full** screen. It's automatic; set `"full"` or `"framed"` to override.
- In a `gallery`, add `"fit": "contain"` for documents, maps and pages that shouldn't be cropped.
- To check a licence, look at the "Licensing" box on the file's Commons page. If Commons flags it as doubtful, add a `factCheck` note to the image.
- No photo? Leave `hero` out: cards show an initial instead, and drawers fall back to `fallbackImage` in `config.js`.

### Custom illustrations

Put an SVG in `assets/svg/` and reference it:

```json
"illustrations": [{
  "src": "assets/svg/my-map.svg", "after": "story",
  "title": "Evidence board: the route", "caption": "Simplified sketch, not to scale.",
  "alt": "Text description for screen readers",
  "legend": ["What pin 1 marks", "What pin 2 marks"]
}]
```

Keep illustrations editorial: thin lines, numbered pins and a `legend`, never cartoons. They're inlined, so they follow both themes if you use the shared classes in `story.css` (`svg-bg`, `svg-ink`, `svg-mute`, `svg-line`, `svg-gold-stroke`, `svg-red-stroke`, `svg-cat`…). `svg-draw` (set `style="--len:700"`) draws a path in, and `svg-pop` (`style="--d:1s"`) pops an element in.

---

## Progress, clearance and seals

Progress lives in `localStorage` in the reader's own browser. There are no accounts and no tracking.

- A file counts as **explored** when the reader reaches its Sources, finishes its quiz, or presses "Mark explored".
- **Clearance** rises with points: 100 per file explored, 20 per quiz, +40 for a perfect score, 5 per Random jump (up to 20), and 50 per seal. Ranks (Unclassified → Confidential → Secret → Top Secret → Codeword → Cosmic → Eyes Only) are in `config.js`.
- **Seals** are defined in [`data/achievements.json`](data/achievements.json):

| Rule | Example |
|---|---|
| `explored` | `{ "type": "explored", "count": 10 }` |
| `verdict` | `{ "type": "verdict", "verdict": "unsolved", "count": 5 }` |
| `category` | `{ "type": "category", "category": "hidden-history", "count": 3 }` |
| `level` | `{ "type": "level", "min": 5, "count": 1 }` |
| `quizPerfect` | `{ "type": "quizPerfect", "count": 5 }` |
| `random` | `{ "type": "random", "count": 3 }` |
| `everyCategory` | `{ "type": "everyCategory" }` |
| `all` | `{ "type": "all" }` |

A seal the archive can't support yet (for example "Truth Is Stranger" before any "Actually True" story exists) shows "Needs more case files".

---

## Deploy on GitHub Pages

1. Create a new repository on GitHub (e.g. `rabbit-hole-archive`).
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "First case files"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/rabbit-hole-archive.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. A minute later the site is live at `https://YOUR-USERNAME.github.io/rabbit-hole-archive/`.

Every later `git push` redeploys it. All links are relative, so a project sub-folder works fine. The empty `.nojekyll` file tells GitHub to serve the files as-is.
