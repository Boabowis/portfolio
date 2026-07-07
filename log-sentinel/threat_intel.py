import urllib.request
import json
import sqlite3
import os
from datetime import datetime
from database import get_connection

FEODO_FEED_URL = "https://feodotracker.abuse.ch/downloads/ipblocklist.json"

FALLBACK_IOCS = [
    ("198.51.100.42", "Ransomware C2", 95),
    ("203.0.113.88", "Botnet Activa", 80),
    ("185.220.101.5", "Tor Exit Node", 60),
    ("109.202.107.12", "Malware Distribution", 85),
    ("185.244.25.187", "Phishing Host", 75),
    ("45.142.195.34", "SSH Bruteforcer", 90),
    ("82.102.23.4", "Spyware Gateway", 70),
    ("195.133.40.15", "DDoS Controller", 88)
]

def actualizar_inteligencia():
    """Descarga IPs maliciosas reales de Feodo Tracker o usa el listado fallback si falla."""
    print("Iniciando actualización de inteligencia de amenazas...")
    datos_intel = []

    try:
        req = urllib.request.Request(
            FEODO_FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode())
            
            # Feodo Tracker devuelve una lista de diccionarios
            # Cada entrada representa una IP maliciosa activa
            for entry in data:
                ip = entry.get("ip_address")
                malware = entry.get("malware", "Unknown malware")
                status = entry.get("status", "offline")
                
                # Puntuación basada en el estado (online = 95, offline = 50)
                reputacion = 95 if status == "online" else 50
                
                if ip:
                    datos_intel.append((ip, f"{malware} (Feodo Tracker)", reputacion))
            
            print(f"Descargadas {len(datos_intel)} IPs maliciosas reales desde Feodo Tracker.")
    except Exception as e:
        print(f"No se pudo descargar el feed remoto ({e}). Usando base de datos interna de respaldo.")
        datos_intel = FALLBACK_IOCS

    # Guardar en SQLite
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Insertar o reemplazar los registros de inteligencia
        cursor.executemany('''
            INSERT OR REPLACE INTO intel_amenazas (ip_maliciosa, tipo_amenaza, reputacion_score, fecha_actualizacion)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', datos_intel)
        
        conn.commit()
        print(f"Se actualizaron {len(datos_intel)} amenazas en la base de datos.")
    except Exception as db_err:
        print(f"Error al guardar amenazas en DB: {db_err}")
    finally:
        conn.close()

if __name__ == "__main__":
    actualizar_inteligencia()
