# Cross-check

Run this against the extracted specs **before** building the deck. Report findings to the user; do not silently correct a spec. The client owns the spec — the designer's job is to notice when it is wrong.

Everything here has actually caught a problem in real spec sheets.

The output of this phase is a list of **questions and flags**, never a set of corrections applied to the deck. See the hard rule in SKILL.md: findings go on the findings slide, not into the spec.

## 1. Time

- [ ] **Compare every deadline to today's date.** Get today from `date`, not from memory. A deadline three days out changes what gets produced first, and a deadline already passed needs a phone call, not a slide.
- [ ] **Check the header deadline against the per-item deadlines.** Spec sheets often carry a summary deadline on the header row that disagrees with the individual rows. The earliest individual date is the real one.
- [ ] **Check publication date vs. material date.** A material deadline after the publication date is a transcription error.
- [ ] **Order the schedule slide by date, not by channel.** Channel order hides which thing is urgent.

## 2. Delivered assets vs. their spec

`extract_specs.py` measures every image and flags filenames that claim a size the file does not have.

- [ ] **Real pixel dimensions** against the required size. A file called `..._900-x-900_.jpg` being 720 × 720 is a real case, not a hypothetical.
- [ ] **File size** against the cap. Note when a file is far *under* a recommended range too — a 6 kB logo against a 10–30 kB recommendation may mean it was exported too small.
- [ ] **Colour mode** — an RGBA PNG where a print CMYK PDF is required, or vice versa.
- [ ] **Aspect ratio** against the stated ratio, in case the pixel dimensions and the ratio label disagree.

## 3. Specs that conflict with each other

- [ ] **Frame rate across channels sharing one creative.** 25 fps for broadcast and 30 fps for a video platform means two renders, not one master. This is the most commonly missed conflict.
- [ ] **Loudness targets.** −23 LUFS for broadcast against a platform that normalises to roughly −14.
- [ ] **Colour space.** Rec.709 vs sRGB vs CMYK across the same campaign.
- [ ] **Character limits that differ between formats in the same channel.** Carousel headline 32 vs single-image headline 27; carousel link text 18 vs single 30. Copy has to be written twice.
- [ ] **The same pixel size with different file-size caps** in different placements. One design, two exports.
- [ ] **Container and codec combinations that are unusual for the placement.** `.mxf` with H.264 for online instream, for example — broadcast container, web codec. Usually means a row was copied from the TV spec.

## 4. Blanks

List every spec field that exists in the template but is empty. **A blank stays blank.** Do not fill it from platform documentation, from a sibling channel's spec, or from experience — an invented value reads as a client requirement and gets produced against. These are the questions to send back:

- RGB / colour levels on broadcast specs
- Audio codec, sample rate, bit depth
- Bitrate ceilings
- Video file size limits on social platforms
- Frame rate where only duration is given
- Safe-zone dimensions where a diagram exists but no numbers

Also check the **filled-in template fields**: if the client already typed copy into the spreadsheet, count it against the stated limit. Copy that already exceeds its own limit is common and cheap to catch.

## 5. Obsolete or deprecated requirements

Print and broadcast specs age badly. Check anything that reads like a legacy instruction:

- **Adobe Type 1 fonts.** Adobe ended support after January 2023; current Creative Cloud apps cannot use them at all. OpenType is the only workable answer. RIPs still process Type 1 inside existing PDFs, so the spec is not wrong so much as unfollowable.
- Deprecated codecs, Flash-era formats, fixed-width HTML requirements.
- Ad-platform duration ceilings that have changed. Verify the current limit against the platform's own documentation rather than trusting the spreadsheet — search for it if uncertain.

## 6. Completeness of the material list

- [ ] **Is every aspect ratio the media plan implies actually specified?** A social buy with feed placements but only 9:16 assets listed is a gap. **Report the gap; do not add the format.** A frame that is not in the source is scope the designer did not agree to.
- [ ] **Are safe zones given for every vertical asset?** Platform UI covers roughly the top 14 % and bottom 20 % of a 9:16 placement, but that is general knowledge, not this client's spec. If the source is silent, write *"spec does not mention safe zones — confirm"* on the findings slide. Do not put the numbers in a guide column or draw a `safearea` overlay as if they had been specified.
- [ ] **Does a rule attached to one item apply to another?** A "strong hook in the first second, logo visible from the start" note attached only to a 20 s video applies at least as much to a 6 s one. If the 20 s is dropped from scope, the rule should move, not disappear.
- [ ] **Quantities.** Ranges like "1–2 images" and "3–7 cards" need a decision before production. Flag them as decisions, not specs.

## Reporting

Write findings as short numbered items with the evidence and the consequence. Put them on the deck's findings slide and repeat them in the chat response.

**Format:** what is wrong → the evidence → what it costs.

> **Hero banner is the wrong size.** `hero-banner_900-x-900-149-kb.jpg` is 720 × 720 px despite its filename. The spec requires 900 × 900 px. Needs re-exporting.

Do not soften a finding into a suggestion, and do not present a guess as a fact. When a spec looks wrong but the source is ambiguous, say what to verify and with whom:

> **The 20 s online video length is worth confirming.** The most common ceiling for non-skippable in-stream is 15 s. Confirm with the media agency before production.
