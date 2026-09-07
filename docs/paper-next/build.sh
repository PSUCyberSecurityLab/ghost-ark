#!/usr/bin/env bash
# Bounded paper-next build: fail closed on evidence and claim-language checks.
set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

echo "[paper-next] 1/3 evidence binding"
(cd "$ROOT" && node tools/paper-next-evidence.mjs --check)
echo "[paper-next] 2/3 claim-language gate"
(cd "$ROOT" && node tools/research/check-forbidden-claims.mjs)
echo "[paper-next] 3/3 compile"
if command -v latexmk >/dev/null 2>&1; then
  (cd "$HERE" && latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex)
elif command -v tectonic >/dev/null 2>&1; then
  (cd "$HERE" && tectonic main.tex)
else
  echo "[paper-next] No latexmk or tectonic is available; no PDF was produced." >&2
  exit 3
fi
echo "[paper-next] OK: docs/paper-next/main.pdf"
