# Simulador de Montaje Físico e Interfaz de Control

Este módulo contiene un motor interactivo de posicionamiento desarrollado en JavaScript puro (Vanilla JS), diseñado para simular el montaje y verificación de módulos de energía bajo una interfaz retro-futurista de terminal. El proyecto demuestra habilidades clave en programación estructurada en el lado del cliente y optimización del DOM sin el uso de librerías externas.

## Características Técnicas de Ingeniería

### 1. Control de Estado en Memoria (State Management)
*   Implementación de una máquina de estados para gestionar las diferentes fases del juego: carga de sistemas, selección de modo ("Puertas" y "Secuencias"), calibración y tutorial interactivo.
*   Preservación del estado del juego en almacenamiento local (`localStorage`) para persistencia entre sesiones.

### 2. Motor de Posicionamiento Drag & Drop
*   Desarrollado sobre las APIs nativas del navegador, eliminando dependencias de frameworks externos.
*   Cálculo geométrico dinámico del área de inserción para la correcta detección de colisiones y validación de coordenadas en el lienzo del tablero.
*   Algoritmos de verificación matricial para contrastar el orden e inclinación de los componentes colocados contra la solución teórica del circuito.

### 3. Síntesis de Sonido en Tiempo Real
*   Utilización del estándar **Web Audio API** para generar efectos sonoros sintéticos en tiempo real.
*   Osciladores configurados dinámicamente (`OscillatorNode`) con rampas de ganancia analógicas para evitar chasquidos en el flujo de reproducción de audio.
*   Simulación de alarmas, ruidos de carga y confirmaciones acústicas generados directamente mediante código matemático sin archivos de audio estáticos.

### 4. Estilos y Adaptabilidad CSS3
*   Efectos visuales CRT con simulación de líneas de barrido (*scanlines*), parpadeo analógico y resplandor de fósforo verde.
*   Layout responsive implementado mediante CSS Grid y flexbox avanzado para permitir el escalado de la rejilla de juego en cualquier proporción de pantalla.

## Archivos del Módulo

*   `index.html`: Estructura semántica del simulador e inicialización de elementos del tutorial interactivo.
*   `style.css`: Hojas de estilos del terminal, animaciones del monitor de tubo y transformaciones espaciales en 2D.
*   `script.js`: Lógica del motor físico, controladoras de eventos de arrastre, lógica del tutorial y síntesis de audio.
