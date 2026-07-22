#!/usr/bin/env bash
set -e

# Usage: ./deploy.sh [EXISTING_SERVICE_NAME] [REGION] [PROJECT_ID]
SERVICE_NAME=${1:-${SERVICE_NAME:-"devforge-utilities"}}
REGION=${2:-${REGION:-"us-central1"}}
PROJECT_ID=${3:-${PROJECT_ID:-""}}

PROJECT_FLAG=""
if [ -n "$PROJECT_ID" ]; then
  PROJECT_FLAG="--project=$PROJECT_ID"
fi

echo "=========================================================="
echo "🚀 Redeploying to existing Google Cloud Run Service: $SERVICE_NAME"
echo "🌐 Region: $REGION"
if [ -n "$PROJECT_ID" ]; then
  echo "🆔 Project ID: $PROJECT_ID"
fi
echo "=========================================================="

# 1. Typecheck & verify production build
echo "📦 Running production build checks..."
npm run build

# Locate gcloud binary
GCLOUD_BIN=$(which gcloud 2>/dev/null || echo "$HOME/google-cloud-sdk/bin/gcloud")

if [ ! -x "$GCLOUD_BIN" ]; then
  echo "❌ Error: gcloud CLI not found. Please run: gcloud auth login"
  exit 1
fi

# 2. Build container image via Google Cloud Build
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
echo "🐳 Building container image: $IMAGE..."
"$GCLOUD_BIN" builds submit --tag "$IMAGE" $PROJECT_FLAG .

# 3. Deploy container image to Cloud Run service
echo "☁️ Deploying container image to Cloud Run service $SERVICE_NAME..."
"$GCLOUD_BIN" run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  $PROJECT_FLAG \
  --allow-unauthenticated \
  --quiet \
  --port 8080

echo "✅ Redeployment completed successfully! Service URL updated."
