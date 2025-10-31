# backend/db_connector.py

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# --- CONFIGURACIÓN DE LA BASE DE DATOS (Railway) ---
DB_CONFIG = {
    'host': os.getenv('MYSQLHOST', 'mysql.railway.internal'),
    'database': os.getenv('MYSQLDATABASE', 'railway'),
    'user': os.getenv('MYSQLUSER', 'root'),
    'password': os.getenv('MYSQLPASSWORD'),
    'port': int(os.getenv('MYSQLPORT', 3306))
}

def get_db_connection():
    """Retorna la conexión a la base de datos o None si falla."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            return conn
        else:
            # Imprimimos un error más útil para la terminal
            print("❌ DB: No se pudo establecer la conexión a MySQL. Verifique el servidor MySQL.")
            return None
    except Error as e:
        print(f"❌ DB: Error de conexión a MySQL: {e}")
        return None

def fetch_all_jugadores():
    """
    Recupera todos los jugadores de la tabla JUGADOR_HISTORICO.
    """
    conn = get_db_connection()
    if conn is None:
        return []

    # dictionary=True devuelve resultados como diccionarios (clave-valor)
    cursor = conn.cursor(dictionary=True) 
    
    # query usa los nombres de columna que confirmamos: id, name, position, image_path
    query = "SELECT id, name, position, image_path FROM JUGADOR_HISTORICO"
    
    try:
        cursor.execute(query)
        jugadores = cursor.fetchall()
        return jugadores
    except Error as e:
        print(f"❌ DB: Error al ejecutar la consulta SQL: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()