import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "security.db")

def get_connection():
    """Retorna una conexión a la base de datos SQLite."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Permite acceder a columnas por nombre
    return conn

def inicializar_db():
    """Crea las tablas e índices necesarios para el proyecto."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tabla de logs de servidor
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS logs_servidor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_origen VARCHAR(45) NOT NULL,
        usuario VARCHAR(100),
        evento VARCHAR(50),      -- 'login_failed', 'login_success', 'file_download', 'file_upload'
        puerto_destino INTEGER,
        bytes_transferidos INTEGER
    );
    ''')
    
    # Tabla de inteligencia de amenazas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS intel_amenazas (
        ip_maliciosa VARCHAR(45) PRIMARY KEY,
        tipo_amenaza VARCHAR(100), -- 'Botnet', 'Ransomware C2', 'Tor Exit Node', 'Malware Distribution'
        reputacion_score INTEGER,  -- 1 a 100 (gravedad)
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    
    # Crear Índices para optimización analítica (Big Data Best Practices)
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_ip_origen ON logs_servidor(ip_origen);')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON logs_servidor(timestamp);')
    
    conn.commit()
    conn.close()
    print("Base de datos inicializada correctamente.")

if __name__ == "__main__":
    inicializar_db()
