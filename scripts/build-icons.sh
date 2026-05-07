#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="icons/icon.svg"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Render SVG at 1024 (CoreGraphics via sips) then downsample for each size
sips -s format png -z 1024 1024 "$SRC" --out "$TMP/large.png" >/dev/null

for size in 16 32 48 128; do
  sips -z "$size" "$size" "$TMP/large.png" --out "icons/icon-${size}.png" >/dev/null
done
echo "Generated icons/icon-{16,32,48,128}.png"
