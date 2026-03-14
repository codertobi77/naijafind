#!/bin/bash

# Script pour calculer les correspondances en boucle jusqu'à ce que tout soit traité

echo "Démarrage du calcul des correspondances..."
echo ""

lot=1
total=0

while true; do
  result=$(npx convex run productMigration:computeMatchesForAllProductsCLI '{"batchSize":5,"onlyWithoutMatches":false,"autoApproveHighConfidence":true}' --prod 2>&1)
  
  processed=$(echo "$result" | grep -o '"totalProcessed":[0-9]*' | cut -d: -f2)
  updated=$(echo "$result" | grep -o '"matchesUpdated":[0-9]*' | cut -d: -f2)
  remaining=$(echo "$result" | grep -o '"remainingProducts":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$processed" ]; then
    echo "Lot $lot: erreur ou terminé"
    break
  fi
  
  total=$((total + processed))
  echo "Lot $lot: $processed produits, $updated maj (total: $total)"
  
  if [ "$remaining" = "all done" ] || [ "$processed" = "0" ]; then
    echo ""
    echo "Terminé ! Total: $total produits traités"
    break
  fi
  
  lot=$((lot + 1))
  sleep 1
done
