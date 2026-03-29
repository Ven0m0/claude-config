# Image Compressor

Compress images to reduce file size while maintaining quality.

## Features

- Support JPG, PNG, WebP, GIF
- Reduce file size significantly
- Maintain visual quality
- Bulk compression support

## Price

- **0.001 USDT** per compression

## Usage

```
"Compress this image https://example.com/photo.jpg"
"Reduce image size"
"Optimize this PNG"
```

## Example Response

```json
{
  "original_url": "https://example.com/photo.jpg",
  "original_size": "2.5MB",
  "compressed_size": "500KB",
  "reduction": "80%",
  "compressed_url": "https://cdn.example.com/optimized.jpg"
}
```

## Integration

- API Key: set via environment variable or local configuration at runtime
- Price: 0.001 USDT per call
