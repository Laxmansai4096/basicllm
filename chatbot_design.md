# Guide: RAG Chatbot System Design Patterns

This guide outlines RAG (Retrieval-Augmented Generation) system architectures tailored to specific data constraints and latency requirements, commonly discussed in system design interviews.

---

## Scenario A: Extremely Dynamic Data (Frequently Changing)

### Context & Goal
Real-time information (e.g., flight prices, live stock rates, inventory counts) changes too fast to re-embed and index. The goal is to return real-time correct answers.

### System Diagram
```
[User Query] ──► [Query Router (LLM)]
                       │
             ┌─────────┴─────────┐
             ▼ (Structured Args) ▼ (Semantic Search)
     [Relational DB / Cache]   [Vector DB]
     (SQL/PostgreSQL/Redis)    (HNSW index)
             │                   │
             └─────────┬─────────┘
                       ▼
             [Prompt Builder] ──► [LLM Generation]
```

### Strategy: Self-Querying Structured Extraction
Extract query text and filter properties from the user prompt using structured output schema mapping.

```python
import json

def parse_user_query_to_filters(user_prompt: str) -> dict:
    """
    Example parser translating: 'Show me stock reports for SolarTech from June 2025'
    into structured database parameters. In production, this runs via JSON-mode LLM.
    """
    # Simulated JSON returned from LLM parser
    simulated_llm_json = """
    {
        "search_query": "stock reports",
        "filters": {
            "company": "SolarTech",
            "date": {
                "$gte": "2025-06-01",
                "$lte": "2025-06-30"
            }
        }
    }
    """
    return json.loads(simulated_llm_json)

# Usage in vector DB retrieval
parsed = parse_user_query_to_filters("Show me stock reports for SolarTech from June 2025")
# The filters are passed as a metadata pre-filter directly to the Vector DB search call:
# vector_db.search(query=parsed["search_query"], filter=parsed["filters"])
```

---

## Scenario B: Static Data (Rarely or Never Changes)

### Context & Goal
Historical records, archived publications, or corporate tax filings. The goal is maximum retrieval quality and query cost reduction over time.

### Strategy: Parent-Child Hierarchical Indexing
Map small, semantic vector matching chunks (children) to larger, contextually rich retrieval segments (parents).

```python
# Mock DB mapping child vector chunk IDs to parent context text
parent_document_store = {
    "parent_1": "Full Section 3.1: SolarTech's revenue grew by 20% due to residential sales in California. This was driven by the Solar Tax Credit expansion...",
}

def retrieve_context_parent_child(query_vector, vector_db) -> str:
    """
    1. Search Child chunks in Vector DB.
    2. Retrieve matching child metadata pointing to parent_id.
    3. Load the full parent context from relational storage.
    """
    # Retrieve top match from child index
    child_matches = vector_db.search_vector(query_vector, top_k=1)
    best_match = child_matches[0] # e.g. {"child_id": "c_102", "parent_id": "parent_1", "text": "revenue grew by 20%"}
    
    parent_id = best_match["parent_id"]
    
    # Return parent text to LLM prompt instead of child chunk text
    return parent_document_store.get(parent_id, best_match["text"])
```

---

## Scenario C: Low-Latency Critical Systems

### Context & Goal
Automated customer support chat, real-time voice assistants, autocomplete queries. Goal: TTFT (Time to First Token) < 1.0s.

### Architecture Strategies
1. **Semantic Caching**: If user query similarity matches a historical question in the cache database with $>0.96$ threshold, return the cached text instantly, bypassing both Vector DB and LLM generation.
2. **Lightweight Embedding Models**: Use local models like `BGE-small-en-v1.5` or `all-MiniLM-L6-v2` running on CPU/GPU.
3. **Speculative Decoding**: Employ small language models (SLMs, e.g. 8B parameter models) on high-speed inference runtimes like **vLLM** or **TensorRT-LLM**.
4. **Skip Rerankers**: Reranking layers (e.g. Cohere or Cross-Encoders) add 200-500ms of latency and must be skipped.

---

## Scenario D: Maximum Accuracy & Precision Priority (Zero Hallucination)

### Context & Goal
Medical diagnostic assistance, safety compliance, or financial audits. Goal: Maximum recall, verbatim extraction, and citation enforcement.

### Strategy: Hybrid Search & Reciprocal Rank Fusion (RRF)
Combine semantic Dense Search with exact Sparse Search (BM25) and rerank the output.

```python
def reciprocal_rank_fusion(dense_results: list, sparse_results: list, k: int = 60) -> list:
    """
    Merges rank scores from two distinct searches.
    Args:
        dense_results: List of doc IDs sorted by semantic closeness.
        sparse_results: List of doc IDs sorted by exact keyword relevance.
    """
    rrf_scores = {}
    
    # Process dense rank
    for rank, doc_id in enumerate(dense_results):
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
        
    # Process sparse rank
    for rank, doc_id in enumerate(sparse_results):
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
        
    # Sort docs by final RRF score
    sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    return [doc[0] for doc in sorted_docs]
```

### Strategy: LLM as a Judge Quality Audit (QA) Prompt
Run post-generation validation checks to guard against hallucinated output.

```
You are an expert auditor. Review the generated answer and the source retrieved chunks.

Source Chunks:
{retrieved_chunks}

Generated Answer:
{generated_answer}

Evaluate the generated answer based on these rules:
1. Is every claim in the answer supported verbatim by at least one source chunk? (Yes/No)
2. Identify any sentences in the answer that contain facts or figures not present in the sources.
3. Assign a grounding score from 0.0 (unsupported) to 1.0 (fully grounded).

If grounding score is less than 1.0, rewrite the answer removing any unsupported claims.
```
