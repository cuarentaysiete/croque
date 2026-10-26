# ◉ Croque

Editor de imágenes en el **dominio de frecuencia** para el navegador: pinta sobre el
espectro (muescas / notch filters) y observa el resultado en tiempo real.

Prototipo ligero de un solo archivo — HTML, CSS y JS embebidos, sin frameworks ni
build steps. Todo el procesado corre en el cliente con **HTML5 Canvas + OpenCV.js**
(WebAssembly, cargado por CDN).

## Cómo usar

Solo abre `index.html` en un navegador moderno (Chrome, Edge, Firefox, Safari).
Opcionalmente, sirve la carpeta para evitar restricciones de `file://`:

```bash
npx serve .
# o
python3 -m http.server 8000
```

1. (Opcional) **Cargar imagen** — cualquier foto; por defecto se carga `icon.jpg`.
2. **Pinta** sobre el canvas derecho (espectro): cada trazo atenúa el espectro y se
   **replica automáticamente en el punto espejo** `(−x, −y)` respecto al centro
   (simetría hermitiana), de modo que la IFFT devuelve siempre una imagen real.
3. Ajusta el **pincel**, elige la **acción** (atenuar ×10 %, anular, restaurar) y
   alterna la vista entre **Magnitud (log)** y **Fase**.
4. Prueba los **presets** Paso-Bajo / Paso-Alto (con borde coseno suave anti-ringing),
   **Restaurar todo**, y **Descargar PNG** del resultado.

## Pipeline

```
imagen → luminancia N×N (potencia de 2)
     → FFT 2D (cv.dft)
     → fftshift (DC al centro)
     → edición interactiva (pincel + presets)
     → ifftshift → IFFT 2D (cv.idft)
     → normalización 0..255 → canvas espacial
```

La resolución de la FFT (128/256/512) es ajustable; a 512 × 512 la IFFT se
recalcula en cada `requestAnimationFrame` para mantener la sensación de tiempo real.

## Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Aplicación completa (HTML + CSS + JS, OpenCV.js por CDN) |
| `icon.jpg` | Imagen por defecto |
