# 🐳 🐙 Git, GitHub, CI/CD & Docker Master Repository for AI Engineers & FDEs

Welcome to the **Git & Docker Master Repository**! This repository provides enterprise-grade reference guides, Dockerfiles, Docker Compose configurations, and GitHub Actions CI/CD workflows for AI Engineers, LLM Developers, and Forward Deployed Engineers (FDEs).

---

## 📚 Included Reference Guides & Documentation

- [🐙 **Git, GitHub & CI/CD Master Guide**](./GIT_GITHUB_CICD_GUIDE.md): Complete Git command reference, branching strategies (Trunk-Based / GitFlow), Git LFS for large AI models, and GitHub Actions CI/CD pipelines.
- [🐳 **Docker & Containerization Master Guide**](./DOCKER_CONTAINERIZATION_GUIDE.md): Multi-stage Dockerfiles, Docker Compose orchestration, GPU acceleration (NVIDIA CUDA), and security hardening checklist.

---

## 🚀 Key Topics Covered

### 1. Git & Version Control Operations
- Directed Acyclic Graph (DAG) commit trees.
- Interactive rebase (`git rebase -i`), squashing, and cherry-picking (`git cherry-pick`).
- Undoing mistakes safely (`git revert`, `git reset --soft/--hard`, `git reflog`).
- Git LFS for LLM weights and vector embeddings (`.bin`, `.onnx`, `.parquet`, `.safetensors`).

### 2. GitHub Actions CI/CD Automation
- Automated testing & RAG evaluation gates.
- PII scrubbing & secret scanning filters.
- Automatic container build & push to Azure Container Registry (ACR) / Docker Hub.

### 3. Production Docker & Containerization
- Multi-stage Docker builds reducing image sizes from ~1.5GB to <250MB.
- Docker Compose multi-service setup (FastAPI App + Redis Cache + PGVector / ChromaDB).
- Non-root security user enforcement & read-only file systems.

---

## 📦 Reference Configuration Files

- `Dockerfile`: Multi-stage production container build template.
- `docker-compose.yml`: Multi-container architecture setup.
- `.gitignore`: Production Git exclusion rules for Node.js, Python, & AI models.
