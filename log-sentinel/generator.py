import random
import time
import sqlite3
from datetime import datetime, timedelta
from database import get_connection

USUARIOS_COMUNES = ["alberto", "maria", "carlos", "sofia", "sistemas_dev", "invitado", "finanzas_user"]
USUARIOS_OBJETIVO = ["root", "admin", "db_admin", "ceo_access"]
IPS_INTERNAS = [f"192.168.1.{i}" for i in range(10, 50)]
PUERTOS_COMUNES = [80, 443, 22, 3389, 8080, 21]

def simular_trafico_normal(num_registros=50):
    """Genera logs de red normales y los guarda en la base de datos."""
    conn = get_connection()
    cursor = conn.cursor()
    
    logs = []
    ahora = datetime.now()
    
    for i in range(num_registros):
        # Generar desfase temporal aleatorio para simular logs históricos recientes
        timestamp = ahora - timedelta(minutes=random.randint(1, 120), seconds=random.randint(0, 59))
        ip = random.choice(IPS_INTERNAS)
        usuario = random.choice(USUARIOS_COMUNES)
        
        # En la vida normal la mayoría de logins tienen éxito y las descargas son normales
        evento = random.choices(
            ['login_success', 'login_failed', 'file_download', 'file_upload'],
            weights=[0.60, 0.05, 0.25, 0.10],
            k=1
        )[0]
        
        puerto = random.choice(PUERTOS_COMUNES)
        
        # Bytes transferidos: pequeños para logins, medianos para descargas/subidas
        if 'login' in evento:
            bytes_trans = random.randint(100, 1000)
        else:
            bytes_trans = random.randint(1024, 10 * 1024 * 1024) # De 1KB a 10MB
            
        logs.append((timestamp.strftime("%Y-%m-%d %H:%M:%S"), ip, usuario, evento, puerto, bytes_trans))
        
    cursor.executemany('''
        INSERT INTO logs_servidor (timestamp, ip_origen, usuario, evento, puerto_destino, bytes_transferidos)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', logs)
    
    conn.commit()
    conn.close()
    print(f"Insertados {num_registros} registros de tráfico normal.")

def simular_ataque_fuerza_bruta():
    """Simula un ataque de fuerza bruta: >5 logins fallidos desde una sola IP en un corto lapso."""
    conn = get_connection()
    cursor = conn.cursor()
    
    atacante_ip = f"198.51.100.{random.randint(2, 254)}"
    usuario_ataque = random.choice(USUARIOS_OBJETIVO)
    ahora = datetime.now()
    
    logs = []
    print(f"Simulando Fuerza Bruta: Atacante {atacante_ip} sobre usuario '{usuario_ataque}'...")
    
    # 7 intentos fallidos espaciados por unos segundos
    for i in range(7):
        timestamp = ahora - timedelta(seconds=(7 - i) * 10)
        logs.append((
            timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            atacante_ip,
            usuario_ataque,
            'login_failed',
            22, # SSH
            random.randint(200, 400)
        ))
        
    # Un intento exitoso final opcional (compromiso total)
    if random.choice([True, False]):
        logs.append((
            ahora.strftime("%Y-%m-%d %H:%M:%S"),
            atacante_ip,
            usuario_ataque,
            'login_success',
            22,
            450
        ))
        print(" -> Fuerza bruta exitosa. Cuenta comprometida.")
    else:
        print(" -> Fuerza bruta bloqueada. Acceso denegado.")
        
    cursor.executemany('''
        INSERT INTO logs_servidor (timestamp, ip_origen, usuario, evento, puerto_destino, bytes_transferidos)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', logs)
    
    conn.commit()
    conn.close()

def simular_exfiltracion_datos():
    """Simula una exfiltración: una IP interna envía más de 500MB a una IP externa."""
    conn = get_connection()
    cursor = conn.cursor()
    
    host_interno = random.choice(IPS_INTERNAS)
    ip_externa = f"203.0.113.{random.randint(2, 254)}"
    ahora = datetime.now()
    
    logs = []
    print(f"Simulando Exfiltración: {host_interno} enviando datos masivos a {ip_externa}...")
    
    # Simular transferencia en 4 grandes archivos (total > 500MB)
    num_partes = 4
    # Bytes totales aprox = 520MB (520 * 1024 * 1024)
    bytes_totales = 540 * 1024 * 1024
    bytes_por_parte = bytes_totales // num_partes
    
    for i in range(num_partes):
        timestamp = ahora - timedelta(minutes=(num_partes - i) * 5)
        logs.append((
            timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            ip_externa, # El atacante externo se registra como ip_origen de la conexión entrante/saliente de descarga
            "sistemas_dev",
            "file_download", # Descarga masiva externa
            443, # Puerto seguro HTTPS
            bytes_por_parte + random.randint(-5000, 5000)
        ))
        
    cursor.executemany('''
        INSERT INTO logs_servidor (timestamp, ip_origen, usuario, evento, puerto_destino, bytes_transferidos)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', logs)
    
    conn.commit()
    conn.close()
    print(" -> Exfiltración de datos inyectada.")

def simular_coincidencia_threat_intel():
    """Simula conexiones desde o hacia IPs que están registradas en la tabla intel_amenazas."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Obtener una IP maliciosa real de la base de datos
    cursor.execute("SELECT ip_maliciosa, tipo_amenaza FROM intel_amenazas LIMIT 5")
    rows = cursor.fetchall()
    
    if not rows:
        print("Advertencia: No hay IoCs en la base de datos. Ejecute primero threat_intel.py.")
        # Usamos una de fallback
        ip_amenaza = "198.51.100.42"
        tipo_amenaza = "Ransomware C2"
    else:
        elegido = random.choice(rows)
        ip_amenaza = elegido[0]
        tipo_amenaza = elegido[1]
        
    ahora = datetime.now()
    usuario = random.choice(USUARIOS_COMUNES)
    
    print(f"Simulando Conexión de Threat Intel: Conexión con IP maliciosa {ip_amenaza} ({tipo_amenaza})")
    
    # Simular conexión
    cursor.execute('''
        INSERT INTO logs_servidor (timestamp, ip_origen, usuario, evento, puerto_destino, bytes_transferidos)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        ahora.strftime("%Y-%m-%d %H:%M:%S"),
        ip_amenaza,
        usuario,
        random.choice(['login_failed', 'file_upload', 'file_download']),
        random.choice([443, 80, 8080]),
        random.randint(1024, 50000)
    ))
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    # Si se ejecuta directamente, simula un conjunto de datos mixto
    simular_trafico_normal(30)
    simular_ataque_fuerza_bruta()
    simular_exfiltracion_datos()
    simular_coincidencia_threat_intel()
