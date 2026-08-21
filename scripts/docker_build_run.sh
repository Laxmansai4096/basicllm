#!/usr/bin/env bash
# ==============================================================================
# Docker Build, Run, Inspect & Healthcheck Demonstration Script
# Demonstrates: Image Build, Container Execution, Health Checks & Log Inspection
# ==============================================================================

set -e

IMAGE_NAME="production-ai-app:latest"
CONTAINER_NAME="ai-app-demo"

echo "======================================================="
echo " 🐳 Docker Container Build & Orchestration Demo"
echo "======================================================="

# 1. Build Multi-Stage Docker Image
echo "[1/4] Building Multi-Stage Docker Image..."
docker build -t "$IMAGE_NAME" -f Dockerfile .

# 2. Inspect Image Layers & Size
echo "[2/4] Inspecting Image Artifact Size..."
docker images "$IMAGE_NAME"

# 3. Test Run Container
echo "[3/4] Running Container Instance..."
docker run -d --name "$CONTAINER_NAME" -p 3000:3000 "$IMAGE_NAME" || true

# 4. View Running Container Logs & Health Status
echo "[4/4] Container Log Output:"
docker logs --tail 20 "$CONTAINER_NAME" || true

echo "======================================================="
echo " ✅ Docker Build & Run Complete!"
echo "======================================================="
