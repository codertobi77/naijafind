#!/bin/bash

# Script de déduplication des suppliers via CLI Convex
# Usage: ./scripts/dedup-suppliers.sh [--prod] [--execute]

# Parse arguments
IS_PROD=""
DRY_RUN="true"

for arg in "$@"; do
  case $arg in
    --prod)
      IS_PROD="--prod"
      shift
      ;;
    --execute)
      DRY_RUN="false"
      shift
      ;;
  esac
done

echo "🔍 Mode: $(if [ "$DRY_RUN" = "true" ]; then echo "DRY RUN (prévisualisation)"; else echo "EXÉCUTION RÉELLE"; fi)"
echo "⏳ Analyse des doublons en cours..."
echo ""

# Exécuter la fonction Convex
if [ "$DRY_RUN" = "true" ]; then
  npx convex run suppliers:removeDuplicateSuppliers '{"dryRun":true}' $IS_PROD
else
  npx convex run suppliers:removeDuplicateSuppliers '{"dryRun":false}' $IS_PROD
fi
