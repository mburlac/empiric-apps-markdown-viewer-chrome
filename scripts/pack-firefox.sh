#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(grep '"version"' manifest.firefox.json | head -1 | sed -E 's/.*"([0-9.]+)".*/\1/')
OUT_DIR="dist"
OUT="$OUT_DIR/markdown-viewer-firefox-${VERSION}.zip"
STAGE="$OUT_DIR/firefox-stage"

mkdir -p "$OUT_DIR"
rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"

cp manifest.firefox.json "$STAGE/manifest.json"
cp -R icons src vendor "$STAGE/"

(cd "$STAGE" && zip -r "../../$OUT" \
  manifest.json \
  icons/icon-16.png icons/icon-32.png icons/icon-48.png icons/icon-128.png \
  src \
  vendor \
  -x "*.DS_Store" "*/.*" \
  >/dev/null)

echo "Created $OUT"
ls -lh "$OUT"
echo ""
echo "Dev load: about:debugging → Load Temporary Add-on → select"
echo "  $(pwd)/$STAGE/manifest.json"
