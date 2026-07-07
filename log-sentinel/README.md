# Log Sentinel y Threat Matcher

Log Sentinel es un panel de seguridad en tiempo real y motor de búsqueda de amenazas (Threat Hunting) diseñado para ingerir, procesar y analizar registros de actividad de red. Contrasta automáticamente el tráfico activo con indicadores de compromiso (IoC) conocidos y ejecuta consultas analíticas complejas en SQLite para detectar amenazas persistentes avanzadas (APTs), anomalías de seguridad y credenciales comprometidas.

## Arquitectura y Componentes

El sistema se compone de un backend modular en Python y un frontend web ligero:

1. Capa de Base de Datos (database.py): Utiliza SQLite para la persistencia de logs, configurado con índices compuestos en columnas críticas (ip_origen, timestamp) para optimizar los tiempos de respuesta de las consultas de detección.
2. Feed de Inteligencia de Amenazas (threat_intel.py): Descargador dinámico que obtiene y actualiza una lista negra de IPs de servidores de comando y control (C2) directamente desde el feed de Feodo Tracker (abuse.ch). Si no hay conexión a internet, recurre a una base de datos local predefinida.
3. Simulador de Actividad (generator.py): Inyecta tráfico de red simulado (normal) junto con comportamientos de atacantes (fuerza bruta SSH, exfiltración masiva de datos y conexiones con redes C2).
4. Motor de Threat Hunting (hunter.py): Contiene la lógica central encargada de ejecutar consultas SQL complejas para detectar anomalías en tiempo real.
5. Servidor API Web (app.py): Desarrollado con FastAPI para exponer endpoints que controlan las simulaciones, actualizan los feeds de inteligencia y devuelven métricas estructuradas.
6. Panel de Control Frontend (static/index.html): Interfaz HTML5 con hojas de estilo en Vanilla CSS (soporta modo claro y oscuro turquesa) y Chart.js para visualizar el volumen de tráfico de red en tiempo real.

## Esquema e Indexación de la Base de Datos

El modelo relacional almacena dos tablas principales:

### 1. `logs_red`
Registra los eventos de actividad de red analizados.
* `id` (INTEGER, Primary Key)
* `timestamp` (TEXT)
* `ip_origen` (TEXT)
* `usuario` (TEXT)
* `evento` (TEXT)
* `puerto_destino` (INTEGER)
* `bytes_transferidos` (INTEGER)

Se aplica un índice compuesto sobre `(ip_origen, timestamp)` para acelerar las búsquedas de correlación temporal y espacial.

### 2. `threat_intel`
Almacena hosts maliciosos conocidos en listas negras.
* `ip_maliciosa` (TEXT, Unique Primary Key)
* `tipo_amenaza` (TEXT)
* `reputacion_score` (INTEGER)
* `timestamp_actualizacion` (TEXT)

## Consultas SQL de Threat Hunting

El motor de detección utiliza tres consultas SQL de análisis de seguridad avanzadas:

### 1. Correlación con Threat Intelligence
Cruza el tráfico de red reciente con la lista negra de IPs de comando y control:
```sql
SELECT l.timestamp, l.ip_origen, l.usuario, l.evento, l.bytes_transferidos, t.tipo_amenaza, t.reputacion_score
FROM logs_red l
JOIN threat_intel t ON l.ip_origen = t.ip_maliciosa
ORDER BY l.timestamp DESC
```

### 2. Detección de Fuerza Bruta en Autenticación
Identifica direcciones IP de origen que registran 5 o más intentos fallidos de inicio de sesión en un intervalo corto de tiempo, agrupadas por usuario e IP:
```sql
SELECT ip_origen, usuario, COUNT(*) as total_intentos_fallidos,
       MIN(timestamp) as inicio_ataque, MAX(timestamp) as fin_ataque
FROM logs_red
WHERE evento = 'login_failed'
GROUP BY ip_origen, usuario
HAVING total_intentos_fallidos >= 5
ORDER BY fin_ataque DESC
```

### 3. Detección de Exfiltración Masiva de Datos
Localiza sistemas internos que transfieren más de 500 megabytes (524.288.000 bytes) de datos hacia destinos externos, monitorizando además el número de puertos destino contactados:
```sql
SELECT ip_origen, 
       ROUND(SUM(bytes_transferidos) / 1024.0 / 1024.0, 2) as megabytes_totales,
       COUNT(DISTINCT puerto_destino) as puertos_distintos_contactados,
       COUNT(*) as total_conexiones,
       MAX(timestamp) as ultima_conexion
FROM logs_red
GROUP BY ip_origen
HAVING SUM(bytes_transferidos) > 524288000
ORDER BY megabytes_totales DESC
```

## Instalación y Ejecución Local

### Requisitos
* Python 3.10 o superior
* Gestor de paquetes pip

### Pasos
1. Acceder al directorio raíz del proyecto:
   ```bash
   cd log-sentinel
   ```

2. Instalar las dependencias requeridas:
   ```bash
   py -m pip install -r requirements.txt
   ```

3. Levantar el backend de la aplicación:
   ```bash
   py app.py
   ```

4. Abrir un navegador web y acceder al portal:
   ```
   http://localhost:8000
   ```
