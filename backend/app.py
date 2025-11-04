# backend/app.py

import os
import requests
import random
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
from io import BytesIO
from db_connector import fetch_all_jugadores, get_db_connection # Importamos las funciones que vamos a usar

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

# --- PROXY DE IMÁGENES PARA EVITAR CORS ---
@app.route('/api/v1/proxy-image', methods=['GET'])
def proxy_image():
    """Proxy para imágenes externas para evitar problemas de CORS."""
    image_url = request.args.get('url')
    if not image_url:
        return jsonify({"error": "URL no proporcionada"}), 400
    
    try:
        response = requests.get(image_url, timeout=10)
        if response.status_code == 200:
            return send_file(
                BytesIO(response.content),
                mimetype=response.headers.get('Content-Type', 'image/jpeg'),
                as_attachment=False
            )
        else:
            return jsonify({"error": "No se pudo obtener la imagen"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========================================================================
# ENDPOINTS PARA "EL DUELAZO DE LA JORNADA" - PREGUNTAS DE FÚTBOL
# ========================================================================

@app.route('/api/v1/preguntas', methods=['GET'])
def get_preguntas():
    """
    Obtiene preguntas de fútbol filtradas por dificultad y cantidad.
    Query params:
    - dificultad: 'facil', 'intermedia', 'avanzada', 'todas' (default: 'todas')
    - cantidad: número de preguntas a retornar (default: 10)
    - aleatorio: 'true' para orden aleatorio (default: 'true')
    """
    try:
        # Obtener parámetros de la query
        dificultad = request.args.get('dificultad', 'todas').lower()
        cantidad = int(request.args.get('cantidad', 10))
        aleatorio = request.args.get('aleatorio', 'true').lower() == 'true'
        
        # Validar dificultad
        dificultades_validas = ['facil', 'intermedia', 'avanzada', 'todas']
        if dificultad not in dificultades_validas:
            return jsonify({"error": f"Dificultad inválida. Opciones: {dificultades_validas}"}), 400
        
        # Conectar a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Construir query SQL
        if dificultad == 'todas':
            query = "SELECT * FROM preguntas_futbol"
        else:
            query = f"SELECT * FROM preguntas_futbol WHERE dificultad = '{dificultad}'"
        
        cursor.execute(query)
        preguntas = cursor.fetchall()
        cursor.close()
        connection.close()
        
        # Si no hay preguntas
        if not preguntas:
            return jsonify({"message": "No se encontraron preguntas", "data": []}), 200
        
        # Aleatorizar si se solicita
        if aleatorio:
            random.shuffle(preguntas)
        
        # Limitar cantidad
        preguntas = preguntas[:cantidad]
        
        return jsonify({
            "total": len(preguntas),
            "dificultad": dificultad,
            "data": preguntas
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener preguntas: {str(e)}"}), 500

@app.route('/api/v1/preguntas/<pregunta_id>', methods=['GET'])
def get_pregunta_by_id(pregunta_id):
    """
    Obtiene una pregunta específica por su ID.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM preguntas_futbol WHERE id = %s"
        cursor.execute(query, (pregunta_id,))
        pregunta = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if pregunta:
            return jsonify(pregunta), 200
        else:
            return jsonify({"error": "Pregunta no encontrada"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error al obtener pregunta: {str(e)}"}), 500

@app.route('/api/v1/preguntas/stats', methods=['GET'])
def get_preguntas_stats():
    """
    Obtiene estadísticas sobre las preguntas disponibles.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Total de preguntas
        cursor.execute("SELECT COUNT(*) as total FROM preguntas_futbol")
        total = cursor.fetchone()['total']
        
        # Por dificultad
        cursor.execute("""
            SELECT dificultad, COUNT(*) as cantidad 
            FROM preguntas_futbol 
            GROUP BY dificultad
        """)
        por_dificultad = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            "total_preguntas": total,
            "por_dificultad": por_dificultad
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener estadísticas: {str(e)}"}), 500

@app.route('/api/v1/preguntas/mix', methods=['POST'])
def get_preguntas_mix():
    """
    Obtiene un mix personalizado de preguntas con diferentes dificultades.
    Body JSON esperado:
    {
        "faciles": 2,
        "intermedias": 2,
        "avanzadas": 1
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Body JSON requerido"}), 400
        
        faciles = data.get('faciles', 0)
        intermedias = data.get('intermedias', 0)
        avanzadas = data.get('avanzadas', 0)
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        preguntas_mix = []
        
        # Obtener preguntas fáciles
        if faciles > 0:
            cursor.execute("SELECT * FROM preguntas_futbol WHERE dificultad = 'facil' ORDER BY RAND() LIMIT %s", (faciles,))
            preguntas_mix.extend(cursor.fetchall())
        
        # Obtener preguntas intermedias
        if intermedias > 0:
            cursor.execute("SELECT * FROM preguntas_futbol WHERE dificultad = 'intermedia' ORDER BY RAND() LIMIT %s", (intermedias,))
            preguntas_mix.extend(cursor.fetchall())
        
        # Obtener preguntas avanzadas
        if avanzadas > 0:
            cursor.execute("SELECT * FROM preguntas_futbol WHERE dificultad = 'avanzada' ORDER BY RAND() LIMIT %s", (avanzadas,))
            preguntas_mix.extend(cursor.fetchall())
        
        cursor.close()
        connection.close()
        
        # Mezclar el orden final
        random.shuffle(preguntas_mix)
        
        return jsonify({
            "total": len(preguntas_mix),
            "mix": {
                "faciles": faciles,
                "intermedias": intermedias,
                "avanzadas": avanzadas
            },
            "data": preguntas_mix
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener mix de preguntas: {str(e)}"}), 500

# --- 4. EJECUTAR SERVIDOR ---
if __name__ == '__main__':
    # Railway usa la variable PORT del entorno
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)