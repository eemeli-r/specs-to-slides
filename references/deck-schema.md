# Deck config schema

`build_deck.js` takes one JSON file. Copy `assets/example-deck.json` and edit it — it exercises every slide type, block kind and overlay.

```bash
node scripts/build_deck.js deck.json "Output.pptx"
```

## Top level

```jsonc
{
  "title":  "Campaign — production spec deck",  // pptx metadata
  "author": "",
  "footer": "Campaign  ·  Autumn 2026",         // footer text; page number appended
  "output": "fallback.pptx",              // used if no CLI arg
  "theme":  { "font": "Arial" },
  "slides": [ /* ... */ ]
}
```

### `theme`

All optional. Hex **without** `#`, 6 digits — a leading `#` or an 8-digit value corrupts the file.

| Key | Default | Use |
|---|---|---|
| `font` | `Arial` | Everything. See the warning in SKILL.md before changing. |
| `brand` | `1C1C1C` | Titles, labels, table headers, numbered bullets. Near-black — the key is named for the config, not for a client brand. |
| `bg` | `F1F1F1` | Slide background |
| `ink` | `3A3A3A` | Body text |
| `muted` | `6B6B6B` | Captions, eyebrows, footers |
| `frame` | `D0D0D0` | Placeholder frames |
| `frameDark` | `A8A8A8` | Crop/margin/bleed areas |
| `safe` | `FFFFFF` | Safe zones |
| `card` | `FFFFFF` | Card and callout backgrounds |
| `hairline` | `C9C9C9` | Legend swatch outline |

The palette is neutral on purpose — the deck carries no brand, the artwork does. The three frame greys are ordered darker → lighter as more-covered → more-yours; keep that order if you change them.

## Common slide fields

Every slide takes `type`, `notes` (speaker notes, always write them) and optionally `footer` to override the footer line.

## `cover`

```jsonc
{
  "type": "cover",
  "eyebrow": "PRODUCTION SPECS · AUTUMN 2026",
  "title": "Campaign name",
  "titleSize": 54,                       // drop to 44 for long titles
  "subtitle": "Material requirements by channel",
  "meta": ["Social · Display · Print", "Campaign period 1 Sep – 31 Oct 2026"],
  "frames": [ { "label": "9:16", "w": 1080, "h": 1920 } ],
  "note": "First deadline 21 Aug 2026"       // bottom-right, replaces footer
}
```

`meta[0]` renders in ink, the rest in muted.

## `overview`

```jsonc
{
  "type": "overview",
  "eyebrow": "OVERVIEW",
  "title": "Deliverables",
  "cardHeight": 3.4,                     // tune until the note sits just under the bullets
  "cards": [
    { "title": "Social", "subtitle": "3 asset groups",
      "lines": ["Brand image 1:1", "Brand image 9:16"],
      "note": "Same assets for both flights" }
  ],
  "note": "Line under all cards"
}
```

2–4 cards. Card width is computed from the count; at 4 the title drops to 16 pt automatically.

## `format`

```jsonc
{
  "type": "format",
  "eyebrow": "SOCIAL",
  "title": "Brand images",
  "frames": [ /* see below */ ],
  "frameOpts": { "top": 2.32, "maxH": 3.2, "availW": 5.2, "gap": 0.5, "left": 0.72 },
  "blocks": [ /* see below */ ],
  "table":  { /* see below */ },
  "guide":  { "heading": "MATERIAL SPECS", "items": ["..."], "y": 1.62, "size": 10.5 },
  "note": "Footnote", "noteY": 6.2, "noteW": 7.4, "noteItalic": true
}
```

### `frames[]`

```jsonc
{
  "label": "9:16",                  // shown above the frame; omit for no label
  "w": 1080, "h": 1920,             // px, mm, or any unit — only the ratio and
                                    // relative magnitude within the row matter
  "caption": "1080 × 1920 px",      // bold, ink
  "sub": "JPG / PNG · 1–2 images",   // regular, muted
  "capW": 2.6,                      // caption width; set when the default wraps badly
  "overlay": { /* see below */ }
}
```

Frames in one row share a single px→inch factor. Mixing wildly different magnitudes makes the small one unreadable — see `consolidation.md`.

### `overlay`

```jsonc
// Safe zone — fractions of the frame
{ "type": "safearea", "top": 0.14, "bottom": 0.20, "sides": 0.046 }

// Margin bands — px of the frame's own w/h
{ "type": "margins", "bottom": 148, "sides": 76, "top": 0,
  "label": "Headline goes here", "labelSize": 9 }

// Print bleed → trim → safe, all mm
{ "type": "bleed", "doc": { "w": 240, "h": 307 }, "bleed": 5, "safe": 5 }

// Responsive crop
{ "type": "crop", "visible": 0.5, "label": "Visible area" }
```

Always add a `legend` block so the colours are explained.

### `blocks[]`

Every block takes explicit `x`, `y` and usually `w`, in inches. No auto-layout — the middle column has to dodge whatever height the frames ended up at.

```jsonc
{ "kind": "heading", "text": "CHARACTER LIMITS", "x": 6.2, "y": 1.98, "w": 2.5,
  "color": "muted" }                      // small caps label; default colour brand

{ "kind": "label", "text": "3–7 cards", "x": 5.5, "y": 1.98 }
                                          // same size as a frame label

{ "kind": "text", "text": "...", "x": 3.6, "y": 4.0, "w": 5.0, "h": 0.6,
  "size": 10, "italic": true, "color": "muted" }   // color: ink | muted | brand

{ "kind": "list", "x": 6.2, "y": 2.32, "w": 2.5,
  "lines": [ { "label": "Headline", "value": "max. 27 characters" } ] }

{ "kind": "cards", "x": 5.5, "y": 2.32, "count": 3, "size": 0.85,
  "gap": 0.1, "partial": true }           // carousel motif with a clipped 4th card

{ "kind": "grid", "x": 4.1, "y": 2.32, "cols": 4, "rows": 2, "size": 0.72 }

{ "kind": "legend", "x": 0.72, "y": 6.12, "w": 2.7,
  "horizontal": true, "hstep": 3.1, "step": 0.35,
  "items": [ { "swatch": "safe", "text": "Free area" } ] }
                                          // swatch: frame | frameDark | safe

{ "kind": "callout", "x": 3.3, "y": 2.32, "w": 5.2, "h": 1.5,
  "title": "Strong hook within the first second", "body": "..." }

{ "kind": "table", "x": 3.5, "y": 3.86, "w": 5.2, /* + table fields */ }
```

### `table`

```jsonc
{
  "headers": ["Magazine", "Published", "Material due"],
  "rows": [ ["Magazine A", "9 Sep 2026", "21 Aug 2026"] ],
  "colW": [2.2, 1.2, 1.0],               // must sum to w
  "x": 0.72, "y": 1.95, "w": 4.4,
  "size": 10.5, "rowH": 0.42
}
```

Headers are styled automatically (white bold on brand). Do not pass styled cells.

## `table` slide

```jsonc
{
  "type": "table",
  "eyebrow": "PRODUCTION",
  "title": "Schedule and delivery",
  "table": { "headers": [...], "rows": [...], "colW": [...] },
  "highlight": "First deadline is 21 Aug 2026.",
  "highlightY": 6.15,                    // set below the table's last row
  "guide": { /* optional */ }
}
```

`highlightY` does not auto-position. Compute it: `tableY + (rows + 1) × rowH + 0.15`.

## `cards` slide

```jsonc
{
  "type": "cards",
  "eyebrow": "PRODUCTION",
  "title": "Findings and open questions",
  "perRow": 3,                           // 2 or 3
  "cardHeight": 1.9,
  "top": 1.9,
  "numbered": true,
  "cards": [ { "title": "...", "body": "..." } ],
  "note": "Footnote", "noteY": 6.2
}
```

Six cards at `perRow: 3` fill the slide exactly. Card titles wrap to two lines at around 30 characters — keep them shorter or raise `cardHeight`.

## Gotchas

- **Hex colours: no `#`, exactly 6 digits.** `"#1C1C1C"` and `"1C1C1C20"` both corrupt the file.
- **`colW` must sum to `w`**, or the table renders at the wrong width.
- **Never reuse an options object** between two `add*` calls — pptxgenjs mutates them in place. The generator already builds fresh objects; keep it that way if you extend it.
- **Speaker notes go in `notes`**, never in a text box on the slide.
- **`×` is U+00D7**, not the letter `x`. Same for `−` (U+2212) in `−23 LUFS`.
- Run `validate.py` after every build. It catches the slide XML defects PowerPoint refuses to open.
