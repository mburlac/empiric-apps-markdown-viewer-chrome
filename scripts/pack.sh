#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(grep '"version"' manifest.json | head -1 | sed -E 's/.*"([0-9.]+)".*/\1/')
OUT_DIR="dist"
OUT="$OUT_DIR/markdown-viewer-${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUT"

zip -r "$OUT" \
  manifest.json \
  icons/icon-16.png icons/icon-32.png icons/icon-48.png icons/icon-128.png \
  src \
  vendor \
  -x "*.DS_Store" "*/.*" \
  >/dev/null

echo "Created $OUT"
ls -lh "$OUT"
