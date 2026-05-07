#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=dist/screenshots

node scripts/gen-previews.js

for f in "$OUT"/preview-*.html; do
  base=$(basename "$f" .html)
  name="${base#preview-}"
  echo "Screenshotting $name..."
  "$CHROME" \
    --headless=new --disable-gpu --hide-scrollbars \
    --no-sandbox \
    --allow-file-access-from-files \
    --window-size=1280,800 \
    --virtual-time-budget=15000 \
    --run-all-compositor-stages-before-draw \
    --force-color-profile=srgb \
    --screenshot="$OUT/screenshot-$name.png" \
    "file://$PWD/$f" 2>&1 | tail -5
done

echo "=== Generated ==="
ls -la "$OUT"/screenshot-*.png
