import json
import mysql.connector
from mysql.connector import Error
from urllib.parse import urlparse

# --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---
# URL actualizada con credenciales correctas de Railway
DATABASE_URL = "mysql://root:ZJAXqtmBOOWHLDobtmmOGKceSMLHuARd@centerbeam.proxy.rlwy.net:35357/railway"

# Parsear la URL para extraer los componentes
url = urlparse(DATABASE_URL)
DB_CONFIG = {
    'host': url.hostname,
    'database': url.path[1:],  # Remover la barra inicial
    'user': url.username,
    'password': url.password,
    'port': url.port,
    'connect_timeout': 60,  # Timeout más largo para conexiones remotas
    'autocommit': True
}

# La ruta del JSON es '../db/jugadores_historicos.json' desde la carpeta 'backend'
JSON_FILE = "C:/Users/user8/Desktop/archivos/VIII_SEM2025/AD_sistemas/FutTribe/db/jugadores_historicos.json" 
TABLE_NAME = 'JUGADOR_HISTORICO'

def connect_and_insert():
    """Conecta a MySQL, lee el JSON e inserta los datos."""
    conn = None # Inicializar conn a None
    cursor = None # Inicializar cursor a None
    try:
        # Intenta establecer la conexión
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            cursor = conn.cursor()
            print(f"✅ Conexión a MySQL exitosa. Base de datos: {DB_CONFIG['database']}")

            # --- 2. LEER EL ARCHIVO JSON ---
            try:
                # La lectura se hace desde la ubicación correcta
                with open(JSON_FILE, 'r', encoding='utf-8') as f:
                    jugadores = json.load(f)
                print(f"✅ Archivo {JSON_FILE} cargado. Se encontraron {len(jugadores)} jugadores.")
            except FileNotFoundError:
                print(f"❌ Error: Archivo {JSON_FILE} no encontrado. Asegúrate de que estés ejecutando desde la carpeta 'backend'.")
                return
            except json.JSONDecodeError:
                print(f"❌ Error: El archivo {JSON_FILE} tiene un formato JSON incorrecto.")
                return

            # --- 3. PREPARAR LA CONSULTA SQL ---
            sql = f"INSERT INTO {TABLE_NAME} (id, name, position, image_path) VALUES (%s, %s, %s, %s)"

            # Preparar la lista de tuplas con los valores a insertar
            records_to_insert = []
            for jugador in jugadores:
                # El orden de los campos del JSON sigue siendo id, name, position, image_url
                record = (jugador['id_jugador'], jugador['name'], jugador['position'], jugador['image_url'])
                records_to_insert.append(record)

            # --- 4. EJECUTAR LA INSERCIÓN MÚLTIPLE ---
            print("⏳ Insertando datos en la tabla...")
            cursor.executemany(sql, records_to_insert)

            # Confirmar los cambios
            conn.commit()
            print(f"🎉 ¡Éxito! Se insertaron {cursor.rowcount} registros en la tabla '{TABLE_NAME}'.")

    except Error as e:
        # Manejo de errores de MySQL
        print(f"❌ Error al conectar o insertar en MySQL: {e}")

    finally:
        # Cerrar la conexión
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            print("🔌 Conexión a MySQL cerrada.")

if __name__ == '__main__':
    connect_and_insert()