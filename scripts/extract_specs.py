#!/usr/bin/env python3
"""Extract material specifications from media agency source files.

Handles .xlsx (all sheets + dropdowns + conditional-format thresholds + fill
colours), .pdf (text layer), and measures real dimensions of images so a
delivered asset can be checked against the spec it claims to meet.

Deliberately uses only the standard library plus optional Pillow, because
openpyxl/pandas are frequently unavailable in sandboxes.

Usage:
    python3 extract_specs.py <file-or-folder> [...]
    python3 extract_specs.py <folder> --images-only
"""

import os
import re
import sys
import zipfile
import subprocess
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff"}
SHEET_EXT = {".xlsx", ".xlsm", ".xltx"}


# ───────────────────────────────────────────────────────────── xlsx

def _shared_strings(z):
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter(NS + "t")) for si in root.findall(NS + "si")]


def _sheet_names(z):
    """Map worksheet part name -> visible sheet name."""
    names = {}
    try:
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rmap = {r.get("Id"): r.get("Target") for r in rels}
        for s in wb.iter(NS + "sheet"):
            target = rmap.get(s.get(RNS + "id"), "").lstrip("/").replace("xl/", "")
            names["xl/" + target] = s.get("name")
    except Exception:
        pass
    return names


def _fill_palette(z):
    """cellXfs index -> ARGB fill colour, for colour-picker swatches."""
    try:
        st = ET.fromstring(z.read("xl/styles.xml"))
    except Exception:
        return {}
    fills = []
    for f in st.find(NS + "fills").findall(NS + "fill"):
        pf = f.find(NS + "patternFill")
        c = pf.find(NS + "fgColor") if pf is not None else None
        fills.append(c.get("rgb") if c is not None and c.get("rgb") else None)
    xfs = [x.get("fillId") for x in st.find(NS + "cellXfs").findall(NS + "xf")]
    out = {}
    for i, fid in enumerate(xfs):
        try:
            rgb = fills[int(fid)]
        except (TypeError, ValueError, IndexError):
            rgb = None
        if rgb and rgb.upper() not in ("FFFFFFFF", "00000000"):
            out[str(i)] = rgb
    return out


def dump_xlsx(path):
    z = zipfile.ZipFile(path)
    shared = _shared_strings(z)
    names = _sheet_names(z)
    palette = _fill_palette(z)

    print(f"\n{'#' * 70}\n# XLSX: {path}\n{'#' * 70}")

    for part in sorted(n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", n)):
        raw = z.read(part)
        root = ET.fromstring(raw)
        print(f"\n=== {part}  |  {names.get(part, '?')} ===")

        for row in root.iter(NS + "row"):
            cells = []
            for c in row.findall(NS + "c"):
                v = c.find(NS + "v")
                if v is None or v.text is None:
                    continue
                val = shared[int(v.text)] if c.get("t") == "s" else v.text
                if val:
                    cells.append(val)
            if cells:
                print(" | ".join(cells))

        text = raw.decode("utf-8", errors="ignore")

        # Dropdown lists — colour pickers and option sets hide here
        for m in re.findall(r"<dataValidation[^>]*>.*?</dataValidation>|<dataValidation[^>]*/>", text, re.S):
            sq = re.search(r'sqref="([^"]+)"', m)
            f1 = re.search(r"<formula1>(.*?)</formula1>", m, re.S)
            if f1:
                print(f"  [DROPDOWN {sq.group(1) if sq else '?'}] {f1.group(1)}")

        # Conditional formatting — character limits usually live here
        for m in re.findall(r"<conditionalFormatting.*?</conditionalFormatting>", text, re.S):
            sq = re.search(r'sqref="([^"]+)"', m)
            rules = []
            for r in re.findall(r"<cfRule[^>]*operator=\"([^\"]+)\"[^>]*>(.*?)</cfRule>", m, re.S):
                nums = re.findall(r"<formula>([^<]+)</formula>", r[1])
                if nums:
                    rules.append(f"{r[0]} {' & '.join(nums)}")
            if rules:
                print(f"  [CHAR LIMIT {sq.group(1) if sq else '?'}] {' | '.join(rules)}")

        # Fill colours actually used on this sheet
        used = {}
        for c in root.iter(NS + "c"):
            s = c.get("s")
            if s in palette:
                used.setdefault(palette[s], []).append(c.get("r"))
        for rgb, refs in used.items():
            print(f"  [FILL COLOUR] #{rgb[-6:]}  in cells {', '.join(refs[:8])}"
                  f"{' ...' if len(refs) > 8 else ''}")

    z.close()


# ───────────────────────────────────────────────────────────── pdf

def dump_pdf(path):
    print(f"\n{'#' * 70}\n# PDF: {path}\n{'#' * 70}")
    try:
        out = subprocess.run(["pdftotext", "-layout", path, "-"],
                             capture_output=True, text=True, timeout=120)
        if out.returncode == 0 and out.stdout.strip():
            print(out.stdout)
            return
        print(f"[pdftotext returned an empty result: {out.stderr.strip()[:200]}]")
    except FileNotFoundError:
        print("[pdftotext is missing — install poppler-utils]")
    except Exception as e:
        print(f"[pdftotext failed: {e}]")
    print("[If the PDF is scanned, run OCR first or read it as an image.]")


# ───────────────────────────────────────────────────────────── images

def _png_size(p):
    with open(p, "rb") as f:
        h = f.read(33)
    if h[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not png")
    return int.from_bytes(h[16:20], "big"), int.from_bytes(h[20:24], "big")


def _jpg_size(p):
    with open(p, "rb") as f:
        d = f.read()
    i = 2
    sof = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
    while i < len(d) - 8:
        if d[i] != 0xFF:
            i += 1
            continue
        m = d[i + 1]
        if m in sof:
            return int.from_bytes(d[i + 7:i + 9], "big"), int.from_bytes(d[i + 5:i + 7], "big")
        if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
            i += 2
            continue
        i += 2 + int.from_bytes(d[i + 2:i + 4], "big")
    raise ValueError("no SOF marker")


def image_size(p):
    try:
        from PIL import Image
        with Image.open(p) as im:
            return im.size
    except ImportError:
        pass
    except Exception:
        pass
    ext = os.path.splitext(p)[1].lower()
    if ext == ".png":
        return _png_size(p)
    if ext in (".jpg", ".jpeg"):
        return _jpg_size(p)
    raise ValueError(f"unsupported: {ext}")


# "900x900", "900 x 900", "900-x-900", "1440_x_960", "900×900"
CLAIM_RE = re.compile(r"(\d{2,5})\s*[-_ ]?\s*[x×]\s*[-_ ]?\s*(\d{2,5})", re.I)


def dump_images(paths, root=None):
    if not paths:
        return
    print(f"\n{'#' * 70}\n# IMAGE FILES — real dimensions\n{'#' * 70}")
    print(f"{'size':>13}  {'bytes':>9}  file")
    flags = []
    for p in sorted(paths):
        kb = os.path.getsize(p) / 1024
        try:
            w, h = image_size(p)
            dims = f"{w}×{h}"
        except Exception as e:
            dims = f"?({e})"
            w = h = None
        try:
            rel = os.path.relpath(p, root) if root else p
        except ValueError:
            rel = p
        line = f"{dims:>13}  {kb:>7.0f} kB  {rel}"
        # A filename that claims a size the file does not have
        claim = CLAIM_RE.search(os.path.basename(p))
        if claim and w:
            cw, ch = int(claim.group(1)), int(claim.group(2))
            if (cw, ch) != (w, h):
                line += f"   <-- MISMATCH: filename claims {cw}×{ch}"
                flags.append(f"{os.path.basename(p)}: filename says {cw}×{ch}, actual {w}×{h}")
        print(line)
    if flags:
        print("\n[!] CHECK THESE:")
        for f in flags:
            print(f"    · {f}")


# ───────────────────────────────────────────────────────────── driver

def walk(target):
    if os.path.isfile(target):
        return [target]
    found = []
    for root, dirs, files in os.walk(target):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in sorted(files):
            if not f.startswith(".") and not f.startswith("~$"):
                found.append(os.path.join(root, f))
    return found


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if not args:
        print(__doc__)
        sys.exit(1)

    files = []
    for t in args:
        files.extend(walk(t))

    images = [f for f in files if os.path.splitext(f)[1].lower() in IMAGE_EXT]

    if "--images-only" not in flags:
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in SHEET_EXT:
                try:
                    dump_xlsx(f)
                except Exception as e:
                    print(f"\n[XLSX failed {f}: {e}]")
            elif ext == ".pdf":
                dump_pdf(f)

    root = args[0] if len(args) == 1 and os.path.isdir(args[0]) else None
    dump_images(images, root)

    skipped = [f for f in files
               if os.path.splitext(f)[1].lower() not in SHEET_EXT | IMAGE_EXT | {".pdf"}]
    if skipped:
        print(f"\n[Not parsed ({len(skipped)}): "
              + ", ".join(os.path.basename(s) for s in skipped[:12])
              + (" ..." if len(skipped) > 12 else "") + "]")


if __name__ == "__main__":
    main()
