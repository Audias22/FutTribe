# backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from db_connector import fetch_all_jugadores # Importamos la función que vamos a usar

# --- 1. INICIALIZACIÓN DE FLASK ---
app = Flask(__name__) 
CORS(app) 

# --- AÑADIMOS LA RUTA RAÍZ (HOME) ---
@app.route('/')
def home():
    """Ruta de inicio para verificar que el servidor esté funcionando."""
    return "Servidor FutTribe Backend en funcionamiento. ¡Listo para la API!"

# --- 2. RUTA DE PRUEBA DE ESTADO ---
@app.route('/api/v1/status', methods=['GET'])
def api_status():
    """Endpoint simple para verificar que la API está lista."""
    return jsonify({
        "status": "ok",
        "message": "API de FutTribe lista para la conexión a MySQL."
    })

# --- 3. RUTA PRINCIPAL DE JUGADORES (Paso 14) ---
@app.route('/api/v1/jugadores-historicos', methods=['GET'])
def get_jugadores():
    """Endpoint que recupera y retorna todos los jugadores históricos."""
    jugadores = fetch_all_jugadores()
    if jugadores:
        return jsonify(jugadores), 200 # 200 OK
    else:
        # Esto podría indicar un problema de conexión a la BD
        return jsonify({"message": "No se encontraron jugadores. Revise la conexión a MySQL."}), 500


# --- 4. EJECUTAR SERVIDOR ---
if __name__ == '__main__':
    # 'debug=True' recarga el servidor automáticamente cuando guardas cambios.
    app.run(debug=True, port=5000)