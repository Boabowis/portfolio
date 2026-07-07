# Log Sentinel and Threat Matcher

Log Sentinel is a real-time security dashboard and Threat Hunting engine designed to ingest, process, and analyze system network activity logs. It automatically cross-references active traffic against known indicators of compromise (IoCs) and executes complex analytical queries in SQLite to detect advanced persistent threats (APTs), security anomalies, and compromised credentials.

## Architecture and Components

The system is built on a modular backend in Python and a lightweight reactive web frontend:

1. Database Layer (database.py): Uses SQLite for log persistence, configured with composite indexes on critical columns (ip_origen, timestamp) to optimize indexing and query response times.
2. Threat Intelligence Feed (threat_intel.py): Dynamic downloader that fetches and updates a blacklist of active command-and-control (C2) IPs directly from the Feodo Tracker feed (abuse.ch) using standard HTTP libraries, falling back to a structured offline database if internet connection is down.
3. Activity Log Simulator (generator.py): Injects synthetic normal network traffic alongside simulated adversarial behaviors (SSH brute force attacks, massive data exfiltrations, and connections to C2 networks).
4. Threat Hunting Engine (hunter.py): Contains the core logic that executes analytical SQL queries to detect anomalies in real-time.
5. Web API Server (app.py): Formulated with FastAPI to expose control endpoints for simulation, update threat intelligence feeds, and retrieve structured metrics.
6. Dashboard Frontend (static/index.html): HTML5 interface styled with standard CSS (supporting dark and light modes) and Chart.js for real-time traffic volume visualization.

## Database Schema and Indexing

The relational model stores two main tables:

### 1. `logs_red`
Stores network activity details.
* `id` (INTEGER, Primary Key)
* `timestamp` (TEXT)
* `ip_origen` (TEXT)
* `usuario` (TEXT)
* `evento` (TEXT)
* `puerto_destino` (INTEGER)
* `bytes_transferidos` (INTEGER)

An index is placed on `(ip_origen, timestamp)` to speed up correlation queries.

### 2. `threat_intel`
Stores active blacklisted malicious hosts.
* `ip_maliciosa` (TEXT, Unique Primary Key)
* `tipo_amenaza` (TEXT)
* `reputacion_score` (INTEGER)
* `timestamp_actualizacion` (TEXT)

## Threat Hunting SQL Queries

The core of the detection capabilities resides in three specialized SQL queries:

### 1. Correlation with Threat Intelligence
Cross-references recent traffic with the active blacklist downloaded from Abuse.ch:
```sql
SELECT l.timestamp, l.ip_origen, l.usuario, l.evento, l.bytes_transferidos, t.tipo_amenaza, t.reputacion_score
FROM logs_red l
JOIN threat_intel t ON l.ip_origen = t.ip_maliciosa
ORDER BY l.timestamp DESC
```

### 2. Authentication Brute Force Detection
Identifies origin IPs that accumulate 5 or more failed login attempts within a sliding window of 60 seconds, group-by user and IP:
```sql
SELECT ip_origen, usuario, COUNT(*) as total_intentos_fallidos,
       MIN(timestamp) as inicio_ataque, MAX(timestamp) as fin_ataque
FROM logs_red
WHERE evento = 'login_failed'
GROUP BY ip_origen, usuario
HAVING total_intentos_fallidos >= 5
ORDER BY fin_ataque DESC
```

### 3. Mass Data Exfiltration Anomaly
Locates internal systems transferring more than 500 megabytes (524,288,000 bytes) of data to external destinations, tracking unique target ports:
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

## Installation and Execution

### Requirements
* Python 3.10 or higher
* pip package manager

### Steps
1. Navigate to the project root directory:
   ```bash
   cd log-sentinel
   ```

2. Install dependencies:
   ```bash
   py -m pip install -r requirements.txt
   ```

3. Launch the application:
   ```bash
   py app.py
   ```

4. Open a web browser and go to:
   ```
   http://localhost:8000
   ```
