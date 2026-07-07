# TimeLineX (for Obsidian)

**Author:** Siavash Ameli

[![GitHub Stars](https://img.shields.io/github/stars/siavashameli/TimelineX?style=social)](https://github.com/siavashameli/TimelineX)
 
An Obsidian plugin that organizes and visualizes notes chronologically across
multiple overlaid timelines — with Gregorian, Hijri Shamsi (Persian),
and Hijri Qamari (Islamic) calendar support.
 
Instead of a folder or graph view, notes are placed on a **timeline** based on
a `date` property in their frontmatter, and grouped into named timelines
(e.g. "History of Wars", "History of Science") that can be overlaid,
filtered, recolored, and viewed solo — and dragged directly on the canvas to
retime them.
 
## Support this project
 
If TimeLineX is useful to you, the easiest way to say thanks costs nothing:
⭐ **star the repo** and share it with someone who organizes notes by date.
 
If you'd like to go further, donations are very welcome and directly fund
continued development.
 
### Crypto donations (USDT, ERC20)
 
```
0xA89121cF251B7bfdE908E697B0e447809b35C061
```
 
⚠️ **Send USDT only, only on the ETH (ERC20) network**, to the address
above. Sending USDT on a different network (TRC20, BEP20, etc.), or sending
a different asset entirely, can result in permanent loss of funds. If
you're not sure your wallet supports ERC20, check before sending.
 
### Other options
 
- 💚 [Support with IRR or Euro](https://hamibash.com/sivashameli)

## Why this design

Obsidian already gives you a local-first Markdown vault, a full editor, and
`[[wiki-links]]` — so this plugin doesn't reinvent any of that. It only adds:

1. A way to read `date` / `timeline` properties from your notes' frontmatter.
2. A live index (rebuilt from Obsidian's metadata cache — no separate
   database needed).
3. A "Master Timeline" view that renders those notes on a zoomable,
   scrollable, editable axis, with per-timeline show/hide, solo view, and
   custom colors.

## Note format

Add frontmatter properties to any note to place it on the timeline:

```yaml
---
date: 1685
date_end: 1815
timeline: History of Philosophy
---
```

- `date` — required. Accepts a bare year (`1945`, or `-531` for 531 BCE), or
  a full date `1945-05-09`.
- `date_end` — optional. Add this to make the note a range/duration instead
  of a single point.
- `timeline` — required. The name of the timeline this note belongs to
  (timelines are created automatically the first time they're used —
  there's nothing to set up in advance).
- `calendar` — optional. Set to `persian` or `hijri` if the `date`/`date_end`
  values above are written in that calendar rather than Gregorian. Internally
  everything is converted to a shared representation so timelines with mixed
  calendars still line up correctly.

You can also run the command **"TimeLineX: Set date & timeline for
this note"** (or `Cmd/Ctrl+P` → search "TimeLineX") to fill these in through a
small form instead of editing frontmatter by hand.

## Using the view

Click the clock icon in the ribbon, or run **"TimeLineX: Open timeline
view"**, to open the Master Timeline.

**Left sidebar** — every detected timeline, each with:
- A **color swatch** (click it to open your OS color picker and assign any
  color to that timeline).
- Its note count.
- A **crosshair icon** for Solo view (focus on just that one timeline).
- An **eye icon** to show/hide it in the overlay.

**Toolbar** (top of the main panel):
- **Calendar dropdown** — switch the axis labels between Gregorian, Hijri
  Shamsi, and Hijri Qamari (full names, not abbreviations).
- **Zoom dropdown** — jump straight to a preset (`All (fit)`, `1000 yr`,
  `100 yr`, `10 yr`, `1 yr`, `Quarter`, `Month`, `Week`, `Day`).
- **Zoom slider** — continuous zoom from 0% (the whole timeline fits in
  view) to 100% (~7 days visible). Both controls drive the same underlying
  zoom, so using one updates the other.

**On the canvas itself:**
- **Mouse wheel** zooms in/out centered on your cursor (like Photoshop's
  scroll-to-zoom). **Shift + wheel** pans horizontally instead.
- **Drag an event pill** to move it — this rewrites its `date`/`date_end`
  frontmatter to match.
- **Drag the left/right edge of a range event** to stretch or shrink it,
  adjusting only the start or only the end date.
- **Click** an event (without dragging) to open its note.
- A dashed red line marks **today**.

## Smart timeline length

A timeline's (or the overlay's) visible span is computed automatically: it
starts **1 year before its earliest note's date** and ends **1 year after
its latest note's date (or `date_end`)**. There's nothing to configure —
add or edit dated notes and the axis adjusts on its own.

## Safety net for drag edits

Dragging writes straight to a note's frontmatter, so there are two layers of
protection against a stray drag:

- **Confirm before saving** (on by default, toggle it off in Settings) —
  after you release a drag, a small "Save / Cancel" bar appears next to the
  event instead of writing immediately. Clicking away also cancels.
- **Undo toast** — once a change is saved (either via that confirmation, or
  immediately if you've turned confirmation off), a Notice appears with an
  "Undo" link that reverts the date(s) back.

## Creating notes from the timeline

**Double-click an empty spot** on any timeline's row to create a new note
right there — a small form asks for a title (date, timeline, and calendar
are pre-filled from where you clicked), then creates the `.md` file with
the right frontmatter and opens it.

## Managing timelines

Click the **⋮ (more actions)** icon on any timeline in the sidebar for:
- **Rename timeline…** — updates the `timeline` property on every note in
  that timeline at once.
- **Merge into…** — reassigns every note from this timeline into another
  existing one.
- **Delete timeline (keep notes)** — clears the `timeline` property from
  all its notes (their dates are untouched; they'll show up under the
  "missing a timeline" hint below, ready to be reassigned).

## Missing-data hints

If a note has a `date` but no `timeline`, or a `timeline` but no `date`, it
won't appear on any timeline — but it won't be silently lost either. The
sidebar footer shows a count for each case; click it to see and jump to the
affected notes.

## Installing into your vault

This plugin ships as source (TypeScript), like the official Obsidian sample
plugin, so it needs a one-time build step:

```bash
cd timelinex
npm install
npm run build
```

This produces `main.js` alongside `manifest.json` and `styles.css`. Then:

1. Create a folder named `timelinex` inside your vault's
   `.obsidian/plugins/` directory.
2. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
3. In Obsidian, go to **Settings → Community plugins**, disable
   **Restricted mode** if needed, and enable **TimeLineX**.

(If you'd rather develop live, run `npm run dev` instead of `npm run build` —
it watches for changes and rebuilds `main.js` automatically.)

A pre-built `main.js` is already included in this download, so you can skip
the build step and go straight to copying the three files into your vault.

## Known limitations (MVP scope)

- **Hijri conversion is arithmetic (tabular/civil), not observational** — it
  can differ by a day or two from a moon-sighting-based religious calendar.
  Fine for chronological visualization; not meant for liturgical use.
- **Very large vaults**: the current index re-scans all markdown files'
  cached frontmatter on every change. This is fast (metadata cache lookups,
  no disk I/O) for the vast majority of vaults, but hasn't been
  stress-tested at the PRD's "10,000 dated notes at 60fps" target — that
  would be a good next step (windowed/virtualized rendering) if you outgrow
  the MVP.
- **Undo is single-step and time-limited** — the Undo toast only reverts the
  one most recent drag, and disappears after ~8 seconds. For anything
  older than that, Obsidian's own file history / your version control tool
  is the real safety net.
- There's no separate "single timeline" widget — solo view reuses the same
  overlay renderer filtered to one timeline, which keeps the codebase small
  but means it doesn't have bespoke solo styling yet.

## Project structure

```
timelinex/
  manifest.json         Obsidian plugin manifest
  main.ts                Plugin entry point (commands, ribbon icon, settings)
  main.js                Pre-built bundle (ready to drop into your vault)
  styles.css             All view styling
  src/
    calendars.ts          Gregorian / Persian / Hijri conversion math
    types.ts              Shared types + zoom levels + color palette
    settings.ts           Settings shape & defaults
    settingsTab.ts         Settings UI
    timelineIndex.ts        Scans vault frontmatter into timeline groups;
                             rename/merge/clear-timeline operations
    timelineView.ts          The ItemView: sidebar + zoomable/draggable canvas
    modals.ts                New-note, rename, merge, confirm, and
                              orphan-list modals
```
