# Catalog of Ingestion & Layout Edge Cases (A to H)

This document contains a checklist-style reference of every edge case a large multimodal document is likely to contain, organized by category. Each entry details **the problem**, a concrete **example**, and the **fix**.

---

## A. Page/Layout Boundary Edge Cases

### A1. Paragraph split mid-sentence across a page break
* **Problem**: Text split across physical page breaks (due to print layout boundaries) lose logical flow, producing disconnected chunks.
* **Example**: Page N ends "...made the", Page N+1 starts "financing terms more attractive...". Independent per-page extraction produces two disconnected chunks.
* **Fix**: Merge if the last block doesn't end in sentence-final punctuation (`.`, `!`, `?`) and the next page's first block starts with a lowercase letter. More robustly, verify layout bounds and coordinate alignment.

### A2. Table split across a page break, header repeated
* **Problem**: Large tables extending across pages repeat column headers. Naive parsers split these into separate chunks, destroying the row-column relationship.
* **Example**: "Table 2" ends Page 2 with Q1-Q2 rows, Page 3 re-states the full header row then continues with Q3-Q4 rows.
* **Fix**: Detect the repeated header (exact or embedding-similarity match) and drop the duplicate, merging rows into one logical table with `page_range: [2, 3]`.

### A3. Table split across a page break, header NOT repeated
* **Problem**: A table continues onto the next page as raw rows without repeating headers or continuation captions (no repeated header to key off).
* **Example**: "Table 2" ends Page 2. Page 3 immediately begins with Q3-Q4 data rows without column names.
* **Fix**: Track page boundary transition states. If a page ends mid-table (last block is row-shaped) and the next page's first block has the same column count and visual horizontal column coordinates (x0/x1 range alignment), merge the rows. Verify by checking if data types align column-wise.

### A4. List items split across a page break
* **Problem**: A numbered list gets physically broken by the page, causing naive extractors to split them into two independent lists.
* **Example**: A numbered list 1-15 where items 1-8 are on Page N and 9-15 on Page N+1.
* **Fix**: Track list numbering continuity in parsing state. If Page N+1's first list item number matches Page N's last item number + 1, merge them into a single list chunk.

### A5. Multi-column layout (newspaper-style) scrambles reading order
* **Problem**: Reading horizontally across columns merges unrelated sentences, creating semantic nonsense.
* **Example**: A two-column page where naive extraction reads line-by-line across both columns instead of down Column 1 then Column 2.
* **Fix**: Layout channel deconfliction. Detect vertical margin channels (clustering block `x0, x1` boundaries) and sort text blocks first left-to-right by column, and then top-to-bottom within each column.

### A6. Rotated/landscape pages within a portrait document
* **Problem**: Wide visual tables or graphics are oriented horizontally, causing standard portrait extraction layout metrics to misidentify columns.
* **Example**: A wide regional budget matrix is rendered in landscape on Page 15, inserted into an otherwise portrait corporate report.
* **Fix**: Query page rotation metadata (e.g. `page.rotation` in PyMuPDF) and dynamically rotate page coordinates or rendering viewport before calculating layout blocks.

### A7. Footnotes disconnected from their reference marker
* **Problem**: Footnote explanations are physically isolated at the page bottom, pages away from the superscript citation.
* **Example**: A footnote marker (¹) appears mid-paragraph on Page 4, but the footnote explanation text sits at the bottom of Page 5.
* **Fix**: Extract footnotes near page bottoms using superscript checks (`¹`, `²`), remove them from the main prose flow, and bind their explanations inline inside the parent paragraph citation block: `[Footnote ¹: ...]`.

### A8. Hyphenated words broken across a line/page break
* **Problem**: Words are split at margins with hyphens, introducing broken spelling markers in chunk text.
* **Example**: "instal-" at the end of Page 2, and "-lation" at the start of Page 3.
* **Fix**: Detect trailing hyphens at line/page boundaries and rejoin the split text without hyphens before passing text to embedding models.

---

## B. Table Edge Cases

### B1. No ruling lines present (whitespace-aligned table)
* **Problem**: Table drawn via visual alignments rather than grid lines, causing grid-based extractors to return empty tables.
* **Example**: A gridless table showing installation growth rate by year drawn using spacing offsets.
* **Fix**: Fall back to whitespace-separated stream-based parsers or cluster adjacent short multi-line blocks that follow a "Table N:" caption.

### B2. Merged/spanning cells (rowspan or colspan)
* **Problem**: Spanned headers or cell columns are only written once, returning blank cells for the rest.
* **Example**: A "Region" column cell spans three rows because all three rows belong to the "Northeast".
* **Fix**: Explicitly forward-fill empty or `None` cells from preceding rows or columns during structural ingestion.

### B3. Multi-level/nested headers
* **Problem**: Headers contain multi-row levels where sub-columns represent attributes of a parent header cell.
* **Example**: A header row where "2025" spans two sub-columns "H1" and "H2".
* **Fix**: Flatten nested headers into concatenated text combinations (e.g. "2025_H1", "2025_H2") rather than keeping only the bottom line.

### B4. Table is actually a scanned image (no text layer)
* **Problem**: Flat images of tables cannot be extracted via text parsing scripts.
* **Example**: A scan of a historical utility invoice inserted into an annual review document.
* **Fix**: Check if a page area contains a large image bounding box but zero extractable text, and route that region to table-structure OCR or Visual LLM parsers.

### B5. Table with footnote markers inside cells
* **Problem**: Reference signs (e.g. `*`, `¹`) are appended to numeric cells, altering the parsed numeric string or losing the caveat meaning.
* **Example**: A revenue cell contains "268*" where the asterisk points to "* preliminary figures".
* **Fix**: Keep the marker as part of the visual cell content, and bind the footnote description to the table chunk's metadata.

### B6. Nested table (a table inside a table cell)
* **Problem**: A table cell contains an entire sub-table, causing standard extractors to flatten and garble the cell text.
* **Example**: A cell in a financial statement contains a mini breakdown grid of local taxes.
* **Fix**: Use visual layout bounding boxes to detect grids inside cells and extract them as distinct structured components.

### B7. All rows look identical to the header row
* **Problem**: Tables lacking distinct header font styles confuse heuristic parsers that identify headers by formatting.
* **Example**: A table where headers and data rows share the same font family, style, and size.
* **Fix**: Identify headers based on coordinate position (first row following table caption) rather than formatting alone.

---

## C. Image and Figure Edge Cases

### C1. Sub-figures within one image (Figure 3a, 3b, 3c)
* **Problem**: A single image contains several independent charts captioned together, referenced separately in text.
* **Example**: Figure 3 contains Chart A (Northeast), Chart B (Southeast), and Chart C (West) side-by-side.
* **Fix**: Prompt VLM to segment and describe each sub-part individually, mapping sub-parts to separate referenceable child IDs (`figure_3a`, `figure_3b`).

### C2. Caption appears above the figure, not below
* **Problem**: Directional captions confuse proximity-based caption grabbers.
* **Example**: Scientific style templates place captions above images, while others place them below.
* **Fix**: Check blocks in both directions and match against standard figure/table captions using regex patterns.

### C3. Orphaned figures — no caption at all
* **Problem**: Figures without captions or text citations are omitted from retrieval indices.
* **Example**: A graphic divider or uncaptioned product diagram inserted between paragraphs.
* **Fix**: Extract the image, run VLM captioning to generate descriptions, and mark `has_caption: false` in metadata.

### C4. Decorative images that shouldn't be treated as content
* **Problem**: Recurring logos or borders waste budget and pollute retrieval index.
* **Example**: Corporate logo repeated in page headers or footers.
* **Fix**: Exclude images matching static header/footer margin coordinates, or deduplicate by hashing image bytes.

### C5. Vector-drawn charts/diagrams (no raster image to extract)
* **Problem**: Visual flowcharts drawn via vector paths have no raster bytes, meaning image extractors miss them.
* **Example**: A technical process map drawn with PDF drawing lines and text blocks.
* **Fix**: Detect clusters of vector drawing paths within a captioned figure region, render that region as a raster image, and pass it to VLM.

### C6. Chart legend positioned outside the chart's visual bounding box
* **Problem**: Legends are read as separate text blocks, stripping the visual chart of its color meanings.
* **Example**: A legend block sitting in a margin outside the chart's main layout rectangle.
* **Fix**: Expand the extraction crop region to include adjacent text blocks before sending the image to the VLM.

### C7. Low-resolution images where fine print/axis labels are unreadable
* **Problem**: Visual details in low-res charts are blurred, leading to VLM hallucinations.
* **Example**: Low-resolution JPEG compression artifacts render small tick label numbers unreadable.
* **Fix**: Flag image confidence metadata (`extraction_confidence: low`) and limit VLM to high-level descriptions rather than numeric guesses.

### C8. Duplicate images across many pages
* **Problem**: Identical figures are reprinted throughout a document, leading to redundant captioning costs.
* **Example**: The same project diagram reprinted in both Chapter 1 and the Appendix.
* **Fix**: Maintain a registry of image byte hashes. When a duplicate hash is encountered, link to the existing chunk instead of running VLM again.

---

## D. Chart/Graph-Specific Edge Cases

### D1. Multi-series charts
* **Problem**: Vague descriptions collapse several trends into a single generic caption.
* **Example**: A line chart with separate curves for revenue, cost, and profit.
* **Fix**: Prompt VLM to describe the individual trajectory and values of each labeled curve in the legend.

### D2. Dual y-axes
* **Problem**: Unaware prompts misattribute values on the right y-axis to the scale of the left y-axis.
* **Example**: Left axis shows millions of dollars; right axis shows unit count.
* **Fix**: Instruct VLM to identify dual axes, specify which series maps to which axis, and report scales separately.

### D3. Small multiples / trellis plots
* **Problem**: Grids of similar charts are treated as a single image, returning an incomplete summary.
* **Example**: A grid of 12 small line charts, one for each month of the year.
* **Fix**: Segment the grid visual into sub-images or instruct VLM to compile a structured breakdown of each cell in the grid.

### D4. Chart data also presented in an adjacent table
* **Problem**: Redundant chunking of tables and charts covering identical data leads to duplicate retrieval.
* **Example**: A line chart showing quarterly installations sits right next to a table listing the same figures.
* **Fix**: Establish a cross-link field (`same_data_as: table_id`) to coordinate query retrieval.

### D5. Log-scale axes
* **Problem**: Axis-blind visual models estimate tick marks linearly, introducing massive order-of-magnitude errors.
* **Example**: A logarithmic y-axis scaling from 10 to 10,000.
* **Fix**: Force VLM to explicitly check if axis spacing is log-scale before interpolating coordinates.

---

## E. Cross-Reference Edge Cases

### E1. Numbered references (baseline case)
* **Problem**: Standard text citations are left unlinked.
* **Example**: Text mentions: "As shown in Table 2...".
* **Fix**: Parse using regex patterns (`Table \d+`, `Figure \d+`) and map to visual node IDs.

### E2. Unnumbered references
* **Problem**: Citations lack numeric keys, making regex matching impossible.
* **Example**: Text says: "the table above" or "the chart below".
* **Fix**: Resolve based on layout coordinates (link to the nearest preceding or following table/figure block).

### E3. Forward references
* **Problem**: Citations point to visual figures located pages ahead of the current text.
* **Example**: Text on page 10 says "see Figure 12", but Figure 12 is placed on page 15.
* **Fix**: Resolve references against a global document ID namespace instead of local nearby search windows.

### E4. Cross-chapter references
* **Problem**: References target sections or figures in other chapters.
* **Example**: "see Table 2 in Chapter 3" while the current paragraph is in Chapter 7.
* **Fix**: Resolve references against a global document ID index.

### E5. Reused numbering across appendices/chapters
* **Problem**: Reused numbers collide, linking references to the wrong visual components.
* **Example**: Table 1 appears in both Chapter 4 and Appendix A.
* **Fix**: Scope visual IDs hierarchically: `chapter4_table_1` vs `appendixa_table_1`.

### E6. Range references
* **Problem**: References point to spans of figures, losing visual links if parsed only on the first number.
* **Example**: Text says: "see Figures 5-7".
* **Fix**: Expand range notations (`Figures? \d+(?:-\d+| to \d+)`) into lists of discrete target IDs.

### E7. External citations that look like internal references
* **Problem**: Academic citations of other papers' figures get falsely linked to the current document's figures.
* **Example**: Text says: "...as shown in Smith et al. (2020), Table 2".
* **Fix**: Check for surrounding citations (names, years) to distinguish external references from internal ones.

---

## F. Text and Section Structure Edge Cases

### F1. False-positive heading detection
* **Problem**: Bold inline text terms get misclassified as headings, breaking hierarchy trees.
* **Example**: Bolded list keys: "**Key takeaway**: The revenue growth..."
* **Fix**: Enforce both style checks (font size/weight) and layout checks (must occupy its own block/line and not be followed inline by body text).

### F2. Similar-styled running headers vs real section headings
* **Problem**: Page headers use similar formatting as section titles, causing redundant chapter splits.
* **Example**: Page header: "Chapter 4: Financial Results" repeated at the top of pages 40-55.
* **Fix**: Exclude boilerplate margins before running section heading classifiers.

### F3. Table of contents / index pages
* **Problem**: Table of contents pages get chunked as narrative text, producing index noise.
* **Example**: "Chapter 4 ........................................... Page 52".
* **Fix**: Detect dot leaders (`...`) or index structures and skip TOC pages from search indices.

### F4. Nested/multi-level lists
* **Problem**: Indentation offsets are stripped, losing sub-item dependencies.
* **Example**: Sub-bullets indented under List Item 3.
* **Fix**: Parse list structures using Markdown format to preserve indentation levels (`*` vs `  *`).

### F5. Sidebars / callout boxes
* **Problem**: Boxed text callouts are read as part of the adjacent paragraph.
* **Example**: A boxed quote sits next to a two-column layout.
* **Fix**: Identify sidebar boxes as separate layout regions before ordering page text.

### F6. Mathematical equations
* **Problem**: Specialized math symbols render as corrupted Unicode garbage characters.
* **Example**: Text displays: "∫_a^b f(x) dx = F(b) - F(a)".
* **Fix**: Detect equation blocks, isolate them, and preserve LaTeX markup or represent them as clean math text chunks.

### F7. Embedded code blocks
* **Problem**: Code blocks are parsed as normal paragraphs, stripping indentation and spacing.
* **Example**: A Python script block.
* **Fix**: Monospace font checks. Isolate code blocks and disable word-wrapping or margin merges.

### F8. Multi-language / mixed-script content
* **Problem**: Wrong encoding schemes corrupt non-Latin letters.
* **Example**: English text containing Japanese keywords.
* **Fix**: Run per-block encoding verification and preserve exact glyph mapping.

---

## G. Document-Level Structural Edge Cases

### G1. Hybrid documents — some pages scanned, some native text
* **Problem**: Mixing digital text pages and scanned image pages causes text parsers to return empty text on scanned pages.
* **Example**: A signed approval page scanned as an image inside a digital report.
* **Fix**: Per-page check: if digital text count is zero, run OCR on that page while keeping text extraction on digital pages.

### G2. Redacted/blacked-out content
* **Problem**: Redaction boxes cause text extraction to return blank segments, leaving no audit history.
* **Example**: Corporate reports with black boxes masking confidential metrics.
* **Fix**: Detect large solid rectangle shapes overlapping text regions and inject `[REDACTED]` tokens.

### G3. Duplicate or near-duplicate pages
* **Problem**: Accidental page scans duplicate chunks and clog retrieval lists.
* **Example**: An invoice sheet scanned twice.
* **Fix**: Deduplicate pages using text hashes.

### G4. Front matter and back matter needing different treatment
* **Problem**: Glossaries chunked as paragraphs lose term-to-definition bindings.
* **Example**: Glossary section containing: "API: Application Programming Interface".
* **Fix**: Identify glossaries and index them as key-value chunks rather than prose.

### G5. Appendices with a different structural convention
* **Problem**: Lettered numbering resets, conflicting with main body sections.
* **Example**: Appendix A starts with "Table A.1".
* **Fix**: Apply appendix namespaces to prevent coordinate or reference collisions.

---

## H. Boilerplate and Noise Edge Cases

### H1. Per-page-varying footer (page numbers)
* **Problem**: Evolving page numbers bypass strict exact-string boilerplate checks.
* **Example**: "Page 3" vs "Page 4".
* **Fix**: Normalize digits to a `#` placeholder inside page margins before checking frequency patterns.

### H2. Section-varying running headers
* **Problem**: Header text changes per chapter, bypassing document-wide repetition filters.
* **Example**: Running header says "Chapter 4" on page 40, and "Chapter 5" on page 60.
* **Fix**: Measure frequency within local chapter windows instead of globally.

### H3. Boilerplate detection must be position-gated
* **Problem**: Main text blocks matching recurring numbers are accidentally stripped as boilerplate.
* **Example**: Financial table rows with similar numbers get stripped.
* **Fix**: Restrict candidate filters exclusively to coordinates within the top and bottom margins (y1 < 60, y0 > 735).

### H4. Watermarks overlapping real content
* **Problem**: Overlay draft watermarks bleed into normal prose sentences.
* **Example**: "DRAFT" written diagonally across Page 9.
* **Fix**: Exclude blocks that are rotated at diagonal angles or have very light gray scales.

### H5. Confidentiality/draft stamps changing per revision
* **Problem**: Changing version strings bypass frequency counts.
* **Example**: "DRAFT v3" vs "DRAFT v4".
* **Fix**: Normalize version structures prior to running repetition counts.

---

## Quick-Reference Checklist: Primary Detection Signal

| Category | Primary Detection Signal |
| :--- | :--- |
| **Page-break merges (A)** | Sentence-ending punctuation + lowercase next block; coordinate column limits |
| **Table structure (B)** | Ruling coordinate lines; whitespace margins when lines are absent; header grid bounds |
| **Images/figures (C)** | Layout-engine region tagging; image byte hashes; crop expands for labels/legends |
| **Charts & curves (D)** | Prompt VLM specific labels (axis, scale); cross-links to raw data tables |
| **Cross-references (E)** | Regex patterns; spatial proximity (unnumbered); scoped namespaces |
| **Text structure (F)** | Font sizing & standalone line checks; monospace checks; encoding code page checks |
| **Document structure (G)** | Text-layer character density checks; OCR fallback; full-page md5 hashing |
| **Boilerplate & headers (H)** | Margin-band coordinate gating (top/bottom) + repetition counts |
