# TimeLineX
by Siavash Ameli

[![GitHub Stars](https://img.shields.io/github/stars/siavashameli/TimelineX?style=social)](https://github.com/siavashameli/TimelineX)

 
Instead of a folder or graph view, notes are placed on a **timeline** based on
a `date` property in their frontmatter, and grouped into named timelines
(e.g. "History of Wars", "History of Science") that can be overlaid,
filtered, recolored, and viewed solo — and dragged directly on the canvas to
retime them.

Also timelineX support smart conversian of different calendars!


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

**Toolbar** (top of the main panel):
- **Calendar dropdown** — switch the axis labels between Gregorian, Hijri
  Shamsi, and Hijri Qamari
- **Zoom dropdown** — jump straight to a preset 
- **Zoom slider** — continuous zoom from 0% to 100% 

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


## Support this project
 
If TimeLineX is useful to you, the easiest way to say thanks costs nothing:
⭐ **star the repo** and share it with someone who organizes notes by date.
 
If you'd like to go further, donations are very welcome and directly fund
continued development.
 
- Crypto donations (USDT, ERC20)
 
```
0xA89121cF251B7bfdE908E697B0e447809b35C061
```
 
⚠️ **Send USDT only, only on the ETH (ERC20) network**
 
- 💚 [Support with IRR or Euro](https://hamibash.com/sivashameli)

