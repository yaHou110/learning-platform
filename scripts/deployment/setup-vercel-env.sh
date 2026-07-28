#!/usr/bin/env bash
# Vercel Environment Setup Helper
# Run this AFTER you have Vercel CLI installed and logged in
# This script helps you set all required env vars on Vercel

set -euo pipefail

echo "=============================================="
echo "Vercel Environment Variables Setup for Learning Platform"
echo "=============================================="
echo ""
echo "This script will prompt for each required variable and add it to Vercel."
echo "You need to have 'vercel' CLI installed and be logged in (vercel login)."
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel@latest"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Run: vercel login"
    exit 1
fi

# Link project if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "📦 Linking project to Vercel..."
    vercel link
fi

echo ""
echo "Enter the required environment variables:"
echo ""

# DATABASE_URL
read -p "DATABASE_URL (Railway Postgres public URL with sslmode=require): " DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    echo "$DATABASE_URL" | vercel env add DATABASE_URL production --yes
    echo "✅ DATABASE_URL added"
fi

# AUTH_SECRET
read -p "AUTH_SECRET (32+ bytes base64, generate with: openssl rand -base64 32): " AUTH_SECRET
if [ -n "$AUTH_SECRET" ]; then
    echo "$AUTH_SECRET" | vercel env add AUTH_SECRET production --yes
    echo "✅ AUTH_SECRET added"
fi

# NEXTAUTH_URL
read -p "NEXTAUTH_URL (production Vercel URL, e.g., https://learning-platform.vercel.app): " NEXTAUTH_URL
if [ -n "$NEXTAUTH_URL" ]; then
    echo "$NEXTAUTH_URL" | vercel env add NEXTAUTH_URL production --yes
    echo "✅ NEXTAUTH_URL added"
fi

# AUTH_TRUST_HOST
echo "true" | vercel env add AUTH_TRUST_HOST production --yes
echo "✅ AUTH_TRUST_HOST=true added"

# Optional: UPSTASH_REDIS_URL
read -p "UPSTASH_REDIS_URL (optional, for rate limiting): " UPSTASH_REDIS_URL
if [ -n "$UPSTASH_REDIS_URL" ]; then
    echo "$UPSTASH_REDIS_URL" | vercel env add UPSTASH_REDIS_URL production --yes
    echo "✅ UPSTASH_REDIS_URL added"
fi

# Optional: METRICS_TOKEN
read -p "METRICS_TOKEN (optional, 32 hex chars: openssl rand -hex 16): " METRICS_TOKEN
if [ -n "$METRICS_TOKEN" ]; then
    echo "$METRICS_TOKEN" | vercel env add METRICS_TOKEN production --yes
    echo "✅ METRICS_TOKEN added"
fi

echo ""
echo "=============================================="
echo "✅ All environment variables set on Vercel (production)"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Push to main to trigger deploy: git push origin main"
echo "2. Or manually deploy: vercel --prod"
echo "3. After first deploy, update NEXTAUTH_URL if the domain changed"
echo "4. Run smoke tests: curl -fsS https://your-domain.vercel.app/api/health"