# CASEC Logo Pack

## Files Included

| File | Size | Usage |
|------|------|-------|
| `logo-512x512.png` | 512×512 | PWA manifest, high-res displays |
| `logo-192x192.png` | 192×192 | PWA manifest, Android icons |
| `apple-touch-icon.png` | 180×180 | iOS home screen icon |
| `favicon.ico` | Multi-size | Browser tab icon (legacy) |
| `favicon-32x32.png` | 32×32 | Modern browser favicon |
| `favicon-16x16.png` | 16×16 | Small favicon |
| `logo.svg` | Scalable | Vector format for any size |

## HTML Usage

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- PWA Manifest Icons -->
<link rel="manifest" href="/manifest.json">
```

## manifest.json Example

```json
{
  "icons": [
    {
      "src": "/logo-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/logo-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```
