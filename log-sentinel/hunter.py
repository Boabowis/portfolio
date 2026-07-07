import sqlite3
from database import get_connection

def buscar_coincidencias_threat_intel():
    """Detección 1: Cruce de Logs de Servidor con IPs Maliciosas (Threat Matching)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            L.id,
            L.timestamp, 
            L.ip_origen, 
            L.usuario, 
            L.evento, 
            L.puerto_destino,
            L.bytes_transferidos,
            I.tipo_amenaza, 
            I.reputacion_score
        FROM logs_servidor L
        INNER JOIN intel_amenazas I ON L.ip_origen = I.ip_maliciosa
        ORDER BY L.timestamp DESC, I.reputacion_score DESC;
    '''
    
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def buscar_fuerza_bruta():
    """Detección 2: Análisis Estadístico para Detectar Fuerza Bruta (>5 logins fallidos)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            usuario,
            ip_origen,
            COUNT(*) AS total_intentos_fallidos,
            MIN(timestamp) AS inicio_ataque,
            MAX(timestamp) AS fin_ataque
        FROM logs_servidor
        WHERE evento = 'login_failed'
        GROUP BY usuario, ip_origen
        HAVING total_intentos_fallidos > 5
        ORDER BY total_intentos_fallidos DESC;
    '''
    
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def buscar_exfiltracion_datos():
    """Detección 3: Análisis de Volumen de Datos para Detectar Robo de Información (>500 MB)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            ip_origen,
            ROUND(SUM(bytes_transferidos) / (1024.0 * 1024.0), 2) AS megabytes_totales,
            COUNT(DISTINCT puerto_destino) AS puertos_distintos_contactados,
            COUNT(*) AS total_conexiones,
            MIN(timestamp) AS primera_conexion,
            MAX(timestamp) AS ultima_conexion
        FROM logs_servidor
        GROUP BY ip_origen
        HAVING megabytes_totales > 500.0
        ORDER BY megabytes_totales DESC;
    '''
    
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def obtener_resumen_estadisticas():
    """Obtiene métricas rápidas de los logs para alimentar el Dashboard."""
    conn = get_connection()
    cursor = conn.cursor()
    
    stats = {}
    
    # 1. Total logs
    cursor.execute("SELECT COUNT(*) FROM logs_servidor")
    stats['total_logs'] = cursor.fetchone()[0]
    
    # 2. Total IoCs cargados
    cursor.execute("SELECT COUNT(*) FROM intel_amenazas")
    stats['total_iocs'] = cursor.fetchone()[0]
    
    # 3. Distribución de eventos
    cursor.execute("SELECT evento, COUNT(*) FROM logs_servidor GROUP BY evento")
    stats['eventos_dist'] = {row[0]: row[1] for row in cursor.fetchall()}
    
    # 4. Total alertas activas (amenazas + fuerza bruta + exfiltración)
    coincidencias = len(buscar_coincidencias_threat_intel())
    bruteforce = len(buscar_fuerza_bruta())
    exfiltracion = len(buscar_exfiltracion_datos())
    stats['total_alertas'] = coincidencias + bruteforce + exfiltracion
    
    stats['conteo_alertas'] = {
        'threat_intel': coincidencias,
        'brute_force': bruteforce,
        'exfiltracion': exfiltracion
    }
    
    conn.close()
    return stats

if __name__ == "__main__":
    print("--- COINCIDENCIAS THREAT INTEL ---")
    print(buscar_coincidencias_threat_intel())
    print("\n--- ATAQUES FUERZA BRUTA ---")
    print(buscar_fuerza_bruta())
    print("\n--- POSIBLE EXFILTRACIÓN ---")
    print(buscar_exfiltracion_datos())
    print("\n--- ESTADÍSTICAS ---")
    print(obtener_resumen_estadisticas())
