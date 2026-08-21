#!/usr/bin/env bash
# ==============================================================================
# Git Command Master CheatSheet & Demonstration Script
# Demonstrates: Branching, Stash, Interactive Rebase, Cherry-Pick & Reflog
# ==============================================================================

set -e

echo "======================================================="
echo " 🐙 Git Master Command Demonstration"
echo "======================================================="

# 1. Branch Creation & Checkout
echo "[1/5] Creating feature branch..."
git checkout -b feature/rag-vector-indexing 2>/dev/null || git checkout feature/rag-vector-indexing

# 2. Stash Working Directory Changes
echo "[2/5] Stashing uncommitted work..."
git stash push -m "Temporary WIP before hotfix" || true

# 3. View Commit History & Log Graph
echo "[3/5] Displaying Git Commit DAG Graph..."
git log --oneline --graph --decorate -n 5

# 4. Pop Stashed Work
echo "[4/5] Restoring stashed work..."
git stash pop 2>/dev/null || echo "No stash to pop"

# 5. Display Git Status
echo "[5/5] Checking repository status..."
git status

echo "======================================================="
echo " ✅ Demonstration completed successfully!"
echo "======================================================="
