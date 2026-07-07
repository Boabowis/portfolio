# Terminal de Portfolio Personal

Este repositorio contiene el código fuente de mi portfolio personal, diseñado bajo una estética de terminal informático de fósforo verde. Actúa como el centro principal de mis proyectos y estudios técnicos de ingeniería de software.

## Estructura de Proyectos y Módulos

El repositorio está organizado en módulos independientes que demuestran diferentes facetas de desarrollo Full Stack, diseño de base de datos y programación interactiva:

### 1. Log Sentinel (Dashboard SOC y Análisis de Amenazas)
*   **Ubicación:** `log-sentinel/`
*   **Tecnologías:** Python FastAPI, SQLite, Vanilla JavaScript (ES6+), Chart.js.
*   **Descripción:** Un panel de monitorización de seguridad (Security Operations Center) interactivo. Dispone de un backend en FastAPI que registra eventos de red en una base de datos SQLite indexada. Implementa consultas complejas de threat hunting (detección de fuerza bruta, exfiltración masiva e IPs reputacionales de Feodo Tracker) y un simulador de inyección de ataques. Cuenta con un fallback automático de modo demostración en el cliente para su ejecución estática.
*   **Ver documentación técnica:** [README de Log Sentinel](log-sentinel/README.md)

### 2. Simulador de Montaje Físico (Puzzle Game)
*   **Ubicación:** `puzzle-game/`
*   **Tecnologías:** Vanilla JavaScript (ES6+), Web Audio API, CSS3.
*   **Descripción:** Un motor interactivo de posicionamiento y validación matricial de componentes sobre el navegador. Destaca por el uso de Web Audio API para la síntesis de audio analógico por software en tiempo real, gestión nativa de eventos de arrastre y una interfaz inmersiva de terminal con controles de personalización y tutorial guiado.
*   **Ver documentación técnica:** [README del Simulador](puzzle-game/README.md)

### 3. Caso de Estudio: Arquitectura Híbrida Cloud (App de Prácticas)
*   **Ubicación:** `case_study_turismo.md`
*   **Tecnologías:** Dart, Flutter, Cloud Firestore, Firebase Storage, Python.
*   **Descripción:** Un desglose técnico pormenorizado sobre la optimización de costes y latencia en una base de datos móvil NoSQL a gran escala. Analiza la migración de esquemas hacia modelos de almacenamiento indexado en CDN, logrando una reducción del 70% en lecturas de bases de datos y la implementación de reglas de validación criptográfica en la nube.

## Características del Terminal Principal

La interfaz del portafolio simula un monitor de tubo (CRT) clásico e incluye:
*   **Efectos Visuales Avanzados:** Líneas de barrido analógico (scanlines), aberración cromática en texto y parpadeo de pantalla controlado por CSS.
*   **Efecto Typewriter:** Revelación progresiva de caracteres por software para simular la velocidad de transmisión de terminales antiguos.
*   **Integración de API de Correo:** Formulario interactivo integrado con Formspree para la captación asíncrona de mensajes sin redirecciones.
*   **Internacionalización (i18n):** Traducción dinámica e instantánea de toda la terminal entre español e inglés controlada desde el frontend.

## Instalación y Uso Local

Para explorar la integración completa con bases de datos y simulación real en local:

1. Clonar el repositorio.
2. Levantar el motor de detección de logs (requiere Python 3.10+):
   ```bash
   cd log-sentinel
   pip install fastapi uvicorn
   python app.py
   ```
3. Abrir el archivo `index.html` del portafolio en tu navegador para interactuar con todos los módulos.
