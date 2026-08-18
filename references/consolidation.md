# Consolidation

A media agency spec sheet lists **line items** — one row per booking. A production deck needs **things a designer makes**. Those are not the same count, and the gap is usually large: 23 spreadsheet rows can be 12 actual deliverables.

Consolidate before building, then show the user what you merged and why. They will often adjust it, and that adjustment is cheap before the deck exists and expensive after.

**Consolidation only ever reduces the count.** Merging two rows into one slide is the whole job. Splitting one row into two slides is fine when the row genuinely covers two deliverables. Adding a slide for something no row mentions is not consolidation, it is invention — see the hard rule in SKILL.md.

## Merge rules

### Merge — identical technical specs, different destination
Two TV sales houses, both `.mxf` 1920 × 1080, 25 fps, −23 LUFS. One slide, both destinations listed in a middle-column block. One master file is produced.

> "Both broadcasters merged — technical requirements are identical, one master covers both."

### Merge — identical specs, different duration
A 20 s non-skippable and a 6 s bumper at the same resolution and codec. One frame, both durations in the caption: `sub: "Non-skippable 20 s + bumper 6 s"`.

### Merge — same creative reused across flights
Flight 1 and flight 2 requesting the same five asset groups. Show them once. Put the second flight's deadline in the guide column and the reuse note in the speaker notes. Do not produce ten slides for five deliverables.

### Merge — shared spec block, per-item variables
Five magazines, same trim, same bleed, same colour profile, different publication dates and order numbers. One slide with the shared spec in the guide column and a small `table` block for the variables.

### Merge — different aspect ratios of the same format
A 1:1 and a 9:16 brand image with the same file format and character limits. One slide, two frames side by side. The frames carry the difference; the guide carries what is shared.

## Keep separate

### Different file type
A JPG still and an MP4 video are different production jobs even at the same pixel size. Separate slides.

### Different character limits
If the carousel headline is 32 and the single-image headline is 27, they cannot share a guide column without one of the numbers being wrong. Separate slides, and flag the difference (see `crosscheck.md`).

### Different frame rate, colour space or loudness
These force separate renders. Merging them hides the fact that two masters are needed.

### A format whose frame would become invisible
A 300 × 60 companion banner next to a 1920 × 1080 video renders at about 3 % of the area. Give it its own slide, usually paired with the copy requirements it belongs to.

### Anything with its own safe-zone or margin rule
The rule needs its own overlay, and overlays do not read clearly when two frames on one slide have different ones.

## Deciding slide count

Aim for one slide per **thing a designer opens a file to make**. A useful test: if the designer would produce one artboard set and export from it once, that is one slide.

Typical shapes:

| Channel | Usual result |
|---|---|
| TV / broadcast | 1 slide per duration, all sales houses merged |
| Online instream | 1 slide, all platforms merged if specs match |
| Social stills | 1 slide per copy-limit group, aspect ratios side by side |
| Social video | 1 slide per duration |
| Carousel | Always its own slide — limits differ from stills |
| Display | 1 slide per device tier (desktop row, mobile row), or one slide with two rows |
| Print | 1 slide for the shared spec, publications in a table |
| Print digital companion | Its own slide — different file type and size cap |

Then add: cover, overview, schedule, findings. A 20–25 line-item campaign lands around 12–15 slides.

## Slides that are not formats

Three non-format slides earn their place in almost every deck:

- **Overview** — how many things exist per channel, and the first deadline. Read before anything else.
- **Schedule** — every deliverable sorted by deadline, not by channel. Channel order tells you nothing about what to do first.
- **Findings** — the cross-check output. See `crosscheck.md`.

A **safe-zone slide** earns its place whenever any channel has margin rules that affect composition. It is usually the most-used slide in the deck.

## What to tell the user

Present the consolidation as a short list before building:

```
Merging these:
· TV broadcaster A + B     → one slide (identical specs)
· Streaming A + B          → one slide (identical specs)
· Social flight 1 + 2      → shown once, flight 2 deadline in the guide
· 5 print magazines        → one slide + table of dates

Kept separate:
· Carousel — character limits differ from single images
· Companion banner — frame would disappear next to the video

13 slides total.
```

Together with the traceability list (each slide → its source rows). Then wait for a reaction before generating.
