---
name: image-compress
description: Compress images to reduce file size while preserving quality. Use when images are slowing down builds, uploads, or page loads.
---

# Image Compression

Compress images to reduce file size with minimal quality loss.

## Supported Formats

- PNG, JPEG, GIF, WebP, AVIF

## Tools

### Command Line

```bash
# Using sharp (Node.js)
npx sharp-cli input.png --resize 800 output.png

# Using magick (ImageMagick)
magick input.jpg -quality 85 -resize 1200 output.jpg

# Using cwebp (WebP)
cwebp -q 80 input.png -o output.webp

# Using avifenc (AVIF)
avifenc input.png -o output.avif
```

### Python

```bash
# Using Pillow
python3 -c "from PIL import Image; i=Image.open('input.png'); i.save('output.jpg', quality=85, optimize=True)"
```

## Common Patterns

### Compress Single Image

```bash
# Reduce to max 1200px width, 85% quality
magick input.png -resize 1200x1200/> -quality 85 output.jpg
```

### Batch Compress

```bash
# All PNGs in directory
for f in *.png; do magick "$f" -quality 85 -resize 1200x1200\> "${f%.png}-compressed.jpg"; done
```

### Convert to WebP

```bash
# WebP with good compression
cwebp -q 80 -resize 1200 0 input.png -o output.webp
```

## Quality Guidelines

| Use Case                   | Quality  | Format    |
| -------------------------- | -------- | --------- |
| High quality (screenshots) | 90%      | PNG/WebP  |
| Photos                     | 85%      | JPEG/WebP |
| Thumbnails                 | 70%      | WebP/AVIF |
| Icons/Logos                | Lossless | PNG/WebP  |

## Batch Processing

### Find Large Images

```bash
find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -size +100k -exec ls -lh {} \;
```

### Target Sizes

- Icons: < 10KB
- Thumbnails: < 50KB
- Full images: < 500KB
- Screenshots: < 1MB

## Notes/Inspiration

Inspired by [`opencode-image-compress`](https://www.npmjs.com/package/opencode-image-compress) - Image compression for OpenCode.
