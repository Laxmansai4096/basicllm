# Guide: Layout-Aware Smart Chunking

Naive chunking engines split text purely by character counts or token size boundaries. This destroys structural elements, leading to broken paragraphs, split tables, lost list continuity, and detached footnotes. This guide outlines algorithms, logic patterns, and Python implementations for layout-aware smart chunking.

---

## 1. Paragraph Stitching Across Page Breaks

### The Problem
When a paragraph is physically cut off by a page boundary, naive extractors output two distinct chunks. This breaks semantic continuity, as the embedding models receive incomplete sentences.

### The Stitching Algorithm
To determine if the last block of **Page N** should be stitched (merged) with the first block of **Page N+1**:
1. Check **Grammar Boundaries**: Does the last block of Page N end in a non-sentence-terminal character (e.g., a comma, trailing hyphen, or no punctuation)? Does the first block of Page N+1 start with a lowercase letter?
2. Check **Layout Alignment**: Do the visual coordinates (margins, indentation levels) align?
3. Check **Text Type**: Verify that the starting block on Page N+1 is not a new header, caption, image legend, or bullet point.

### Python Implementation Example

```python
import re

def should_stitch_paragraphs(last_block_page_n: dict, first_block_page_n1: dict) -> bool:
    """
    Evaluates coordinates and text patterns to determine if two text blocks 
    separated by a page boundary are actually a single split paragraph.
    """
    text_n = last_block_page_n.get("text", "").strip()
    text_n1 = first_block_page_n1.get("text", "").strip()
    
    if not text_n or not text_n1:
        return False
        
    # Rule 1: Verify page N+1 does not start with a heading or list item
    is_n1_header = first_block_page_n1.get("type") == "heading"
    is_n1_list_item = text_n1.startswith(("- ", "* ", "1. ", "• "))
    if is_n1_header or is_n1_list_item:
        return False
        
    # Rule 2: Check grammar endings
    ends_with_terminal_punc = text_n[-1] in (".", "!", "?")
    starts_with_lowercase = text_n1[0].islower()
    
    # Rule 3: Coordinate alignment check (margin overlap)
    # Check if left visual margin (x0) matches within a 5-pixel threshold
    x0_n = last_block_page_n.get("bbox", [0,0,0,0])[0]
    x0_n1 = first_block_page_n1.get("bbox", [0,0,0,0])[0]
    margins_aligned = abs(x0_n - x0_n1) < 5.0
    
    # Stitched condition: Sentence is grammatically incomplete and layouts match
    if not ends_with_terminal_punc and starts_with_lowercase and margins_aligned:
        return True
        
    return False

# Example Usage:
block_page_3 = {"text": "SolarTech Inc. experienced rapid expansion during the", "bbox": [54, 700, 500, 720], "type": "paragraph"}
block_page_4 = {"text": "quarter, driving sales up by nearly 25 percent.", "bbox": [54, 80, 500, 100], "type": "paragraph"}

if should_stitch_paragraphs(block_page_3, block_page_4):
    stitched_text = block_page_3["text"] + " " + block_page_4["text"]
    print("Stitched Content:", stitched_text)
```

---

## 2. Table Parsing & Stitching

### The Problem
Tables split across page breaks lose their column context. Furthermore, columns are often repeated on subsequent pages or completely omitted, garbling rows when parsed by naive engines.

### The Parsing Strategy
* **Repeated Headers**: Detect repeated headers on Page N+1 and drop them before appending rows to the parent table.
* **Coordinate Mapping**: Validate row alignments by matching the visual horizontal coordinates (`x0` to `x1` boundary coordinates) of columns on both pages.
* **Format Preservation**: Output the final merged table as Markdown to preserve structural formatting for RAG generation.

### Python Implementation Example

```python
def merge_split_tables(table_page_n: list, table_page_n1: list, col_threshold: float = 8.0) -> list:
    """
    Merges rows from two split tables across pages if their column coordinates align.
    Args:
        table_page_n: List of rows, where each row is a dict containing {"cells": [...], "col_coords": [(x0, x1), ...]}
        table_page_n1: List of rows representing the continued table.
    """
    if not table_page_n or not table_page_n1:
        return []
        
    # Get column layouts from the end of first table and start of next table
    cols_n = table_page_n[-1]["col_coords"]
    cols_n1 = table_page_n1[0]["col_coords"]
    
    if len(cols_n) != len(cols_n1):
        # Column count mismatch -> different tables
        return []
        
    # Verify horizontal coordinate alignment of all columns
    alignments = [abs(cols_n[i][0] - cols_n1[i][0]) < col_threshold for i in range(len(cols_n))]
    if not all(alignments):
        return [] # Layout alignment mismatch
        
    # Check if first row of table_page_n1 duplicates the header row of table_page_n
    header_cells_n = [str(c).strip().lower() for c in table_page_n[0]["cells"]]
    first_cells_n1 = [str(c).strip().lower() for c in table_page_n1[0]["cells"]]
    
    start_row = 1 if header_cells_n == first_cells_n1 else 0
    
    # Merge rows
    merged_table = list(table_page_n)
    for r in range(start_row, len(table_page_n1)):
        merged_table.append(table_page_n1[r])
        
    return merged_table
```

---

## 3. Footnote Binding

### The Problem
Footnote text resides at the bottom of a page, physically disconnected from the sentence citing it. If parsed sequentially, the footnote is index-searched as an isolated chunk, losing its context.

### The Solution
1. Detect footnote indicators (e.g. superscript digits `¹`, `²` or asterisks `*`) in main text blocks.
2. Isolate text blocks within bottom-margin coordinates (e.g., `y0 > 730` on standard A4 layout).
3. Extract footnotes, map markers, strip them from the page-end block stream, and append them directly to the metadata of the paragraph chunk that references them.

### Python Implementation Example

```python
def bind_footnotes_to_prose(paragraphs: list, page_footnotes: dict) -> list:
    """
    Links bottom-of-page footnotes back to referencing sentences.
    Args:
        paragraphs: List of dicts representing paragraph chunks on a page.
        page_footnotes: Dict mapping markers to their text, e.g. {"1": "Based on 2025 audited reports."}
    """
    for p in paragraphs:
        text = p["text"]
        p["footnotes"] = []
        
        # Regex to locate superscript digit citations like: sentence¹ or sentence[1]
        markers_found = re.findall(r'(?:¹|²|³|⁴|⁵|\b\[(\d+)\])', text)
        # Normalize mapping of unicode superscript markers to standard digits
        unicode_map = {"¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5"}
        
        for marker in markers_found:
            normalized_key = unicode_map.get(marker, marker)
            if normalized_key in page_footnotes:
                p["footnotes"].append({
                    "citation": normalized_key,
                    "text": page_footnotes[normalized_key]
                })
    return paragraphs
```

---

## 4. Boilerplate & Noise Filtering

### The Problem
Headers, footers, page numbers, and confidentiality stamps repeat on every page. This noise creates search bias, increases vector database size, and wastes model input tokens.

### The Coordinates-Gating Approach
* **Static Margins Filtering**: Strip any text block residing completely inside the header boundary (`y1 < 60`) or footer boundary (`y0 > 735`).
* **Boilerplate Matching**: Track text blocks that repeat across more than 50% of the pages (such as document titles) and add them to a global exclude list.
* **Page-Number Normalization**: Replace variable page numbers with generic place markers during frequency analysis, preventing minor variances (e.g., "Page 1" vs "Page 2") from escaping extraction filters.
