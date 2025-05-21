#!/bin/bash

# Script om duplicatie met hoofdletter vs kleine letter conflict op te lossen
# Dit prepareert de codebase voor deployment op Render/Vercel

echo "Start opschonen van bestandsnaam conflicten..."

# Lijst van mappen om te controleren
DIRECTORIES=(
  "client/src/components"
  "client/src/hooks"
  "client/src/pages"
)

# Functie om duplicate bestanden op te sporen en op te schonen
cleanup_duplicates() {
  local directory=$1
  local pattern=$2
  local preferred=$3
  
  # Zoek naar bestanden die voldoen aan het patroon
  files=$(find $directory -name "$pattern" | sort)
  
  # Als we duplicaten vinden
  if [ $(echo "$files" | wc -l) -gt 1 ]; then
    echo "Duplicaten gevonden voor $pattern in $directory"
    
    # Eerst het gewenste bestand vinden en behouden
    preferred_file=$(find $directory -name "$preferred" 2>/dev/null)
    
    if [ -n "$preferred_file" ]; then
      echo "Behoud $preferred_file"
      
      # Verwijder andere versies
      for file in $files; do
        if [ "$file" != "$preferred_file" ]; then
          echo "Verwijder duplicate: $file"
          rm "$file"
        fi
      done
    else
      # Als het gewenste bestand niet bestaat, bewaar de eerste en verwijder de rest
      first_file=$(echo "$files" | head -n 1)
      echo "Bewaar $first_file (preferente versie niet gevonden)"
      
      for file in $files; do
        if [ "$file" != "$first_file" ]; then
          echo "Verwijder duplicate: $file"
          rm "$file"
        fi
      done
    fi
  fi
}

# Opschonen van specifieke probleemgevallen
cleanup_duplicates "client/src/hooks" "*mobile*" "use-mobile.ts"
cleanup_duplicates "client/src/hooks" "*sidebar*" "use-sidebar-safe.ts"

# Verplaats de veilige versie naar de standaard naam
if [ -f "client/src/hooks/use-sidebar-safe.ts" ]; then
  echo "Verplaats gebruik de veilige sidebar versie"
  mv "client/src/hooks/use-sidebar-safe.ts" "client/src/hooks/use-sidebar.ts"
fi

# Zoek naar conflicterende .tsx/.ts bestanden met verschillende hoofdletters
cleanup_duplicates "client/src/components/layout" "*sidebar*" "Sidebar.tsx"
cleanup_duplicates "client/src/components/layout" "*header*" "Header.tsx"

# Verwijder alle .backup bestanden
echo "Verwijderen van .backup bestanden..."
find client/src -name "*.backup" -delete
find client/src -name "*.broken*" -delete
find client/src -name "*.orig_backup" -delete

echo "Opschonen voltooid!"