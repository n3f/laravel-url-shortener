#!/bin/bash

# Script to regenerate favicon files from the shared logo
# The single source of truth is now resources/assets/logo.svg

echo "Regenerating favicon files..."

# Copy the SVG from the single source of truth
cp resources/assets/logo.svg public/favicon.svg

# Generate ICO file
magick public/favicon.svg -resize 32x32 public/favicon.ico

# Generate Apple touch icon
magick public/favicon.svg -resize 180x180 public/apple-touch-icon.png

echo "Favicon files updated!"
echo "Single source of truth: resources/assets/logo.svg"
