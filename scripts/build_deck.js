#!/usr/bin/env node
/**
 * specs-to-slides — build a production spec deck from a JSON config.
 *
 *   node build_deck.js deck.json "Output.pptx"
 *
 * See references/deck-schema.md for the full schema and
 * assets/example-deck.json for a working example.
 */

const fs = require("fs");
const pptxgen = require("pptxgenjs");

// ── theme ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  font: "Arial",
  brand: "1C1C1C",     // titles, labels, table headers, numbered bullets
  bg: "F1F1F1",        // slide background
  ink: "3A3A3A",       // body text
  muted: "6B6B6B",     // captions, eyebrows, footers
  frame: "D0D0D0",     // placeholder frames
  frameDark: "A8A8A8", // cropped / covered regions
  safe: "FFFFFF",      // safe zones, usable area
  card: "FFFFFF",      // cards and callouts
  hairline: "C9C9C9"   // legend swatch outline, so a white swatch stays visible
};

// ── geometry (inches, LAYOUT_WIDE = 13.3 × 7.5) ──────────────────────────
const ML = 0.72;        // left margin
const MR = 12.58;       // right edge of content
const COL_R = 8.95;     // right-hand guide column x
const COL_RW = 3.63;    // right-hand guide column width
const AREA_W = 7.85;    // width available to frames
const FRAME_TOP = 2.32; // default top of a frame row
const FOOT_Y = 6.95;

function build(cfg, outFile) {
  const T = Object.assign({}, DEFAULTS, cfg.theme || {});
  const F = T.font;
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = cfg.title || "Production spec deck";
  pres.author = cfg.author || "";

  let pageNo = 0;

  const slide = () => {
    const s = pres.addSlide();
    s.background = { color: T.bg };
    return s;
  };

  const header = (s, eyebrow, title) => {
    if (eyebrow) s.addText(eyebrow, {
      x: ML, y: 0.42, w: 8.0, h: 0.28, fontFace: F, fontSize: 11.5,
      color: T.muted, charSpacing: 1.6, margin: 0, valign: "middle"
    });
    if (title) s.addText(title, {
      x: ML, y: 0.72, w: 9.6, h: 0.62, fontFace: F, fontSize: 33, bold: true,
      color: T.brand, margin: 0, valign: "middle"
    });
  };

  const footer = (s, custom) => {
    pageNo += 1;
    const base = cfg.footer ? `${cfg.footer}  ·  ${pageNo}` : String(pageNo);
    s.addText(custom || base, {
      x: 8.5, y: FOOT_Y, w: 4.08, h: 0.28, fontFace: F, fontSize: 9,
      color: T.muted, align: "right", margin: 0, valign: "middle"
    });
  };

  const guide = (s, g) => {
    if (!g) return;
    const y0 = g.y !== undefined ? g.y : 1.62;
    s.addText(g.heading || "MATERIAL SPECS", {
      x: COL_R, y: y0, w: COL_RW, h: 0.26, fontFace: F, fontSize: 11.5, bold: true,
      color: T.brand, charSpacing: 1.2, margin: 0, valign: "middle"
    });
    s.addText(
      g.items.map((t, i) => ({
        text: t,
        options: {
          bullet: { code: "2022", indent: 14 },
          breakLine: i < g.items.length - 1,
          paraSpaceAfter: 5
        }
      })),
      {
        x: COL_R, y: y0 + 0.36, w: COL_RW, h: 4.9, fontFace: F, fontSize: g.size || 10.5,
        color: T.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.08
      }
    );
  };

  // ── frame overlays ─────────────────────────────────────────────────────
  const overlays = {
    // { type:"safearea", top:0.14, bottom:0.20, sides:0.046 }  fractions of frame
    safearea(s, o, x, y, w, h) {
      const sd = o.sides || 0, tp = o.top || 0, bt = o.bottom || 0;
      s.addShape(pres.ShapeType.rect, {
        x: x + w * sd, y: y + h * tp,
        w: w * (1 - 2 * sd), h: h * (1 - tp - bt),
        fill: { color: T.safe }, line: { type: "none" }
      });
    },
    // { type:"margins", bottom:148, sides:76, label:"..." }  px of the frame's own size
    margins(s, o, x, y, w, h) {
      const pw = (o.px && o.px.w) || 1, ph = (o.px && o.px.h) || 1;
      const b = h * ((o.bottom || 0) / ph), sd = w * ((o.sides || 0) / pw);
      const t = h * ((o.top || 0) / ph);
      if (b) s.addShape(pres.ShapeType.rect, { x, y: y + h - b, w, h: b, fill: { color: T.frameDark }, line: { type: "none" } });
      if (t) s.addShape(pres.ShapeType.rect, { x, y, w, h: t, fill: { color: T.frameDark }, line: { type: "none" } });
      if (sd) {
        s.addShape(pres.ShapeType.rect, { x, y: y + t, w: sd, h: h - b - t, fill: { color: T.frameDark }, line: { type: "none" } });
        s.addShape(pres.ShapeType.rect, { x: x + w - sd, y: y + t, w: sd, h: h - b - t, fill: { color: T.frameDark }, line: { type: "none" } });
      }
      if (o.label && b) s.addText(o.label, {
        x: x + sd, y: y + h - b, w: w - 2 * sd, h: b, fontFace: F,
        fontSize: o.labelSize || 9, color: "4A4A4A", align: "center", valign: "middle", margin: 0
      });
    },
    // { type:"bleed", doc:{w,h}, bleed:5, safe:5 }  — all in mm
    bleed(s, o, x, y, w, h) {
      const dw = (o.doc && o.doc.w) || 1, dh = (o.doc && o.doc.h) || 1;
      const bx = w * ((o.bleed || 0) / dw), by = h * ((o.bleed || 0) / dh);
      const sx = w * ((o.safe || 0) / dw), sy = h * ((o.safe || 0) / dh);
      s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: T.frameDark }, line: { type: "none" } });
      s.addShape(pres.ShapeType.rect, {
        x: x + bx, y: y + by, w: w - 2 * bx, h: h - 2 * by,
        fill: { color: T.frame }, line: { type: "none" }
      });
      if (o.safe) s.addShape(pres.ShapeType.rect, {
        x: x + bx + sx, y: y + by + sy, w: w - 2 * (bx + sx), h: h - 2 * (by + sy),
        fill: { color: T.safe }, line: { type: "none" }
      });
    },
    // { type:"crop", visible:0.5, label:"Visible area" }
    crop(s, o, x, y, w, h) {
      const v = o.visible || 0.5;
      s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: T.frameDark }, line: { type: "none" } });
      s.addShape(pres.ShapeType.rect, {
        x: x + w * (1 - v) / 2, y, w: w * v, h,
        fill: { color: T.frame }, line: { type: "none" }
      });
      if (o.label) s.addText(o.label, {
        x: x + w * (1 - v) / 2, y, w: w * v, h, fontFace: F, fontSize: 9,
        color: "4A4A4A", align: "center", valign: "middle", margin: 0
      });
    }
  };

  /**
   * A row of placeholder frames drawn to TRUE relative scale.
   * One shared px→inch factor for the whole row, so a 120×120 logo really is
   * small next to a 900×900 banner. Do not change this to equal-size frames.
   */
  const frameRow = (s, items, opts = {}) => {
    if (!items || !items.length) return;
    const top = opts.top !== undefined ? opts.top : FRAME_TOP;
    const maxH = opts.maxH !== undefined ? opts.maxH : 3.4;
    const availW = opts.availW !== undefined ? opts.availW : AREA_W;
    const left = opts.left !== undefined ? opts.left : ML;
    const gap = opts.gap !== undefined ? opts.gap : 0.42;

    const maxPxH = Math.max(...items.map(i => i.h));
    const sumPxW = items.reduce((a, i) => a + i.w, 0);
    const k = Math.min(maxH / maxPxH, (availW - gap * (items.length - 1)) / sumPxW);

    let x = left;
    items.forEach(it => {
      const fw = it.w * k, fh = it.h * k;
      if (it.label) s.addText(it.label, {
        x, y: top - 0.34, w: Math.max(fw, 1.15), h: 0.28,
        fontFace: F, fontSize: 11.5, color: T.brand, margin: 0, valign: "middle"
      });
      s.addShape(pres.ShapeType.rect, { x, y: top, w: fw, h: fh, fill: { color: T.frame }, line: { type: "none" } });

      if (it.overlay) {
        const fn = overlays[it.overlay.type];
        if (fn) fn(s, Object.assign({ px: { w: it.w, h: it.h } }, it.overlay), x, top, fw, fh);
        else console.warn(`  ! unknown overlay: ${it.overlay.type}`);
      }

      const cap = [it.caption, it.sub].filter(Boolean);
      if (cap.length) s.addText(
        cap.map((t, i) => ({
          text: t,
          options: {
            breakLine: i < cap.length - 1, bold: i === 0,
            color: i === 0 ? T.ink : T.muted, fontSize: i === 0 ? 10 : 9.5
          }
        })),
        { x, y: top + fh + 0.11, w: it.capW || Math.max(fw + gap - 0.1, 1.5), h: 0.6, fontFace: F, margin: 0, valign: "top" }
      );
      x += fw + gap;
    });
  };

  const mkTable = (s, t) => {
    const hdr = txt => ({ text: txt, options: { bold: true, color: "FFFFFF", fill: { color: T.brand } } });
    const rows = [t.headers.map(hdr), ...t.rows];
    s.addTable(rows, {
      x: t.x !== undefined ? t.x : ML,
      y: t.y !== undefined ? t.y : 1.95,
      w: t.w || (MR - ML),
      colW: t.colW,
      fontFace: F, fontSize: t.size || 10.5, color: T.ink, valign: "middle",
      border: { type: "solid", color: T.bg, pt: 2 },
      fill: { color: T.card }, rowH: t.rowH || 0.42, margin: [4, 10, 4, 10]
    });
  };

  // ── blocks: free-positioned extras in the middle column ────────────────
  const blocks = {
    heading(s, b) {
      s.addText(b.text, {
        x: b.x, y: b.y, w: b.w || 3.2, h: 0.28, fontFace: F, fontSize: b.size || 10,
        bold: true, color: b.color === "muted" ? T.muted : T.brand,
        charSpacing: 1.3, margin: 0, valign: "middle"
      });
    },
    label(s, b) {
      s.addText(b.text, {
        x: b.x, y: b.y, w: b.w || 3.2, h: 0.28, fontFace: F, fontSize: b.size || 11.5,
        color: T.brand, margin: 0, valign: "middle"
      });
    },
    text(s, b) {
      s.addText(b.text, {
        x: b.x, y: b.y, w: b.w || 3.2, h: b.h || 0.6, fontFace: F, fontSize: b.size || 10,
        italic: !!b.italic, color: T[b.color] || T.muted,
        margin: 0, valign: "top", lineSpacingMultiple: 1.12
      });
    },
    // { kind:"list", lines:[{label,value}] }  small label above a bold value
    list(s, b) {
      const runs = [];
      b.lines.forEach((l, i) => {
        const last = i === b.lines.length - 1;
        if (l.label) runs.push({ text: l.label, options: { breakLine: true, color: T.muted, fontSize: 9.5 } });
        runs.push({ text: l.value, options: { breakLine: !last, bold: l.bold !== false, color: T.ink, fontSize: b.size || 11 } });
      });
      s.addText(runs, { x: b.x, y: b.y, w: b.w || 3.0, h: b.h || 2.3, fontFace: F, margin: 0, valign: "top", lineSpacingMultiple: 1.22 });
    },
    // { kind:"cards", count:3, size:0.85 }  carousel motif, trailing partial card
    cards(s, b) {
      const n = b.count || 3, sz = b.size || 0.85, pitch = sz + (b.gap || 0.1);
      for (let i = 0; i < n; i++) {
        s.addShape(pres.ShapeType.rect, {
          x: b.x + i * pitch, y: b.y, w: sz, h: b.height || sz,
          fill: { color: T.frame }, line: { type: "none" }
        });
      }
      if (b.partial !== false) s.addShape(pres.ShapeType.rect, {
        x: b.x + n * pitch, y: b.y, w: sz * 0.33, h: b.height || sz,
        fill: { color: T.frameDark }, line: { type: "none" }
      });
    },
    // { kind:"grid", cols:4, rows:2, size:0.72 }  product grid motif
    grid(s, b) {
      const sz = b.size || 0.72, pitch = sz + (b.gap || 0.14);
      for (let r = 0; r < (b.rows || 2); r++)
        for (let c = 0; c < (b.cols || 4); c++)
          s.addShape(pres.ShapeType.rect, {
            x: b.x + c * pitch, y: b.y + r * pitch, w: sz, h: sz,
            fill: { color: T.frame }, line: { type: "none" }
          });
    },
    // { kind:"legend", items:[{swatch:"safe"|"frame"|"frameDark", text}] }
    legend(s, b) {
      const step = b.step || 0.35;
      b.items.forEach((it, i) => {
        const y = b.horizontal ? b.y : b.y + i * step;
        const x = b.horizontal ? b.x + i * (b.hstep || 3.1) : b.x;
        s.addShape(pres.ShapeType.rect, {
          x, y: y + 0.04, w: 0.22, h: 0.22,
          fill: { color: T[it.swatch] || T.frame },
          line: { color: T.hairline, width: 0.75 }
        });
        s.addText(it.text, { x: x + 0.33, y, w: b.w || 3.0, h: 0.3, fontFace: F, fontSize: 9.5, color: T.ink, margin: 0, valign: "middle" });
      });
    },
    // { kind:"callout", title, body }  white box for a rule that must not be missed
    callout(s, b) {
      const w = b.w || 5.0, h = b.h || 1.5;
      s.addShape(pres.ShapeType.rect, { x: b.x, y: b.y, w, h, fill: { color: T.card }, line: { type: "none" } });
      if (b.title) s.addText(b.title, { x: b.x + 0.3, y: b.y + 0.18, w: w - 0.6, h: 0.38, fontFace: F, fontSize: 14, bold: true, color: T.brand, margin: 0, valign: "middle" });
      if (b.body) s.addText(b.body, { x: b.x + 0.3, y: b.y + (b.title ? 0.58 : 0.2), w: w - 0.6, h: h - (b.title ? 0.75 : 0.4), fontFace: F, fontSize: 10.5, color: T.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.12 });
    },
    table(s, b) { mkTable(s, b); }
  };

  const drawBlocks = (s, list) => (list || []).forEach(b => {
    const fn = blocks[b.kind];
    if (fn) fn(s, b);
    else console.warn(`  ! unknown block: ${b.kind}`);
  });

  // ── slide types ────────────────────────────────────────────────────────
  const renderers = {
    cover(s, d) {
      if (d.eyebrow) s.addText(d.eyebrow, { x: ML, y: 2.28, w: 9, h: 0.3, fontFace: F, fontSize: 12.5, color: T.muted, charSpacing: 2, margin: 0, valign: "middle" });
      s.addText(d.title, { x: ML, y: 2.66, w: 9, h: 1.0, fontFace: F, fontSize: d.titleSize || 54, bold: true, color: T.brand, margin: 0, valign: "middle" });
      if (d.subtitle) s.addText(d.subtitle, { x: ML, y: 3.72, w: 9, h: 0.5, fontFace: F, fontSize: 22, color: T.brand, margin: 0, valign: "middle" });
      if (d.meta && d.meta.length) s.addText(
        d.meta.map((t, i) => ({ text: t, options: { breakLine: i < d.meta.length - 1, fontSize: 12, color: i === 0 ? T.ink : T.muted } })),
        { x: ML, y: 4.5, w: 6, h: 1.0, fontFace: F, margin: 0, valign: "top", lineSpacingMultiple: 1.3 }
      );
      frameRow(s, d.frames, Object.assign({ top: 2.6, maxH: 2.8, availW: 3.5, left: 9.05, gap: 0.36 }, d.frameOpts));
      drawBlocks(s, d.blocks);
      if (d.note) s.addText(d.note, { x: 8.5, y: FOOT_Y, w: 4.08, h: 0.28, fontFace: F, fontSize: 9, color: T.muted, align: "right", margin: 0, valign: "middle" });
    },

    overview(s, d) {
      header(s, d.eyebrow, d.title);
      const n = d.cards.length;
      const gap = 0.28;
      const cw = ((MR - ML) - gap * (n - 1)) / n;
      const ch = d.cardHeight || 3.5;
      d.cards.forEach((c, i) => {
        const x = ML + i * (cw + gap);
        s.addShape(pres.ShapeType.rect, { x, y: 1.95, w: cw, h: ch, fill: { color: T.card }, line: { type: "none" } });
        s.addText(c.title, { x: x + 0.28, y: 2.18, w: cw - 0.56, h: 0.38, fontFace: F, fontSize: n > 3 ? 16 : 19, bold: true, color: T.brand, margin: 0, valign: "middle" });
        if (c.subtitle) s.addText(c.subtitle, { x: x + 0.28, y: 2.57, w: cw - 0.56, h: 0.26, fontFace: F, fontSize: 10, color: T.muted, margin: 0, valign: "middle" });
        if (c.lines) s.addText(
          c.lines.map((t, k) => ({ text: t, options: { bullet: { code: "2022", indent: 12 }, breakLine: k < c.lines.length - 1, paraSpaceAfter: 6 } })),
          { x: x + 0.28, y: 2.97, w: cw - 0.5, h: ch - 1.75, fontFace: F, fontSize: 10, color: T.ink, margin: 0, valign: "top" }
        );
        if (c.note) s.addText(c.note, { x: x + 0.28, y: 1.95 + ch - 0.62, w: cw - 0.5, h: 0.5, fontFace: F, fontSize: 9.5, italic: true, color: T.muted, margin: 0, valign: "top" });
      });
      if (d.note) s.addText(d.note, { x: ML, y: 1.95 + ch + 0.28, w: MR - ML, h: 0.35, fontFace: F, fontSize: 11, color: T.brand, margin: 0, valign: "middle" });
      drawBlocks(s, d.blocks);
    },

    format(s, d) {
      header(s, d.eyebrow, d.title);
      frameRow(s, d.frames, d.frameOpts || {});
      drawBlocks(s, d.blocks);
      if (d.table) mkTable(s, d.table);
      guide(s, d.guide);
      if (d.note) s.addText(d.note, { x: ML, y: d.noteY || 6.2, w: d.noteW || (MR - ML), h: 0.5, fontFace: F, fontSize: 10, italic: !!d.noteItalic, color: T.muted, margin: 0, valign: "top", lineSpacingMultiple: 1.1 });
    },

    table(s, d) {
      header(s, d.eyebrow, d.title);
      mkTable(s, Object.assign({ y: 1.9 }, d.table));
      drawBlocks(s, d.blocks);
      if (d.highlight) {
        const y = d.highlightY || 6.15;
        s.addShape(pres.ShapeType.rect, { x: ML, y, w: MR - ML, h: 0.6, fill: { color: T.card }, line: { type: "none" } });
        s.addText(d.highlight, { x: ML + 0.3, y, w: MR - ML - 0.6, h: 0.6, fontFace: F, fontSize: 11.5, bold: true, color: T.brand, margin: 0, valign: "middle" });
      }
      guide(s, d.guide);
    },

    cards(s, d) {
      header(s, d.eyebrow, d.title);
      const perRow = d.perRow || 3;
      const gap = 0.26;
      const cw = ((MR - ML) - gap * (perRow - 1)) / perRow;
      const ch = d.cardHeight || 1.9;
      d.cards.forEach((c, i) => {
        const x = ML + (i % perRow) * (cw + gap);
        const y = (d.top || 1.9) + Math.floor(i / perRow) * (ch + 0.25);
        s.addShape(pres.ShapeType.rect, { x, y, w: cw, h: ch, fill: { color: T.card }, line: { type: "none" } });
        if (d.numbered !== false) {
          s.addShape(pres.ShapeType.ellipse, { x: x + 0.28, y: y + 0.26, w: 0.32, h: 0.32, fill: { color: T.brand }, line: { type: "none" } });
          s.addText(String(i + 1), { x: x + 0.28, y: y + 0.26, w: 0.32, h: 0.32, fontFace: F, fontSize: 10.5, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
        }
        const tx = d.numbered === false ? x + 0.3 : x + 0.72;
        const tw = cw - (d.numbered === false ? 0.6 : 1.0);
        s.addText(c.title, { x: tx, y: y + 0.2, w: tw, h: 0.46, fontFace: F, fontSize: perRow > 2 ? 12 : 13.5, bold: true, color: T.brand, margin: 0, valign: "middle" });
        s.addText(c.body, { x: tx, y: y + 0.72, w: tw, h: ch - 0.85, fontFace: F, fontSize: perRow > 2 ? 9.5 : 10.5, color: T.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.1 });
      });
      if (d.note) s.addText(d.note, { x: ML, y: d.noteY || 6.2, w: MR - ML, h: 0.5, fontFace: F, fontSize: 10, color: T.muted, margin: 0, valign: "top", lineSpacingMultiple: 1.1 });
      drawBlocks(s, d.blocks);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────
  (cfg.slides || []).forEach((d, i) => {
    const fn = renderers[d.type];
    if (!fn) throw new Error(`Slide ${i + 1}: unknown type "${d.type}"`);
    const s = slide();
    fn(s, d);
    if (d.type !== "cover") footer(s, d.footer);
    if (d.notes) s.addNotes(d.notes);
  });

  return pres.writeFile({ fileName: outFile }).then(f => {
    console.log(`Written: ${f}  (${(cfg.slides || []).length} slides)`);
    return f;
  });
}

// ── cli ──────────────────────────────────────────────────────────────────
if (require.main === module) {
  const [cfgPath, out] = process.argv.slice(2);
  if (!cfgPath) {
    console.error("Usage: node build_deck.js <config.json> [output.pptx]");
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  build(cfg, out || cfg.output || "production-deck.pptx").catch(e => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
}

module.exports = { build };
