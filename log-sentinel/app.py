import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from database import inicializar_db, get_connection
import threat_intel
import generator
import hunter

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Log Sentinel & Threat Matcher API",
    description="API para análisis de datos de red e inteligencia de amenazas para Threat Hunting.",
    version="1.0.0"
)

# Configurar middleware CORS para permitir peticiones desde archivos locales (file://) y portafolio
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar DB al arrancar la app
@app.on_event("startup")
def startup_event():
    inicializar_db()
    # Actualizar la inteligencia de amenazas inicialmente para tener datos útiles
    try:
        threat_intel.actualizar_inteligencia()
        # Generar tráfico normal y de ataque por defecto si la base de datos está vacía
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM logs_servidor")
        count = cursor.fetchone()[0]
        if count == 0:
            print("Base de datos de logs vacía. Generando set inicial de simulación...")
            generator.simular_trafico_normal(40)
            generator.simular_ataque_fuerza_bruta()
            generator.simular_exfiltracion_datos()
            generator.simular_coincidencia_threat_intel()
        conn.close()
    except Exception as e:
        print(f"Error en el arranque: {e}")

# Servir el Dashboard HTML en la raíz '/'
@app.on_event("shutdown")
def shutdown_event():
    pass

@app.get("/", response_class=HTMLResponse)
def read_root():
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    html_path = os.path.join(static_dir, "index.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    else:
        raise HTTPException(status_code=404, detail="Dashboard index.html no encontrado.")

# API endpoints
@app.get("/api/v1/alerts")
def get_alerts():
    """Obtiene todas las alertas detectadas mediante Threat Hunting."""
    try:
        threat_matches = hunter.buscar_coincidencias_threat_intel()
        brute_force = hunter.buscar_fuerza_bruta()
        exfiltration = hunter.buscar_exfiltracion_datos()
        
        return JSONResponse(content={
            "status": "success",
            "data": {
                "threat_intel_matches": threat_matches,
                "brute_force_alerts": brute_force,
                "exfiltration_alerts": exfiltration
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/stats")
def get_stats():
    """Obtiene estadísticas generales del sistema."""
    try:
        stats = hunter.obtener_resumen_estadisticas()
        return JSONResponse(content={"status": "success", "data": stats})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/logs")
def get_logs(limit: int = 50):
    """Devuelve los últimos logs de servidor registrados."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, ip_origen, usuario, evento, puerto_destino, bytes_transferidos "
            "FROM logs_servidor ORDER BY timestamp DESC LIMIT ?", (limit,)
        )
        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return JSONResponse(content={"status": "success", "data": logs})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/simulate/normal")
def simulate_normal():
    """Genera 20 logs de tráfico de red estándar."""
    try:
        generator.simular_trafico_normal(20)
        return {"status": "success", "message": "Simulado tráfico normal de red."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/simulate/brute-force")
def simulate_bruteforce():
    """Inyecta un ataque de fuerza bruta en los logs."""
    try:
        generator.simular_ataque_fuerza_bruta()
        return {"status": "success", "message": "Inyectado ataque de Fuerza Bruta SSH."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/simulate/exfiltration")
def simulate_exfiltration():
    """Inyecta un ataque de exfiltración de datos."""
    try:
        generator.simular_exfiltracion_datos()
        return {"status": "success", "message": "Inyectada exfiltración de datos."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/simulate/threat-intel")
def simulate_threat_intel():
    """Simula una conexión con una IP marcada por Inteligencia de Amenazas."""
    try:
        generator.simular_coincidencia_threat_intel()
        return {"status": "success", "message": "Simulada conexión a IP maliciosa."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/intel/update")
def update_intel():
    """Fuerza la descarga del feed de IoCs activo de Feodo Tracker."""
    try:
        threat_intel.actualizar_inteligencia()
        return {"status": "success", "message": "Feed de amenazas actualizado correctamente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Ejecuta el servidor uvicorn en localhost:8000
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
