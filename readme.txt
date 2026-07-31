# The Complete FDE (Forward Deployed Engineer) Learning Roadmap
### Every topic, in learning order — with framework, pros/cons, when to use/avoid, applications & prerequisites

This is the exhaustive version: **every tool from the FDE Academy stack**, plus the **foundational prerequisites** (Python, SQL, Git, APIs, Linux, Math/Stats) that aren't in the original sales deck but are required before you can actually use any of this in production. Topics are ordered the way you should actually learn them.

**How to read each entry:**
- **What it is** — plain-English definition
- **Key focus points** — the 3-5 things to actually master
- **Most-used tools** — what the industry actually uses
- **Pros / Advantages**
- **Cons / Disadvantages**
- **When to use**
- **When to avoid**
- **Applications / Use cases**
- **Core features**

---

# PHASE 0 — Prerequisites (Not in original deck, but required first)

## 0.1 Python
- **What it is:** The dominant programming language for AI/ML — nearly every tool below is Python-first.
- **Key focus points:** data types & control flow, functions & OOP basics, list/dict comprehensions, virtual environments (venv/conda), `async`/`await` (critical for AI APIs), error handling, working with JSON.
- **Most-used tools:** CPython, pip/poetry/uv, Jupyter/Colab, `venv`.
- **Pros:** huge ecosystem, readable, first-class AI/ML library support, fast to prototype.
- **Cons:** slower runtime than compiled languages, dependency management can get messy, GIL limits true multithreading.
- **When to use:** literally everything in this roadmap.
- **When to avoid:** ultra-low-latency systems programming (use Go/Rust/C++ instead) — rare in FDE work.
- **Applications:** scripting, backend APIs, data pipelines, AI/agent orchestration.
- **Core features to know:** decorators, context managers, type hints, `asyncio`, generators.

## 0.2 SQL & Databases
- **What it is:** The query language for structured (relational) data; also need basics of NoSQL for unstructured/document data.
- **Key focus points:** SELECT/JOIN/GROUP BY, indexes, normalization basics, `psycopg2`/`SQLAlchemy` in Python, difference between SQL (Postgres/MySQL) and NoSQL (MongoDB).
- **Most-used tools:** PostgreSQL, MySQL, SQLite (local/dev), MongoDB, SQLAlchemy (ORM).
- **Pros:** structured, reliable, ACID-compliant, universal skill clients expect.
- **Cons:** rigid schema (for SQL), scaling writes horizontally is harder than NoSQL.
- **When to use:** any AI product needs a database for users, logs, metadata, chat history, structured business data.
- **When to avoid:** don't use SQL for storing embeddings (use a vector DB instead) or highly flexible/nested schemas (use NoSQL).
- **Applications:** user auth, chat history storage, structured metadata alongside RAG, analytics.
- **Core features:** joins, transactions, indexing, migrations.

## 0.3 Git & GitHub
- **What it is:** Version control — tracks code changes and enables collaboration.
- **Key focus points:** commit/branch/merge, pull requests, resolving conflicts, `.gitignore`, basic GitHub Actions triggers.
- **Most-used tools:** Git CLI, GitHub, GitLab.
- **Pros:** industry standard, enables CI/CD, safety net for code changes.
- **Cons:** learning curve for branching strategies and merge conflicts.
- **When to use:** every single project, from day one.
- **When to avoid:** never — no valid reason to skip this.
- **Applications:** collaborative dev, deployment pipelines, code review.
- **Core features:** branching, PRs, tags/releases, Actions (ties into CI/CD in Month 7).

## 0.4 REST APIs & HTTP Fundamentals
- **What it is:** The protocol/pattern almost every AI service (OpenAI, Claude, Pinecone, etc.) is accessed through.
- **Key focus points:** HTTP verbs (GET/POST/PUT/DELETE), status codes, headers/auth (API keys, OAuth, bearer tokens), request/response JSON bodies, rate limits.
- **Most-used tools:** `requests`/`httpx` (Python), Postman/Insomnia for testing.
- **Pros:** universal, simple mental model, works with every AI API.
- **Cons:** stateless (needs extra work for sessions), can be chatty for real-time needs (→ WebSockets later).
- **When to use:** calling any LLM/vector DB/third-party API.
- **When to avoid:** real-time streaming needs (use WebSocket/SSE instead — Month 7).
- **Applications:** LLM API calls, webhook integrations, third-party service calls.
- **Core features:** authentication headers, pagination, retries/backoff, idempotency.

## 0.5 Linux / Command Line Basics
- **What it is:** The OS/terminal environment almost all AI deployment happens in.
- **Key focus points:** navigating file system, `ssh`, environment variables, package managers (`apt`), process management, piping/`grep`.
- **Most-used tools:** Bash/Zsh, Ubuntu/Debian.
- **Pros:** required for cloud servers, Docker, Claude Code, most deployment tools.
- **Cons:** steep learning curve if coming from GUI-only background.
- **When to use:** any server-side/cloud work, using Claude Code, deployment.
- **When to avoid:** N/A — foundational.
- **Applications:** server management, scripting, deployment.
- **Core features:** shell scripting, cron jobs, permissions (chmod/chown).

## 0.6 Math & Statistics Basics
- **What it is:** The conceptual foundation behind embeddings, fine-tuning, and evaluation metrics.
- **Key focus points:** vectors & cosine similarity (→ embeddings), probability basics, precision/recall/F1 (→ evaluation), basic linear algebra intuition (not derivations).
- **Most-used tools:** NumPy, basic stats libraries.
- **Pros:** lets you actually understand *why* RAG/embeddings/evaluation work, not just copy-paste.
- **Cons:** can be intimidating; FDEs need intuition, not deep theory.
- **When to use:** understanding embeddings, evaluation scores, fine-tuning loss curves.
- **When to avoid:** don't go down a deep ML-theory rabbit hole — FDE work is applied, not research.
- **Applications:** interpreting RAGAS scores, explaining embeddings to clients, evaluating fine-tuning results.
- **Core features:** cosine similarity, dot product, mean/variance, precision vs. recall.

---

# PHASE 1 (Month 1) — Prompt Engineering Foundations

## 1.1 Prompt Engineering
- **What it is:** Writing precise instructions so an LLM reliably produces the output you want.
- **Key focus points:** zero-shot vs few-shot, role/persona prompting, instruction clarity, output formatting constraints, iterative refinement.
- **Most-used tools/frameworks:** raw prompting in ChatGPT/Claude/Playground; prompt templates via LangChain `PromptTemplate`.
- **Pros:** no code/infra needed, immediate results, cheap to iterate.
- **Cons:** brittle — small wording changes can break outputs; doesn't scale well alone for complex systems; model-dependent (a prompt tuned for GPT may not work identically on Claude).
- **When to use:** first pass on any new LLM task; simple, well-defined tasks; before reaching for RAG/fine-tuning.
- **When to avoid:** when you need the model to know proprietary/current info (use RAG instead) or a very specific consistent style/domain (consider fine-tuning).
- **Applications:** chatbots, content generation, classification, summarization, data extraction.
- **Core features/techniques:** zero-shot, few-shot, role prompting, instruction + constraints, output formatting (e.g. "respond only in JSON").

## 1.2 Chain-of-Thought (CoT)
- **What it is:** Prompting the model to reason step-by-step before giving a final answer.
- **Key focus points:** "let's think step by step" pattern, few-shot CoT examples, self-consistency (sampling multiple CoT paths and voting).
- **Most-used tools:** built into prompting (no separate tool); reasoning models (o1, Claude extended thinking) do this natively.
- **Pros:** big accuracy boost on math/logic/multi-step tasks; easy to explain to clients ("show its work").
- **Cons:** more tokens = more cost & latency; can still produce confidently wrong reasoning ("hallucinated logic"); not needed for simple tasks.
- **When to use:** multi-step reasoning, math, planning, debugging why a model gives wrong answers.
- **When to avoid:** simple factual lookups or classification — adds cost/latency with no benefit.
- **Applications:** agent planning, complex Q&A, debugging model reasoning, math/logic tasks.
- **Core features:** explicit reasoning steps, self-consistency voting, ReAct (paired later with agents in Month 6).

---

# PHASE 2 (Month 2) — LLM APIs, Context Engineering & Structured Data

## 2.1 OpenAI GPT (GPT-4o / o1)
- **What it is:** OpenAI's flagship model family; GPT-4o is fast/multimodal, o1-class are reasoning models.
- **Key focus points:** API basics (chat completions), function/tool calling, vision input, pricing tiers, rate limits.
- **Pros:** best-in-class ecosystem/tooling, widest adoption, strong general performance, good docs.
- **Cons:** cost can scale fast at volume, closed-source, occasional rate-limit/availability issues at peak times.
- **When to use:** general-purpose tasks, when client explicitly wants "ChatGPT-like" behavior, wide tool/plugin ecosystem needed.
- **When to avoid:** strict data-residency/privacy requirements (consider Ollama/local); cost-sensitive high-volume simple tasks (consider SLM).
- **Applications:** chatbots, content gen, coding assistants, multimodal apps.
- **Core features:** function calling, structured outputs, vision, long context.

## 2.2 Anthropic Claude
- **What it is:** Anthropic's model family, known for safety, long-context reasoning, and reliability.
- **Key focus points:** Messages API, tool use, extended thinking, large context windows, system prompts.
- **Pros:** strong at long documents, careful/safe outputs, excellent at coding and structured reasoning, good for enterprise trust.
- **Cons:** historically slightly behind on raw speed vs some competitors; smaller third-party plugin ecosystem than OpenAI (narrowing over time).
- **When to use:** enterprise clients prioritizing safety/reliability, long-document analysis, coding tasks, agentic tool use.
- **When to avoid:** N/A generally — but check cost/latency needs for very high-throughput simple tasks.
- **Applications:** enterprise assistants, document analysis, coding agents (Claude Code), long-context summarization.
- **Core features:** tool use, long context windows, system prompts, extended/step-by-step thinking.

## 2.3 Google Gemini
- **What it is:** Google's model family, strong at multimodal (text/image/video/audio) and Google ecosystem integration.
- **Key focus points:** multimodal input handling, Vertex AI integration, context caching.
- **Pros:** best native multimodal support, deep GCP integration, competitive pricing.
- **Cons:** less mindshare/community content than OpenAI/Anthropic; API/tooling maturity varies by region.
- **When to use:** clients on GCP/Workspace, multimodal-heavy use cases (video/image analysis).
- **When to avoid:** if the client has zero Google infra and wants simplest integration path elsewhere.
- **Applications:** multimodal search, video/image understanding, Google Workspace AI features.
- **Core features:** native multimodality, huge context windows, GCP-native deployment.

## 2.4 Ollama (Local LLMs)
- **What it is:** Runs open-source LLMs (Llama, Mistral, etc.) locally on your own hardware.
- **Key focus points:** pulling/running models locally, model quantization basics (GGUF), REST API compatibility with OpenAI format.
- **Pros:** full data privacy (nothing leaves the machine), zero API cost after setup, works offline.
- **Cons:** limited by local hardware (GPU/RAM), generally weaker than frontier closed models, no built-in scaling for high traffic.
- **When to use:** regulated industries (banking, healthcare, gov), air-gapped environments, cost-free prototyping.
- **When to avoid:** need for frontier-level reasoning quality, need to scale to many concurrent users without heavy infra investment.
- **Applications:** on-prem enterprise AI, private prototyping, edge/offline deployments.
- **Core features:** local model hosting, OpenAI-compatible API, model library management.

## 2.5 OpenRouter
- **What it is:** A unified API gateway to 100+ models (GPT, Claude, Gemini, open-source) via one interface.
- **Key focus points:** model routing/fallback config, unified auth, cost comparison across providers.
- **Pros:** no vendor lock-in, easy A/B testing across models, single integration point, automatic fallback.
- **Cons:** slight added latency/abstraction layer, adds a third-party dependency, less granular control than provider-native APIs.
- **When to use:** multi-model strategies, fallback architecture, rapid experimentation across providers.
- **When to avoid:** when you need a provider-specific advanced feature not exposed through the gateway.
- **Applications:** model gateways, cost optimization, fallback/resilience architecture.
- **Core features:** unified API, model switching, usage/cost tracking.

## 2.6 Context Engineering
- **What it is:** Deliberately managing what information is sent to the model (compression, filtering, ordering) within its context window.
- **Key focus points:** context window limits, chunking strategy, relevance filtering, prompt compression, ordering (recency/relevance bias).
- **Pros:** improves accuracy, reduces cost/latency, prevents "lost in the middle" problems.
- **Cons:** requires ongoing tuning; over-compression can drop important info.
- **When to use:** any RAG pipeline, long conversations, multi-document tasks.
- **When to avoid:** trivial single-turn simple prompts don't need this.
- **Applications:** RAG pipelines, long chat memory management, document QA.
- **Core features:** chunking, re-ranking, summarization/compression, sliding-window memory.

## 2.7 Structured Outputs / JSON Schema
- **What it is:** Forcing the LLM's response into a strict, predefined data format.
- **Key focus points:** JSON schema definition, `response_format`/tool-based enforcement, validation with Pydantic.
- **Pros:** reliable machine-parseable output, removes brittle regex/string-parsing, integrates directly into apps.
- **Cons:** can slightly constrain model creativity/reasoning if over-applied; schema design mistakes cause silent failures.
- **When to use:** any time the output feeds into another system (API, database, UI).
- **When to avoid:** free-form creative writing tasks where rigid structure isn't needed.
- **Applications:** data extraction, form filling, API responses, agent tool arguments.
- **Core features:** schema validation, enums/typed fields, nested objects.

## 2.8 Pydantic
- **What it is:** Python library for data validation using type hints.
- **Key focus points:** defining models (`BaseModel`), validators, integration with FastAPI and structured LLM outputs.
- **Pros:** catches bad data early, self-documenting, integrates cleanly with FastAPI and LLM structured outputs.
- **Cons:** adds a small learning curve around validators/config; can feel verbose for very simple data.
- **When to use:** validating any data entering/leaving your AI system.
- **When to avoid:** quick throwaway scripts where validation overhead isn't worth it.
- **Applications:** API request/response validation, structured LLM output parsing, config management.
- **Core features:** type validation, custom validators, JSON schema generation.

---

# PHASE 3 (Month 3) — Vibe Coding & Rapid Prototyping

## 3.1 Cursor
- **What it is:** An AI-native code editor (VS Code fork) with deep in-editor AI pair programming.
- **Key focus points:** inline AI edits (Cmd+K), chat-with-codebase, `.cursorrules` for project conventions, multi-file edits.
- **Pros:** dramatically faster prototyping, understands whole-project context, great for POCs.
- **Cons:** can generate subtly wrong code if unreviewed; over-reliance risks skill atrophy; cost for heavy usage.
- **When to use:** rapid prototyping, exploring unfamiliar codebases, POC/demo building.
- **When to avoid:** don't blindly ship AI-generated code to production without review, especially security-sensitive code.
- **Applications:** POC development, refactoring, learning new codebases quickly.
- **Core features:** inline generation, codebase-aware chat, multi-file agentic edits.

## 3.2 Claude Code
- **What it is:** A command-line AI coding agent that can read/edit an entire codebase across multiple files.
- **Key focus points:** CLI workflow, giving it clear task scoping, reviewing diffs before accepting, using it for large refactors.
- **Pros:** handles large multi-file codebases well, works in terminal (scriptable/automatable), strong for full-stack generation.
- **Cons:** terminal-only interface has a learning curve; needs clear instructions to avoid scope creep.
- **When to use:** large codebase edits, full-stack scaffolding, reverse-engineering existing systems.
- **When to avoid:** tiny one-line fixes where a simple editor is faster.
- **Applications:** full-stack app generation, codebase migration, automated refactors.
- **Core features:** multi-file awareness, terminal-native, MCP integration.

## 3.3 v0.dev (Vercel)
- **What it is:** Generates working React UI components from natural-language descriptions.
- **Key focus points:** prompt-to-UI iteration, exporting/editing generated components, integrating into a real codebase.
- **Pros:** no designer needed for polished demo UIs, extremely fast frontend generation.
- **Cons:** generated code sometimes needs cleanup for production standards; less control than hand-coding for complex UI logic.
- **When to use:** client demo UIs, quick frontend mockups, POC interfaces.
- **When to avoid:** highly custom/branded production UIs needing pixel-perfect design systems.
- **Applications:** demo interfaces, admin dashboards, rapid frontend prototyping.
- **Core features:** prompt-to-component, Tailwind-based styling, React/Next.js output.

## 3.4 Replit Agent
- **What it is:** Browser-based AI agent that builds, runs, and deploys full applications with no local setup.
- **Key focus points:** end-to-end app generation in-browser, live preview, one-click deploy.
- **Pros:** zero setup, great for live client demos, works from any device.
- **Cons:** less control over infra/deployment specifics vs. self-managed cloud; can be costlier at scale.
- **When to use:** live discovery-call demos, zero-setup prototyping, teaching/onboarding.
- **When to avoid:** production-grade apps with specific infra/compliance requirements.
- **Applications:** live demos, hackathon-style builds, teaching tools.
- **Core features:** browser IDE, instant deploy, AI-driven full app generation.

## 3.5 Vercel (Deployment)
- **What it is:** Instant deployment platform for frontend/full-stack web apps.
- **Key focus points:** git-based deploys, preview URLs per branch/PR, environment variables, edge functions.
- **Pros:** deploy in seconds, automatic preview links, great DX, generous free tier.
- **Cons:** primarily optimized for Next.js/frontend — less ideal for heavy backend/ML workloads (pair with FastAPI on separate infra).
- **When to use:** deploying frontend/full-stack demos, client-facing "here's the live link" moments.
- **When to avoid:** heavy backend compute, GPU workloads, long-running background jobs (use AWS/GCP/Modal instead).
- **Applications:** R2P (Research to Product) deployment, live demo hosting, marketing/landing pages.
- **Core features:** git integration, preview deployments, serverless/edge functions.

---

# PHASE 4 (Month 4) — Evaluation, Safety, Ops & Fine-Tuning

## 4.1 System Prompts
- **What it is:** Hidden top-level instructions defining an AI's role, rules, tone, and boundaries.
- **Key focus points:** role definition, explicit dos/don'ts, output format rules, handling edge cases/refusals.
- **Pros:** sets consistent behavior across all conversations, centralizes control/guardrails.
- **Cons:** can be "jailbroken" if not carefully designed; overly long system prompts increase cost per call.
- **When to use:** every production AI assistant/agent.
- **When to avoid:** N/A — always needed, but keep concise and testable.
- **Applications:** chatbot personas, enterprise assistants, agent role definitions.
- **Core features:** role/persona setting, constraint definition, few-shot examples embedded in system prompt.

## 4.2 RAGAS
- **What it is:** An automated evaluation framework scoring RAG system quality (faithfulness, relevance, etc.).
- **Key focus points:** core metrics (faithfulness, answer relevance, context precision/recall), building an eval dataset, running eval pipelines in CI.
- **Pros:** turns "is the AI accurate?" into a measurable number; automatable; client-facing credibility.
- **Cons:** metric quality depends on eval dataset quality; can give false confidence if dataset is unrepresentative.
- **When to use:** any RAG system before/after launch, comparing RAG architecture changes.
- **When to avoid:** non-RAG, simple deterministic tasks where eval is unnecessary overhead.
- **Applications:** RAG quality benchmarking, regression testing, client trust reporting.
- **Core features:** faithfulness scoring, context precision/recall, automated dataset-based evaluation.

## 4.3 LangSmith
- **What it is:** An observability/tracing dashboard for LLM and agent applications.
- **Key focus points:** tracing chains/agents, debugging failed runs, prompt version comparison, dataset-based testing.
- **Pros:** makes silent failures visible, essential for debugging multi-step agent chains.
- **Cons:** tightly coupled to LangChain ecosystem (less useful outside it); another tool/cost to manage.
- **When to use:** debugging agent/RAG chains, monitoring production LLM apps.
- **When to avoid:** very simple single-call prompt apps with nothing to trace.
- **Applications:** production monitoring, agent debugging, prompt/version comparison.
- **Core features:** run tracing, dataset evals, prompt playground.

## 4.4 Helicone
- **What it is:** An observability tool tracking cost, latency, and errors for every LLM API call.
- **Key focus points:** proxy-based integration, cost dashboards, caching to reduce spend, alerting.
- **Pros:** simple integration (just change base URL), immediate cost visibility, caching saves money.
- **Cons:** adds a network hop (proxy) which can add minor latency; another vendor dependency.
- **When to use:** any production app where cost/latency monitoring matters (i.e., always in production).
- **When to avoid:** early local prototyping where cost is negligible.
- **Applications:** cost optimization, usage analytics, client cost-forecasting reports.
- **Core features:** request logging, cost dashboards, caching, rate-limit alerts.

## 4.5 Weights & Biases (W&B)
- **What it is:** Experiment tracking platform for ML/fine-tuning runs.
- **Key focus points:** logging metrics/hyperparameters, comparing runs, visualizing loss curves.
- **Pros:** industry-standard for ML experiment tracking, great visualizations, team collaboration features.
- **Cons:** overkill for simple prompt-engineering-only projects; learning curve for full feature set.
- **When to use:** fine-tuning projects, any iterative model-training work.
- **When to avoid:** projects with no training/fine-tuning component.
- **Applications:** LoRA/QLoRA training tracking, hyperparameter sweeps, model comparison.
- **Core features:** run logging, sweeps, artifact versioning, dashboards.

## 4.6 NeMo Guardrails
- **What it is:** A safety layer that constrains LLM outputs (topic boundaries, harmful content blocking).
- **Key focus points:** defining rails (input/output/dialog rails), topical restrictions, integrating with existing LLM apps.
- **Pros:** answers the client question "what stops it from going rogue?"; configurable, reusable rail definitions.
- **Cons:** added latency per guardrail check; can over-block legitimate edge-case queries if misconfigured.
- **When to use:** any customer-facing enterprise AI product.
- **When to avoid:** purely internal, low-risk prototyping tools.
- **Applications:** customer support bots, regulated-industry assistants, content moderation layers.
- **Core features:** topical rails, input/output moderation, jailbreak detection.

## 4.7 Red-Teaming
- **What it is:** Deliberately attacking your own AI system to find vulnerabilities before real users/attackers do.
- **Key focus points:** adversarial prompt design, jailbreak testing, prompt injection testing, documenting findings.
- **Pros:** builds client trust in regulated industries, catches issues before they become PR/legal problems.
- **Cons:** time-intensive, requires adversarial mindset/training, never fully "complete."
- **When to use:** before launching any client-facing or regulated-industry AI system.
- **When to avoid:** never skip for high-stakes deployments — but can be lighter-touch for low-risk internal tools.
- **Applications:** finance/healthcare AI compliance, pre-launch security review.
- **Core features:** adversarial prompt libraries, jailbreak/injection testing, structured reporting.

## 4.8 Fine-Tuning (Full / LoRA / QLoRA)
- **What it is:** Training an existing model further on your own data so it specializes in a domain.
- **Key focus points:** when fine-tuning beats RAG, dataset preparation/quality, Full vs LoRA (lightweight adapter) vs QLoRA (quantized, cheaper) trade-offs, evaluating post-training performance.
- **Pros:** deeply embeds domain style/knowledge/jargon into the model itself; LoRA/QLoRA make it cheap and fast vs full fine-tuning.
- **Cons:** requires quality labeled data (hard to get); doesn't solve "needs current/factual info" problems (RAG does that better); full fine-tuning is expensive and can cause catastrophic forgetting.
- **When to use:** consistent domain-specific tone/format needed, RAG alone insufficient (e.g., needs deep stylistic/behavioral change, not just facts).
- **When to avoid:** when the real need is "answer from our docs" (use RAG, much cheaper/faster) or when you don't have enough quality training data.
- **Applications:** domain-specialist assistants, custom writing style/tone, classification models.
- **Core features:** Full fine-tune (all weights), LoRA (low-rank adapters, cheap), QLoRA (quantized + LoRA, cheapest).

## 4.9 Transformer Internals
- **What it is:** Understanding how LLMs work under the hood (attention, KV cache, tokenization).
- **Key focus points:** self-attention intuition, KV cache (why it speeds up generation), tokenization basics, why "bigger isn't always better."
- **Pros:** lets you answer tough technical-team questions with real understanding, informs architecture decisions.
- **Cons:** deep theory isn't necessary day-to-day — risk of over-investing time here vs. applied skills.
- **When to use:** technical client conversations, choosing model size/architecture for a use case.
- **When to avoid:** don't need this to ship most FDE projects — treat as "enough to explain," not "enough to build a model from scratch."
- **Applications:** technical credibility in client conversations, informed model selection.
- **Core features:** self-attention, KV cache, positional encoding (conceptual level).

## 4.10 LLM vs SLM
- **What it is:** Decision framework for choosing large (LLM) vs. small (SLM) language models.
- **Key focus points:** cost-per-token trade-offs, latency needs, on-device/edge constraints, task complexity matching.
- **Pros of SLM:** cheap, fast, can run on-device/offline, good for narrow tasks.
- **Cons of SLM:** weaker general reasoning, may need fine-tuning to match LLM quality on complex tasks.
- **When to use SLM:** narrow, repetitive tasks, cost-sensitive high-volume use, edge/offline deployment.
- **When to use LLM:** complex reasoning, broad general knowledge, ambiguous/open-ended tasks.
- **Applications:** cost-optimization architecture decisions, edge AI, hybrid LLM+SLM pipelines.
- **Core features:** model-size trade-off analysis, routing logic (small model first, escalate to large if needed).

---

# PHASE 5 (Month 5) — RAG, Embeddings & Vector Databases

*(Learn in this exact order: Embeddings → Vector DB choice → Naive RAG → Corrective/Self-RAG → GraphRAG → Multi-modal RAG)*

## 5.1 Embeddings
- **What it is:** Converting text/images/data into numeric vectors so semantic similarity can be computed mathematically.
- **Key focus points:** how cosine similarity works, choosing an embedding model, embedding dimension trade-offs, chunking before embedding.
- **Pros:** enables meaning-based (not just keyword) search; foundation for RAG, recommendations, clustering.
- **Cons:** embedding quality varies by model/domain; re-embedding needed if you switch models; cost at scale.
- **When to use:** any semantic search, RAG, recommendation, or clustering system.
- **When to avoid:** exact keyword/structured lookups (plain SQL/full-text search is simpler and cheaper).
- **Applications:** semantic search, RAG retrieval, deduplication, recommendation engines.
- **Core features:** dense vector representation, similarity scoring, multi-modal embedding support.

## 5.2 Pinecone
- **What it is:** A managed cloud-native vector database.
- **Key focus points:** index creation, namespaces, metadata filtering, upsert/query API.
- **Pros:** fully managed (no infra headache), fast at scale, most commonly referenced in job postings/RFPs.
- **Cons:** cloud-only (no self-hosting), recurring cost, less control than self-hosted options.
- **When to use:** production RAG at scale, when you want zero infra management.
- **When to avoid:** clients requiring self-hosted/on-prem data (privacy/compliance) or very small/free prototypes (cost).
- **Applications:** production RAG pipelines, semantic search products, recommendation systems.
- **Core features:** managed scaling, metadata filtering, namespaces, hybrid search.

## 5.3 Weaviate
- **What it is:** Open-source vector database with built-in embedding generation.
- **Key focus points:** self-hosting setup, built-in vectorizer modules, GraphQL query API, hybrid search.
- **Pros:** self-hostable (no vendor lock-in), can generate embeddings in one step, open-source flexibility.
- **Cons:** self-hosting requires infra management/expertise; smaller managed-cloud market share than Pinecone.
- **When to use:** clients wanting self-hosted vector search, multi-modal RAG needs.
- **When to avoid:** teams wanting a fully hands-off managed service (Pinecone may be simpler).
- **Applications:** self-hosted enterprise RAG, multi-modal search.
- **Core features:** built-in vectorization, hybrid (keyword + vector) search, GraphQL API.

## 5.4 Chroma
- **What it is:** A lightweight, local-first vector database.
- **Key focus points:** in-memory/local persistence setup, quick integration with LangChain, simple API.
- **Pros:** zero-setup local prototyping, free, great for quick POCs/demos.
- **Cons:** not built for large-scale production traffic; limited managed/cloud offering vs Pinecone/Weaviate.
- **When to use:** early prototyping, client discovery-call demos, small-scale internal tools.
- **When to avoid:** large-scale production systems with high query volume.
- **Applications:** rapid RAG POCs, local development/testing, small internal tools.
- **Core features:** local persistence, simple Python API, easy LangChain integration.

## 5.5 RAG (Retrieval-Augmented Generation)
- **What it is:** The core pattern where the AI retrieves relevant documents before answering, grounding responses in real data.
- **Key focus points:** chunking strategy, retrieval (top-k) tuning, prompt construction with retrieved context, citation/source tracking.
- **Pros:** grounds answers in real/current data, reduces hallucination, doesn't require retraining the model, updatable (just update the doc store).
- **Cons:** retrieval quality bottlenecks overall accuracy ("garbage in, garbage out"); adds latency (retrieval + generation); chunking strategy is fiddly to get right.
- **When to use:** "answer from our docs" is the #1 client ask — nearly always the first architecture to reach for.
- **When to avoid:** when the task needs consistent style/behavior change rather than facts (fine-tuning instead), or when data is tiny enough to fit directly in the prompt.
- **Applications:** internal knowledge assistants, customer support bots, document Q&A, research assistants.
- **Core features:** chunking, embedding, retrieval, re-ranking, grounded generation.

## 5.6 Corrective RAG / Self-RAG
- **What it is:** RAG variants where the model evaluates its own retrieved documents and retries if quality is insufficient.
- **Key focus points:** retrieval quality scoring, retry/re-query logic, fallback to web search or "I don't know" response.
- **Pros:** significantly reduces hallucination vs naive RAG, handles "no good answer found" gracefully.
- **Cons:** added complexity and latency (multiple retrieval/generation passes); more moving parts to debug.
- **When to use:** high-stakes accuracy needs, when naive RAG shows hallucination issues.
- **When to avoid:** simple low-stakes use cases where naive RAG's speed/simplicity is preferable.
- **Applications:** enterprise support bots, compliance-sensitive Q&A, research tools.
- **Core features:** self-grading of retrieved docs, retry logic, fallback strategies.

## 5.7 GraphRAG
- **What it is:** RAG using a knowledge graph (connected entities/relationships) instead of flat document chunks.
- **Key focus points:** entity/relationship extraction, graph construction (Neo4j), multi-hop query traversal.
- **Pros:** handles relationship-heavy, interconnected knowledge far better than flat RAG; supports multi-hop reasoning.
- **Cons:** significantly more complex to build/maintain; graph construction/upkeep is labor-intensive.
- **When to use:** legal, medical, research, or other domains where relationships between entities matter as much as the facts themselves.
- **When to avoid:** simple document Q&A where flat RAG already performs well — don't over-engineer.
- **Applications:** legal case research, medical knowledge systems, complex research assistants.
- **Core features:** entity extraction, graph traversal, multi-hop retrieval.

## 5.8 Multi-modal RAG
- **What it is:** RAG that handles documents containing images, tables, and charts — not just plain text.
- **Key focus points:** multi-modal embedding models, table/image extraction from PDFs, combining text+image context at query time.
- **Pros:** handles real-world messy enterprise documents (most docs aren't plain text).
- **Cons:** more complex pipeline (extraction + multiple embedding types); higher cost/latency than text-only RAG.
- **When to use:** enterprise documents with charts/tables/scanned content (finance reports, technical manuals).
- **When to avoid:** clean, plain-text-only document sets — added complexity isn't worth it.
- **Applications:** financial report analysis, technical documentation Q&A, scanned-document search.
- **Core features:** multi-modal embeddings, table/image extraction, combined retrieval.

---

# PHASE 6 (Month 6) — Agents, Orchestration, No-Code & MCP

## 6.1 ReAct / Plan-and-Execute
- **What it is:** Foundational agent reasoning patterns — ReAct (think→act→observe loop) vs Plan-and-Execute (plan fully, then execute).
- **Key focus points:** the think-act-observe loop, when planning upfront beats reactive looping, combining both patterns.
- **Pros:** ReAct is flexible/adaptive to new info; Plan-and-Execute is more predictable/efficient for well-defined multi-step tasks.
- **Cons:** ReAct can loop inefficiently or get stuck; Plan-and-Execute is brittle if the initial plan is wrong and the world changes mid-execution.
- **When to use ReAct:** exploratory tasks with uncertain steps (e.g., research agents).
- **When to use Plan-and-Execute:** well-defined multi-step workflows (e.g., "book flight, then hotel, then send confirmation").
- **Applications:** research agents, task-automation agents, tool-using assistants.
- **Core features:** reasoning traces, tool-calling loop, plan generation/execution separation.

## 6.2 LangChain
- **What it is:** A toolkit/framework for chaining LLM calls, tools, and data sources together.
- **Key focus points:** chains vs. LCEL (LangChain Expression Language), memory modules, tool integration, retrievers.
- **Pros:** huge ecosystem/integrations, widely expected industry skill, good for RAG + simple agent chains.
- **Cons:** can feel over-abstracted/heavy for simple use cases; frequent breaking API changes historically; debugging chains can be opaque (mitigated by LangSmith).
- **When to use:** RAG pipelines, straightforward multi-step chains, when ecosystem integrations save time.
- **When to avoid:** very simple single-call tasks (raw API call is simpler); highly custom control-flow agents (LangGraph is better).
- **Applications:** RAG pipelines, chatbots, document processing chains.
- **Core features:** chains, retrievers, memory, tool/agent integration.

## 6.3 LangGraph
- **What it is:** A framework for building agents as graphs — supporting loops, branches, and retries (non-linear flows).
- **Key focus points:** defining nodes/edges, state management across the graph, conditional branching, human-in-the-loop interrupts.
- **Pros:** handles complex, non-linear, branching workflows that linear chains can't; explicit state control; good for production agents.
- **Cons:** steeper learning curve than plain LangChain; more upfront design work required.
- **When to use:** enterprise workflows with real branching/looping logic (approval flows, multi-condition automation).
- **When to avoid:** simple linear pipelines — overkill.
- **Applications:** complex enterprise automation, multi-step approval workflows, adaptive RAG pipelines.
- **Core features:** graph-based state machine, conditional edges, persistence/checkpointing.

## 6.4 CrewAI
- **What it is:** A framework for orchestrating a "crew" of AI agents, each with a distinct role, collaborating on a task.
- **Key focus points:** role/goal/backstory definition per agent, sequential vs. parallel task execution, inter-agent communication.
- **Pros:** intuitive role-based mental model, great for demoing "AI teams" to clients, good for clearly divisible tasks.
- **Cons:** coordination overhead between agents; can be less efficient than a single well-prompted agent for simple tasks.
- **When to use:** tasks that naturally divide into specialist roles (e.g., researcher + writer + editor).
- **When to avoid:** simple single-role tasks — a single agent is faster/cheaper.
- **Applications:** content pipelines, multi-step research-and-report generation, automation demos.
- **Core features:** role definition, Sequential/Parallel process patterns, task delegation.

## 6.5 AutoGen
- **What it is:** Microsoft's framework for agents that write, test, and self-correct code.
- **Key focus points:** conversable agents, code-execution agents, self-debugging loops.
- **Pros:** strong for code-generation/self-correction workflows; good multi-agent conversation patterns.
- **Cons:** narrower community/ecosystem than LangChain; code-execution agents need sandboxing for safety.
- **When to use:** dev-tool/internal automation clients, self-correcting coding agents.
- **When to avoid:** non-technical/non-coding agent tasks — other frameworks fit better.
- **Applications:** automated code generation/testing, internal dev-tooling agents.
- **Core features:** conversable agents, code execution + self-correction, group chat patterns.

## 6.6 Mem0
- **What it is:** A memory layer giving agents persistent recall of past conversations/preferences.
- **Key focus points:** short-term vs long-term memory, persistent user-specific memory, memory retrieval integration.
- **Pros:** makes agents feel continuous/personalized instead of starting from zero every session.
- **Cons:** added infra/storage complexity; privacy considerations for storing user data long-term.
- **When to use:** any assistant meant to feel personalized across sessions (customer support, personal assistants).
- **When to avoid:** single-session, stateless tools where memory adds no value.
- **Applications:** personalized assistants, long-running customer relationships, agent personalization.
- **Core features:** short-term/long-term/persistent/shared memory types.

## 6.7 n8n
- **What it is:** A visual, drag-and-drop workflow automation tool with AI node support.
- **Key focus points:** trigger→action node chaining, connecting APIs/apps visually, embedding LLM nodes in workflows.
- **Pros:** fast to build/demo automations, no-code accessible to non-engineers, huge library of pre-built integrations.
- **Cons:** less flexible than full code for highly custom logic; visual workflows can get messy at scale.
- **When to use:** clients wanting fast, budget-friendly automation without custom development.
- **When to avoid:** highly complex custom logic better suited to code (LangGraph/Python).
- **Applications:** business process automation, integration workflows, lightweight AI automations.
- **Core features:** visual workflow builder, huge app integration library, AI/LLM nodes.

## 6.8 Flowise
- **What it is:** A visual, no-code builder specifically for RAG and agent pipelines (LangChain under the hood).
- **Key focus points:** drag-and-drop chain/agent building, connecting vector stores and LLMs visually.
- **Pros:** great for demoing pipeline logic visually to non-technical stakeholders; fast POC building.
- **Cons:** less control/customization than raw code; can hit limits on complex custom logic.
- **When to use:** rapid RAG/agent POCs for non-technical audiences.
- **When to avoid:** production systems needing fine-grained custom control.
- **Applications:** client-facing RAG/agent demos, quick POC iteration.
- **Core features:** visual chain building, vector store integration, one-click deploy.

## 6.9 MCP (Model Context Protocol)
- **What it is:** A standardized protocol letting AI models connect to any external tool/database/service.
- **Key focus points:** MCP server/client architecture, building a custom MCP server, exposing tools/resources via MCP.
- **Pros:** becoming the industry standard (huge future-proofing value), decouples tool integration from any one framework.
- **Cons:** still an emerging standard (tooling/ecosystem maturing); requires understanding both client and server sides.
- **When to use:** building reusable, standardized tool integrations for AI agents/assistants.
- **When to avoid:** one-off simple integrations where a direct API call is faster to build.
- **Applications:** custom enterprise tool integrations, Claude Desktop extensions, standardized agent tooling.
- **Core features:** server/client protocol, tool/resource exposure, standardized schema.

## 6.10 Claude Desktop
- **What it is:** Anthropic's desktop app supporting MCP, letting Claude directly control local files/apps/systems.
- **Key focus points:** connecting custom MCP servers, local file/system automation use cases.
- **Pros:** demonstrates the "AI as OS layer" vision compellingly to clients; direct local system control.
- **Cons:** desktop-only (not a scalable multi-user server solution); still maturing feature set.
- **When to use:** demoing MCP capabilities, local power-user automation.
- **When to avoid:** multi-user/production server deployments (this is a client app, not infra).
- **Applications:** MCP demos, personal/local automation, forward-thinking client pitches.
- **Core features:** MCP client support, local system/file access, custom server connections.

## 6.11 Tavily
- **What it is:** An AI-optimized web search API built for LLM agents.
- **Key focus points:** query formatting for agent use, result cleaning/summarization, integrating into agent tool calls.
- **Pros:** clean, LLM-ready results (vs. scraping raw search HTML); purpose-built for agentic use.
- **Cons:** another paid API dependency; result quality depends on underlying search index coverage.
- **When to use:** any agent needing real-time web lookup capability.
- **When to avoid:** static/internal-knowledge-only tasks where web search isn't relevant.
- **Applications:** research agents, real-time fact-checking, Perplexity-style research tools.
- **Core features:** LLM-optimized search results, source citations, summarization.

## 6.12 Browserbase / E2B
- **What it is:** Tools letting AI agents control a real web browser to click, fill forms, and scrape pages.
- **Key focus points:** headless browser automation, session management, handling dynamic/legacy web UIs.
- **Pros:** automates workflows with no API available (legacy portals, manual web tasks).
- **Cons:** brittle if target site's UI changes; slower than direct API calls; more complex error handling needed.
- **When to use:** automating legacy web portals/systems with no API.
- **When to avoid:** whenever a direct API exists — always prefer API over browser automation when possible.
- **Applications:** legacy system automation, web scraping agents, form-filling automation.
- **Core features:** headless browser control, session persistence, DOM interaction.

---

# PHASE 7 (Month 7) — Backend, Full-Stack & Production Deployment

## 7.1 FastAPI
- **What it is:** A modern Python web framework for building fast APIs.
- **Key focus points:** path operations, Pydantic integration, async endpoints, dependency injection, auto-generated docs (Swagger).
- **Pros:** very fast (async-native), auto-generates interactive API docs, plays perfectly with Pydantic, easy learning curve.
- **Cons:** younger ecosystem than Django/Flask for some enterprise features (e.g., built-in admin panel).
- **When to use:** any AI product's backend API layer — the de facto standard for this stack.
- **When to avoid:** need for a heavy batteries-included framework with built-in admin/ORM out of the box (Django may fit better).
- **Applications:** AI service backends, webhook receivers, internal APIs.
- **Core features:** async support, automatic OpenAPI docs, Pydantic-based validation.

## 7.2 React / Next.js
- **What it is:** The standard JavaScript library (React) and framework (Next.js) for building modern web frontends.
- **Key focus points:** components/hooks, server vs. client components (Next.js App Router), API routes, streaming UI for AI responses.
- **Pros:** huge ecosystem, component reusability, Next.js gives SSR/routing/deployment simplicity (pairs perfectly with Vercel).
- **Cons:** steep learning curve for beginners; frequent ecosystem/tooling churn.
- **When to use:** any client-facing AI product UI.
- **When to avoid:** extremely simple static pages where plain HTML suffices.
- **Applications:** AI chat interfaces, dashboards, client-facing product UIs.
- **Core features:** component model, hooks, SSR/SSG, API routes.

## 7.3 Celery / Redis Queues
- **What it is:** A background task queue system (Celery) backed by Redis for async job processing.
- **Key focus points:** task definition, worker processes, queue monitoring, retry/failure handling.
- **Pros:** keeps the app responsive for long-running tasks, scalable worker pools, mature/battle-tested.
- **Cons:** adds infra complexity (broker + workers to manage); debugging distributed task failures can be tricky.
- **When to use:** long-running AI tasks (large document processing, batch analysis) that shouldn't block the user.
- **When to avoid:** simple, fast (<1-2 sec) requests — direct synchronous handling is simpler.
- **Applications:** batch document processing, scheduled AI jobs, async report generation.
- **Core features:** distributed task queue, retries, scheduling (Celery Beat), monitoring (Flower).

## 7.4 WebSocket / SSE
- **What it is:** Protocols for real-time, streaming communication between server and client.
- **Key focus points:** SSE for one-way streaming (great for LLM token streaming), WebSocket for full bidirectional communication.
- **Pros:** enables the "typing effect" UX users expect from AI products; feels fast and alive.
- **Cons:** more complex to implement/scale than plain REST; needs careful connection/reconnection handling.
- **When to use:** streaming LLM responses token-by-token, real-time collaborative features.
- **When to avoid:** simple request/response interactions where streaming adds no UX value.
- **Applications:** chat interfaces with streaming responses, live dashboards, real-time notifications.
- **Core features:** SSE (server→client stream), WebSocket (bidirectional), reconnection handling.

## 7.5 AWS Lambda / SageMaker
- **What it is:** AWS's serverless functions (Lambda) and managed ML model hosting platform (SageMaker).
- **Key focus points:** Lambda cold starts/timeouts, SageMaker endpoints for model serving, IAM permissions basics.
- **Pros:** #1 cloud platform (client expectation in many enterprise deals), Lambda scales to zero (pay only when used), SageMaker handles ML infra heavy-lifting.
- **Cons:** AWS learning curve/complexity; Lambda cold starts can add latency; cost can spiral without monitoring.
- **When to use:** enterprise clients standardized on AWS, serverless event-driven AI functions, hosted custom model serving.
- **When to avoid:** simple deployments where a simpler platform (Vercel/Modal) is faster to ship.
- **Applications:** serverless AI functions, enterprise-scale model hosting, event-driven pipelines.
- **Core features:** Lambda (serverless functions), SageMaker (model training/hosting/endpoints).

## 7.6 GCP Cloud Run / Vertex AI
- **What it is:** Google Cloud's containerized app hosting (Cloud Run) and managed ML platform (Vertex AI).
- **Key focus points:** container deployment to Cloud Run, Vertex AI model endpoints, IAM basics.
- **Pros:** simpler container deployment model than AWS in some ways, strong for clients already on GCP/Workspace, good Gemini integration.
- **Cons:** smaller enterprise market share than AWS in some industries; fewer FDEs experienced with it (double-edged: differentiator, but less community support).
- **When to use:** clients on Google Cloud/Workspace (common in India: BFSI, retail, media).
- **When to avoid:** clients with no GCP infra and no plan to adopt it.
- **Applications:** containerized AI app hosting, GCP-native ML deployments.
- **Core features:** Cloud Run (serverless containers), Vertex AI (managed ML platform).

## 7.7 Docker & Docker Compose
- **What it is:** Containerization tooling that packages an app + dependencies to run identically anywhere.
- **Key focus points:** writing a Dockerfile, multi-container orchestration with Compose, image optimization/layering, volumes/networking basics.
- **Pros:** eliminates "works on my machine" problems, consistent dev/prod parity, portable across any cloud.
- **Cons:** learning curve for networking/volumes; image bloat if not optimized; adds a layer of abstraction to debug.
- **When to use:** any production deployment — essentially mandatory for professional AI product delivery.
- **When to avoid:** trivial single-script local-only prototypes.
- **Applications:** packaging AI backends for deployment, local dev environment consistency, multi-service orchestration.
- **Core features:** Dockerfile, Compose multi-container setup, image layering/caching.

## 7.8 GitHub Actions (CI/CD)
- **What it is:** Automated testing/deployment pipelines triggered by GitHub events (push/PR).
- **Key focus points:** writing YAML workflows, test automation on PR, auto-deploy on merge to main, secrets management.
- **Pros:** automates safe, repeatable releases; catches bugs before production via automated tests.
- **Cons:** initial setup/YAML learning curve; misconfigured pipelines can block deploys or leak secrets if careless.
- **When to use:** any team/production project needing repeatable, safe deployments.
- **When to avoid:** solo, throwaway prototypes with no deployment pipeline needed.
- **Applications:** automated testing, auto-deployment, release management.
- **Core features:** workflow YAML, triggers, secrets management, matrix builds.

## 7.9 Modal / Replicate / BentoML
- **What it is:** Simplified cloud deployment platforms for AI models — upload and deploy without managing servers.
- **Key focus points:** function-as-a-service deployment for ML models, GPU access on demand, quick API endpoint generation.
- **Pros:** much faster than full AWS/GCP setup for MVPs/demos, handles GPU provisioning automatically.
- **Cons:** less control/customization than full cloud setups; can be costlier at true production scale vs. optimized self-managed infra.
- **When to use:** rapid client demos, MVP deployments, GPU-needing model serving without infra overhead.
- **When to avoid:** large-scale, cost-optimized production systems where custom infra control matters more.
- **Applications:** fast model deployment demos, MVP AI product hosting.
- **Core features:** serverless GPU functions, simple deploy commands, auto-scaling.

---

# 🎯 Full Learning-Order Checklist (Copy/Paste Tracker)

```
PHASE 0 — Prerequisites
[ ] Python            [ ] SQL & Databases     [ ] Git & GitHub
[ ] REST APIs & HTTP  [ ] Linux/CLI           [ ] Math & Stats Basics

PHASE 1 — Prompting (Month 1)
[ ] Prompt Engineering     [ ] Chain-of-Thought

PHASE 2 — LLM APIs & Structure (Month 2)
[ ] OpenAI GPT   [ ] Claude   [ ] Gemini   [ ] Ollama   [ ] OpenRouter
[ ] Context Engineering   [ ] Structured Outputs/JSON Schema   [ ] Pydantic

PHASE 3 — Vibe Coding (Month 3)
[ ] Cursor   [ ] Claude Code   [ ] v0.dev   [ ] Replit Agent   [ ] Vercel

PHASE 4 — Eval, Safety, Fine-Tuning (Month 4)
[ ] System Prompts   [ ] RAGAS   [ ] LangSmith   [ ] Helicone
[ ] Weights & Biases   [ ] NeMo Guardrails   [ ] Red-Teaming
[ ] Fine-Tuning (Full/LoRA/QLoRA)   [ ] Transformer Internals   [ ] LLM vs SLM

PHASE 5 — RAG & Vector DBs (Month 5)
[ ] Embeddings   [ ] Pinecone   [ ] Weaviate   [ ] Chroma
[ ] RAG   [ ] Corrective/Self-RAG   [ ] GraphRAG   [ ] Multi-modal RAG

PHASE 6 — Agents & MCP (Month 6)
[ ] ReAct/Plan-and-Execute   [ ] LangChain   [ ] LangGraph   [ ] CrewAI
[ ] AutoGen   [ ] Mem0   [ ] n8n   [ ] Flowise   [ ] MCP
[ ] Claude Desktop   [ ] Tavily   [ ] Browserbase/E2B

PHASE 7 — Backend & Deployment (Month 7)
[ ] FastAPI   [ ] React/Next.js   [ ] Celery/Redis   [ ] WebSocket/SSE
[ ] AWS Lambda/SageMaker   [ ] GCP Cloud Run/Vertex AI
[ ] Docker & Docker Compose   [ ] GitHub Actions   [ ] Modal/Replicate/BentoML
```

---

## Notes on This Roadmap
- **Order matters:** Phase 0 prerequisites should be at least conversational-level before Phase 1; you don't need mastery, just enough to not get blocked.
- **RAG before Agents:** Learn RAG (Phase 5) before deep agent orchestration (Phase 6) — most agents need retrieval as a core tool anyway.
- **Deployment last, but not least:** Phase 7 (backend/deployment) is placed last to match the original curriculum, but in practice, learning basic FastAPI + Docker earlier (even in parallel with Phase 2) makes every subsequent phase easier to actually ship and demo.
- **Sources:** Tool-specific curriculum placement and "why FDEs use it" framing sourced from the FDE Academy Tech Stack guide; the pros/cons, when-to-use/avoid, and prerequisite sections are added from general industry practice to make this a complete, standalone technical roadmap.