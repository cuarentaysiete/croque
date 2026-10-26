# Contexto y Objetivo
Actúa como un desarrollador web experto en procesamiento digital de señales (DSP) y visión por computador. Tu objetivo es generar el código completo para una aplicación web de un solo archivo (`index.html` que incluya HTML, CSS y JS embebido) que permita editar imágenes en el dominio de frecuencia en tiempo real.

Se trata de un prototipo ligero, sin frameworks (nada de React, Angular o build steps). Todo debe ejecutarse en el lado del cliente (navegador) usando HTML5 Canvas y una librería externa de matemáticas/FFT cargada mediante CDN (se recomienda encarecidamente usar OpenCV.js o en su defecto una librería de FFT en JS que maneje matrices 2D).

# Arquitectura y Diseño de la Interfaz
La interfaz debe ser limpia, moderna y responsiva, dividida en dos paneles principales:
1. **Dominio Espacial (Izquierda):** Un `<canvas>` que muestra la imagen original en escala de grises. Este canvas se actualizará en tiempo real al hacer cambios en el panel derecho.
2. **Dominio de Frecuencia (Derecha):** Un `<canvas>` interactivo que muestra el espectro de la imagen. El usuario podrá usar el ratón para pintar sobre este canvas (funcionando como un pincel de enmascaramiento).

**Controles UI (Barra superior o lateral):**
- Input para cargar imagen (File API).
- Slider para ajustar el tamaño del pincel.
- Botones de "Presets": Filtro Paso-Bajo (círculo central) y Filtro Paso-Alto (anillo exterior).
- Toggle / Radio Buttons: Alternar la visualización del canvas de frecuencia entre "Magnitud" (por defecto, en escala logarítmica) y "Fase".

# Flujo de Procesamiento y Reglas Matemáticas

## 1. Carga y Preparación
- Al cargar la imagen, redimensiónala a una resolución fija que sea potencia de 2 (ej. $512 \times 512$ píxeles) para optimizar el rendimiento de la FFT.
- Convierte la imagen a escala de grises (luminancia) de forma inmediata.

## 2. Transformada (Directa)
- Aplica una 2D FFT sobre la imagen en escala de grises.
- Obtendrás una matriz de números complejos (Parte Real y Parte Imaginaria).
- Aplica la operación `fftshift` para mover el componente DC (frecuencia cero) al centro geométrico del canvas.
- Calcula la **Magnitud** ($|F| = \sqrt{Re^2 + Im^2}$) y aplícale una escala logarítmica para que sea visible por el ojo humano. Renderiza esto en el canvas derecho.

## 3. Interactividad (El Pincel)
- El usuario podrá pintar en el canvas de frecuencia. Al hacer clic y arrastrar (pincel "Muesca" o Notch Filter), el usuario dibujará "negro" (poniendo el valor del espectro a 0 o atenuándolo fuertemente).
- **REGLA CRÍTICA (Simetría Hermitiana):** Para que la Transformada Inversa resulte en una imagen estrictamente real, cualquier trazo de pincel dibujado en las coordenadas $(x, y)$ respecto al centro del canvas DEBE replicarse automáticamente en las coordenadas opuestas $(-x, -y)$.
- Al borrar/atenuar una zona, debes actualizar los datos complejos subyacentes (poniendo a 0 la parte real e imaginaria de esos píxeles).

## 4. Transformada Inversa (Tiempo Real)
- En cada ciclo de dibujado (evento `mousemove` con el ratón presionado), toma la matriz compleja modificada.
- Aplica `ifftshift` (deshacer el centrado).
- Aplica la 2D IFFT (Transformada Inversa).
- Normaliza los valores resultantes al rango 0-255 y dibuja el resultado en el canvas del Dominio Espacial (Izquierda).
- Esto debe ocurrir con suficiente rapidez para dar sensación de tiempo real (usar `requestAnimationFrame` u optimizar el pintado si es necesario).

# Requisitos del Código a Generar
- Genera TODO en un único bloque de código (HTML).
- Usa CSS semántico (puedes usar CSS Grid o Flexbox para el layout).
- Comenta las funciones clave: carga de imagen, FFT, IFFT, shift y la lógica del pincel simétrico.
- Asegúrate de incluir el tag `<script src="...">` con la CDN adecuada para la librería matemática que elijas (ej. `https://docs.opencv.org/4.x/opencv.js`). Si usas OpenCV.js, envuelve la inicialización en `cv['onRuntimeInitialized'] = () => { ... }` para evitar errores de carga.