#!/usr/bin/env bash
# Instala el skill `watch` en la carpeta global de skills (~/.claude/skills)
# para que esté disponible en todas las sesiones de Claude, no solo en este repo.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DST="${HOME}/.claude/skills/watch"

mkdir -p "${HOME}/.claude/skills"
rm -rf "$DST"
cp -R "$SRC" "$DST"
chmod +x "$DST"/scripts/*.py "$DST"/scripts/*.sh 2>/dev/null || true

echo "Skill 'watch' instalado en: $DST"
echo "Úsalo con: /watch <url-o-ruta-del-video> [pregunta]"
