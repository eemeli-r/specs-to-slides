---
name: specs-to-slides
description: Build a production spec deck from media agency material specifications. Use whenever the user has spreadsheets, PDFs or pasted lists of advertising formats and needs them turned into a PowerPoint where every format gets an aspect-ratio placeholder frame plus its technical rules — a deck meant to be imported into Canva so final artwork can be dropped onto each slide. Trigger on "production deck", "spec deck", "material specs deck", "ad format deck", "media agency specs", "spec sheet to slides", "make a deck of these formats", or when the user uploads media plan or spec files (rate cards, material guidelines, format specifications) and asks for a presentation. Also use to audit a spec list for conflicts, missing fields and deadline problems without building a deck.
license: MIT
---

# Specs to slides

Turns raw media agency material specifications into a designer-facing PowerPoint where **every deliverable is one aspect-ratio placeholder frame plus its rules**. The deck is a production checklist, not a pitch: it goes into Canva, and finished artwork gets dropped onto the frames.

## Hard rule: nothing enters the deck that is not in the source

The deck is a contract between the media agency's spec and the designer's output. A format that appears on a slide will be produced and billed. So:

- **Every frame must trace to a line item in the source material.** If the agency did not book it, it does not get a frame — no matter how obviously the platform supports it.
- **Never add a "standard" size.** Meta supports 4:5; if the sheet lists only 1:1 and 9:16, the deck has 1:1 and 9:16. The same goes for extra display sizes, extra durations, extra language versions.
- **Never fill a blank spec field from general knowledge.** A missing frame rate stays missing. It goes on the findings slide as a question, not into the guide column as if the agency had specified it.
- **Never present platform best practice as a spec.** "Reels UI covers the top and bottom of a 9:16 placement" is true and useful, but if the source does not say it, it belongs on the findings slide as *"spec is silent on safe zones — confirm with the agency"*, not in the MATERIAL SPECS list where it reads as a client requirement.
- **A gap is a finding, not a slide.** Noticing that no 1:1 video is listed is valuable. Adding a 1:1 video frame is not — it invents scope.

Guide-column bullets should be traceable to source text almost word for word. Condensing and translating is fine; adding is not.

**Before building, verify traceability.** List each planned slide against the source row(s) it came from and show the user:

```
Slide 3  TV spot 10 s          ← rows 1–2  (broadcaster A, broadcaster B)
Slide 4  Instream 10 s         ← rows 3–4  (streaming A, streaming B)
Slide 5  Online video          ← rows 5–7
Slide 9  Findings              ← no source row (cross-check output)
```

Any slide that cannot name its source row is either a findings slide or a mistake.

## When to use

Use when the input is a set of advertising material specs — spreadsheets, PDFs, a pasted list — and the output should be a deck a designer works from. Also use for the audit alone ("check these specs for problems") without producing a file.

Do not use for pitch decks, report decks or anything where the slides are argument rather than specification. Use the `pptx` skill for those.

## Workflow

Four phases, in order. Do not skip to phase 4.

### Phase 1 — Extract

Read every source file. Never guess a spec that exists in a file you have not opened.

```bash
python3 scripts/extract_specs.py <path-to-folder-or-file>
```

The script handles `.xlsx` (all worksheets, plus dropdown lists, conditional-format thresholds and cell fill colours — character limits and colour pickers hide there), `.pdf` (text layer via `pdftotext -layout`), and reports true pixel dimensions and file sizes of any images so delivered assets can be checked against the specs they claim to meet.

Rules that cost time when ignored:

- **Read every worksheet.** Template files routinely carry specs the instruction PDF omits.
- **Character limits often live in conditional formatting**, not in cell text. The script prints them.
- **Colour pickers live in data validation lists**, not in cell values.
- **A file named `900x900.jpg` is not proof it is 900×900.** The script measures.

If a source is a PDF diagram whose numbers are only in the text layer, the extracted text still contains them — read the raw dump rather than assuming the diagram is unreadable.

### Phase 2 — Consolidate

Group deliverables into slides. Read `references/consolidation.md` for the full rules. The short version:

- **Identical technical specs → one slide.** Two TV sales houses with the same `.mxf` spec are one slide listing both destinations, not two slides.
- **Same spec, different duration → one slide, two durations on the caption.**
- **Same creative reused across flights → show it once**, note the second flight's deadline in the guide column.
- **Different aspect ratio → separate frame on the same slide** (frames sit side by side), not a separate slide.
- **A shared spec block with per-item variables** (five magazines, same trim, different deadlines) → one slide plus a small table of the variables.

Consolidation only ever **reduces** the deck. It never creates a deliverable that was not in the source.

Always propose the consolidation and the traceability list to the user, and let them adjust before building.

### Phase 3 — Cross-check

Run `references/crosscheck.md` against the extracted specs. Report findings before building, not after. The checks that repeatedly catch real problems:

- deadlines already passed or within days of today
- frame rates, colour spaces or loudness that differ between channels sharing one creative
- delivered assets whose real dimensions or file size miss their spec
- character limits exceeded by copy already filled into the template
- character limits that differ between formats in the same channel
- specs that are simply blank in the source
- specs that are technically obsolete (e.g. Type 1 fonts, deprecated codecs)
- format/container combinations that are unusual for the placement
- formats the media plan implies but the spec sheet does not list

Report these as flags, not corrections. The user decides what to escalate to the client.

### Phase 4 — Build

Write a config JSON, then run the generator:

```bash
node scripts/build_deck.js deck.json "Output name.pptx"
```

`references/deck-schema.md` documents every field. `assets/example-deck.json` is a complete working example — copy it and edit rather than writing from scratch.

Then QA, which is not optional:

```bash
python3 scripts/office/validate.py "Output name.pptx"     # from the pptx skill, if available
soffice --headless --convert-to pdf "Output name.pptx"
pdftoppm -jpeg -r 110 output.pdf slide
```

View every rendered slide. The defects this layout produces are always the same three: a text block colliding with a frame that grew taller than expected, a caption wrapping into the footer, and a right-column list running past the bottom margin. Fix in the config, rebuild, re-render.

## Design system

Fixed and deliberately neutral. The deck carries no brand of its own — the artwork dropped onto it does. Do not tint the palette toward a client's brand colours; the same deck template is used across clients.

| Token | Value | Use |
|---|---|---|
| `bg` | `F1F1F1` | Slide background |
| `card` | `FFFFFF` | Cards, callouts |
| `brand` | `1C1C1C` | Titles, labels, table headers, numbered bullets |
| `ink` | `3A3A3A` | Body text |
| `muted` | `6B6B6B` | Captions, eyebrows, footers |
| `frame` | `D0D0D0` | Placeholder frames |
| `frameDark` | `A8A8A8` | Cropped, covered or bleed regions |
| `safe` | `FFFFFF` | Safe zones, usable area |
| `hairline` | `C9C9C9` | Legend swatch outline |
| `font` | Arial | Everything |

The greys are ordered by meaning: **darker = more covered, lighter = more yours**. `frameDark` is the region that crops away or gets an overlay, `frame` is the artwork area, `safe` is where text and logos can live. Keep that order if you ever adjust the values.

`brand` is named for the config key, not for a client brand — it is near-black. Overriding it is supported for a one-off, but the default should stay neutral.

**Arial is the default for a reason.** It ships with every Office install, exists in Canva, and renders at identical widths in LibreOffice — so QA previews tell the truth about text overflow. Swap it only if the user asks, and warn them that a font not installed locally will substitute in PowerPoint and may substitute again on Canva import.

Slide size is `LAYOUT_WIDE` (13.3 × 7.5 in). Layout geometry is in `references/layout.md`.

### The frame rule

**Frames are drawn to true relative scale within a slide, not just true aspect ratio.** A 120 × 120 logo next to a 900 × 900 banner is genuinely small; a 310 × 446 mobile banner is genuinely half of a 620 × 891 desktop one. `build_deck.js` computes one shared px→inch factor per row. This is the single detail that makes the deck useful rather than decorative — do not "fix" it by making frames equal size.

## Canva import

The deck is imported to Canva and artwork is dragged onto the frames. This constrains the design:

- **Every frame is a plain rectangle**, no rounded corners, no borders, no shadows — so a dropped image covers it cleanly.
- **Nothing overlaps a frame** except deliberate overlays (safe zones, crop areas, margin bands), which the user deletes in Canva before dropping artwork.
- **Keep text out of frames.** In-frame labels like "Headline goes here" are the only exception and should be rare.
- Tables and text boxes survive Canva import; gradients and shadows do not reliably. The design uses neither.

## Language

**The deck is written in English**, including UI labels (`MATERIAL SPECS`, `Duration`, `Delivery`).

Source material is often in another language — media agency spec sheets frequently are. Translate the spec text into English for the deck, but **keep technical tokens in their original form**: `1080 × 1920 px`, `.mxf`, `H.264`, `−23 LUFS`, `CMYK`, `300 dpi`. Never translate a filename, an order number, a publication name or a delivery address — those are identifiers and have to match what the agency sent.

Use `×` (U+00D7) between dimensions, not the letter `x`, and `−` (U+2212) for negative values such as `−23 LUFS`.

## Speaker notes

Every slide gets `addNotes()` with the reasoning a designer needs but that does not fit on the slide: why two formats were merged, which source rows a slide covers, which spec was missing from the source. These survive Canva import as notes and are where the audit trail lives.
