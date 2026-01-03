#!/bin/bash
# Setup /etc/hosts pour ErrorWatch dev (si nécessaire)

ENTRY="127.0.0.1 errorwatch.localhost api.errorwatch.localhost"

if grep -q "errorwatch.localhost" /etc/hosts 2>/dev/null; then
    echo "✅ Déjà configuré"
    exit 0
fi

echo "Ajout de: $ENTRY"
echo "$ENTRY" | sudo tee -a /etc/hosts

echo "✅ Done - URLs disponibles:"
echo "   http://errorwatch.localhost:4080"
echo "   http://api.errorwatch.localhost:4080"
