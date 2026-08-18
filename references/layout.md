# Layout

Slide canvas is `LAYOUT_WIDE`: **13.3 × 7.5 inches**. All coordinates below are inches.

## Grid

| Constant | Value | Meaning |
|---|---|---|
| `ML` | 0.72 | Left margin, everything starts here |
| `MR` | 12.58 | Right edge of content |
| `COL_R` | 8.95 | Left edge of the right-hand guide column |
| `COL_RW` | 3.63 | Width of the guide column |
| `AREA_W` | 7.85 | Width available to frames (ML → 8.57) |
| `FRAME_TOP` | 2.32 | Default top edge of a frame row |
| `FOOT_Y` | 6.95 | Footer baseline |

Vertical rhythm on a content slide:

```
0.42  eyebrow          11.5pt, muted, charSpacing 1.6
0.72  title            33pt bold, brand
1.62  guide heading    (right column)
1.98  block label      (middle column, if used)
2.32  frame row top    frame labels sit at top − 0.34
      ...
6.95  footer           9pt muted, right-aligned
```

Keep 0.5" clear of every slide edge. The bottom of the last element should not pass 6.8.

## The frame row

`frameRow()` draws every frame in a row using **one shared px→inch factor**:

```
k = min( maxH / tallestPxHeight , (availW − gaps) / sumOfPxWidths )
```

So the row is bounded by whichever runs out first, height or width, and every frame keeps its true size relative to its neighbours. Frames are top-aligned; captions sit under each frame at its own height, which is why the caption baselines are staggered. That is intentional.

**Only put frames in the same row when their sizes are meaningfully comparable.** A 2000 × 2000 source image next to a 1080 × 1080 delivery size is fine (it shows the source is bigger). A 1920 × 1080 TV frame next to a 300 × 60 companion banner is not — the banner becomes invisible. Split those across slides or give the small one its own row with a smaller `availW`.

### Sizing a row

`availW` is the lever. A single wide frame with `availW: 4.6` fills roughly a third of the slide and leaves the middle column free. Rules of thumb:

| Frames | `availW` | `maxH` | Leaves room for |
|---|---|---|---|
| 1 wide (16:9) | 4.6 | 3.0 | Middle column at x ≥ 5.6 |
| 1 tall (9:16) | 2.0–2.6 | 3.4 | Middle column at x ≥ 3.3 |
| 2 mixed | 5.0–5.6 | 3.2 | Middle column at x ≥ 6.2 |
| 3 mixed | 6.4–7.0 | 3.3 | Guide column only |
| 4+ | 7.85 | 3.3 | Guide column only |

Check the arithmetic before rendering: a 9:16 frame at `maxH: 3.4` ends at `2.32 + 3.4 = 5.72`, and its caption runs to about 6.3. Anything you place below 5.7 on that slide will collide.

## Slide types

### `cover`
Eyebrow / title / subtitle / meta lines on the left, an optional frame pair on the right at x 9.05. No footer; use `note` for a bottom-right line instead.

### `overview`
2–4 equal cards across the full width. Card title, subtitle, bulleted lines, italic note pinned to the card's bottom. Set `cardHeight` to just fit the content — the most common defect on this slide is a card with 2 inches of dead space under the bullets.

### `format`
The workhorse. Frames on the left, optional free-positioned `blocks` in the middle, `guide` list on the right. One slide per deliverable (or per group of deliverables sharing a spec).

### `table`
Full-width table, optional `highlight` band. Use for schedules, order numbers, character-limit comparisons.

### `cards`
2 or 3 per row, numbered by default. Use for the findings slide.

## Middle column blocks

Blocks take explicit `x` / `y` / `w`. There is no auto-layout — that is deliberate, because the middle column has to dodge whatever height the frames ended up at. Available kinds: `heading`, `label`, `text`, `list`, `cards`, `grid`, `legend`, `callout`, `table`.

Typical middle-column start positions:

- Next to one tall frame: `x: 3.3`
- Next to two frames: `x: 5.5`–`6.2`
- Full width under the frames: `x: 0.72`, `y` ≥ frame bottom + 0.7

## The three defects this layout produces

Look for these first in every visual QA pass. They account for nearly every fix:

1. **A block collides with a frame that grew taller than expected.** The frame's height comes from `k`, not from a fixed number, so changing `availW` moves the bottom edge. Recompute before placing anything below a frame.
2. **A caption wraps into the next element.** Default caption width is `frameWidth + gap − 0.1`. A narrow frame with a long `sub` line wraps to three lines. Set `capW` explicitly.
3. **The guide list runs past 6.8.** Ten bullets at 10.5pt with wrapping is about 5.2 inches. If the list is longer, cut it, move an item into a `callout`, or split the slide.

## Overlays

Overlays paint on top of a frame to show a region rather than a size.

| Type | Draws | Use for |
|---|---|---|
| `safearea` | Inset rectangle in the safe colour | Social safe zones, publisher frame areas |
| `margins` | Dark bands at bottom/top/sides, in px of the frame's own size | Overlay text areas, crop margins |
| `bleed` | Three nested rectangles: bleed → trim → safe | Print ads |
| `crop` | Dark sides, light centre | Responsive crop on mobile |

Always pair an overlay with a `legend` block so the colours mean something.

## Typography

| Element | Size | Weight | Colour |
|---|---|---|---|
| Cover title | 54 | bold | brand |
| Slide title | 33 | bold | brand |
| Eyebrow | 11.5 | regular, charSpacing 1.6 | muted |
| Frame label | 11.5 | regular | brand |
| Caption line 1 | 10 | bold | ink |
| Caption line 2 | 9.5 | regular | muted |
| Guide heading | 11.5 | bold, charSpacing 1.2 | brand |
| Guide items | 10.5 | regular | ink |
| Table body | 10.5 | regular | ink |
| Footer | 9 | regular | muted |

Do not add accent lines under titles, colour bars, or edge stripes. Whitespace and the background tint carry the structure.

## Colour

The palette is neutral by design — the deck carries no brand, the artwork dropped onto it does.

| Token | Value | Meaning |
|---|---|---|
| `bg` | `F1F1F1` | Slide background |
| `card` | `FFFFFF` | Cards, callouts |
| `brand` | `1C1C1C` | Titles, labels, table headers (near-black, not a client colour) |
| `ink` | `3A3A3A` | Body text |
| `muted` | `6B6B6B` | Captions, eyebrows, footers |
| `frame` | `D0D0D0` | Placeholder frames |
| `frameDark` | `A8A8A8` | Cropped, covered or bleed regions |
| `safe` | `FFFFFF` | Safe zones, usable area |
| `hairline` | `C9C9C9` | Legend swatch outline |

The three frame greys are ordered by meaning: **darker = more covered, lighter = more yours**. Preserve that order if the values are ever adjusted, because the overlays depend on it being readable without a caption.

Legend swatches carry a `hairline` outline so a white `safe` swatch stays visible against a light background.
