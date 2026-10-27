# ◉ Croque

A **frequency-domain** image editor for the browser: paint on the spectrum
(notch filters) and watch the result update in real time.

Single-file lightweight prototype — HTML, CSS and JS all embedded, no frameworks,
no build steps. Everything runs client-side with **HTML5 Canvas** and a **pure
JavaScript FFT engine** (no external libraries).

## How to use

Just open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
Optionally serve the folder to avoid `file://` restrictions:

```bash
npx serve .
# or
python3 -m http.server 8000
```

1. (Optional) **Load image** — any photo; the bundled `icon.png` is loaded by default.
2. **Paint** on the right canvas (spectrum): every stroke attenuates the spectrum
   and is **automatically mirrored at `(−x, −y)`** about the center
   (Hermitian symmetry), so the IFFT always yields a real image.
3. Tune the **brush size**, pick the **action** (attenuate ×10 %, null, restore)
   and switch the view between **Magnitude (log)** and **Phase**.
4. Try the **Low-Pass** / **High-Pass** presets (with a smooth cosine edge to avoid
   ringing), **Reset all**, and **Download PNG** of the result.

## Pipeline

```
image → luminance N×N (power of two)
     → 2D FFT (pure-JS Cooley–Tukey)
     → fftshift (DC to center)
     → interactive editing (brush + presets)
     → ifftshift → 2D IFFT
     → 0..255 normalization → spatial canvas
```

The FFT resolution (128/256/512) is selectable. At 512×512 the IFFT is recomputed
every `requestAnimationFrame` (~40 ms each) to keep the feel real-time.

## Design notes

- **Pure JS FFT** (radix-2 Cooley–Tukey with precomputed twiddles and bit-reversal
  permutation, reusable buffers): forward/inverse 512×512 in ~40 ms. No OpenCV.js
  — the public builds of that library don't ship the `dft`/`idft` module.
- **Hermitian symmetry**: every edit writes the conjugate value to the mirrored
  point `(N−x, N−y) mod N`, keeping the inverse transform strictly real.
- **Log-magnitude display**: `L = 1 + ln(1+|F|) / ln(1+max)` with a dark→cyan
  colormap; the phase view is a gray-scale of the raw phase.
- **Cosine filter edges** in the presets to reduce ringing (Gibbs) artifacts.
- **No server, no installation, no network**: it works fully offline, even from
  `file://`.

## Files

| File | Description |
|---|---|
| `index.html` | Complete application (HTML + CSS + JS, self-contained FFT, zero dependencies) |
| `icon.png` | App icon and default example image |
| `icon.jpg` | Alternative example image (JPEG) |

## License

MIT — see [LICENSE](LICENSE).
