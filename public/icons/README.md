# PWA Icons

This directory should contain the following icon files for the PWA:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate these icons from a single source image (recommended: 512x512px) using tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://www.appicon.co/

The icon should represent the FlagCheck app - ideally a flag emoji or red flag symbol on a gradient background (indigo to pink).

## Quick SVG to PNG Conversion

If you have an SVG logo, you can use ImageMagick or online tools to generate all sizes:
```bash
# Example with ImageMagick (if installed)
convert logo.svg -resize 512x512 icon-512x512.png
convert logo.svg -resize 384x384 icon-384x384.png
convert logo.svg -resize 192x192 icon-192x192.png
convert logo.svg -resize 152x152 icon-152x152.png
convert logo.svg -resize 144x144 icon-144x144.png
convert logo.svg -resize 128x128 icon-128x128.png
convert logo.svg -resize 96x96 icon-96x96.png
convert logo.svg -resize 72x72 icon-72x72.png
```

