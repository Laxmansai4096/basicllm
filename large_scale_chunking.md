# Guide: Large-Scale Production Ingestion (100,000+ Pages)

Processing large-scale corpora (e.g. 100K-page PDFs) requires building ingestion pipelines that prevent OOM crashes, handle API rate limits, avoid redundant processing bills, and recover from runtime failures. This document outlines production patterns and code examples.

---

## 1. Incremental Ingestion via Page Hashing

### The Problem
When a 100,000-page document is updated (e.g., a new edition of a manual), re-processing all pages is extremely slow and expensive.

### The Ingestion Diff Algorithm
1. Generate a normalized SHA-256 hash for every page of the updated PDF.
2. Diff the hash list against the existing hashes stored in your page database.
3. Classify and process pages:
   * **Added Pages**: Parse, chunk, and embed.
   * **Modified Pages**: Delete old chunks and embeddings, then process the updated page.
   * **Deleted Pages**: Delete old chunks and embeddings from all databases.
   * **Unchanged Pages**: Skip entirely.

### Python Implementation Example

```python
import hashlib
import re

def compute_normalized_page_hash(raw_text: str) -> str:
    """Strips variable headers/footers to compute a text-invariant page hash."""
    # Strip page indicators
    text = re.sub(r'\b(?:Page|pg\.?)\s*\d+\b', '', raw_text, flags=re.IGNORECASE)
    # Strip date formats (YYYY-MM-DD)
    text = re.sub(r'\b\d{4}-\d{2}-\d{2}\b', '', text)
    # Compress whitespaces and lower case
    text = "".join(text.split()).lower()
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def diff_and_sync_document(new_pages_data: dict, database_records: dict):
    """
    Args:
        new_pages_data: dict mapping {page_num: raw_text}
        database_records: dict mapping {page_num: stored_hash}
    """
    actions = {"add": [], "update": [], "delete": [], "skip": []}
    
    # Calculate hashes for new document pages
    new_hashes = {p: compute_normalized_page_hash(txt) for p, txt in new_pages_data.items()}
    
    # Diff logic
    for page_num, new_hash in new_hashes.items():
        if page_num not in database_records:
            actions["add"].append(page_num)
        elif database_records[page_num] != new_hash:
            actions["update"].append(page_num)
        else:
            actions["skip"].append(page_num)
            
    for page_num in database_records:
        if page_num not in new_hashes:
            actions["delete"].append(page_num)
            
    return actions
```

---

## 2. Image Byte Hashing & VLM Optimization

### The Problem
Calling Vision-Language Models (e.g. GPT-4o, Gemini) to parse graphs, charts, or images is highly expensive. Documents often repeat warning graphics, logos, and unchanged layouts.

### Optimization Rules
1. **Size/Coordinate Gating**: Skip images under `50px x 50px` (usually icons) or images inside the header/footer coordinates.
2. **Image Byte Hashing**: MD5-hash raw image bytes and check against a shared Redis cache before calling the VLM API.
3. **Local Pre-Classifier**: Use a lightweight, open-source model (like a local SigLIP) to classify if the image contains relevant information (e.g., plot vs. decorative divider).

### Python Implementation Example

```python
import hashlib

# Mock database of cached VLM responses
image_vlm_registry = {}

def get_image_vlm_description(image_bytes: bytes, image_bbox: list) -> str:
    # Rule 1: Size check
    x0, y0, x1, y1 = image_bbox
    width, height = x1 - x0, y1 - y0
    if width < 50 or height < 50:
        return "DECORATIVE_IMAGE_SKIPPED"
        
    # Rule 2: Byte hashing
    image_hash = hashlib.md5(image_bytes).hexdigest()
    if image_hash in image_vlm_registry:
        print("Cache Hit: Reusing VLM description.")
        return image_vlm_registry[image_hash]
        
    # Rule 3: Call expensive VLM API (Mocked here)
    vlm_description = "Extracted chart data: Annual Revenue grew by 20%..."
    image_vlm_registry[image_hash] = vlm_description
    return vlm_description
```

---

## 3. Distributed Map-Reduce Ingestion

### The Process
* **Map**: Divide the 100K-page PDF into batches of 500 pages. Spawn stateless concurrent Celery workers to parse text and store the raw chunks in PostgreSQL.
* **Reduce**: Run a post-processing worker to stitch together paragraphs and tables spanning page boundaries (e.g., Page 500 -> Page 501), then bulk-embed and push to the Vector DB.

---

## 4. API Rate Limit Orchestration (Token Bucket & Backoff)

To call embedding and generation APIs without getting blocked (HTTP 429), wrap calls in a rate limiter and exponential backoff.

### Python Implementation Example

```python
import asyncio
from aiolimiter import AsyncLimiter
from tenacity import retry, wait_random_exponential, stop_after_attempt

# Limit to 300 requests per minute
limiter = AsyncLimiter(max_rate=300, time_period=60)

@retry(wait=wait_random_exponential(min=1, max=30), stop=stop_after_attempt(5))
async def safe_api_call(payload: dict) -> dict:
    async with limiter:
        # call_llm_service(payload)
        return {"status": "success", "result": "api response"}
```

---

## 5. Checkpointing & Recovery

If chunking fails mid-process, recovery is critical to prevent database corruption.

### Recovery Workflow
1. Commit chunk batches transactionally (e.g., in blocks of 100 pages).
2. Write the last successfully committed page index to the checkpoint store.
3. If an error occurs, perform a rollback to delete any orphaned, partially written chunks from the failed range.
4. Restart the worker task from the beginning of the failed batch range.

---

## 6. Purpose-Built Multi-Store Architecture

Dumping all data types into a single database creates major concurrency locks. Use purpose-built stores:

```
                           [Ingestion Workers]
                                    │
        ┌───────────────────┬───────┴───────────┬──────────────────┐
        ▼                   ▼                   ▼                  ▼
  [Object Storage]    [Relational DB]    [In-Memory Cache]   [Vector DB]
  (S3 / Azure Blob)     (PostgreSQL)          (Redis)     (Qdrant/Pinecone)
        │                   │                   │                  │
        ▼                   ▼                   ▼                  ▼
 Raw image binaries,  Extracted markdown,  Text/Image hashes,   Embeddings,
 page screenshots,    coordinates, parent- checkpoint states,   chunk text, and
 and layout JSONs.    child relationships. process locks.       metadata filters.
```
