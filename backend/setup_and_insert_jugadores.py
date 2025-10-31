import json
import mysql.connector
from mysql.connector import Error
from urllib.parse import urlparse

# --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---
DATABASE_URL = "mysql://root:ZJAXqtmBOOWHLDobtmmOGKceSMLHuARd@centerbeam.proxy.rlwy.net:35357/railway"

# Parsear la URL para extraer los componentes
url = urlparse(DATABASE_URL)
DB_CONFIG = {
    'host': url.hostname,
    'database': url.path[1:],
    'user': url.username,
    'password': url.password,
    'port': url.port,
    'connect_timeout': 60,
    'autocommit': True
}

JSON_FILE = "C:/Users/user8/Desktop/archivos/VIII_SEM2025/AD_sistemas/FutTribe/db/jugadores_historicos.json" 
TABLE_NAME = 'JUGADOR_HISTORICO'

# SQL para crear la tabla
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS JUGADOR_HISTORICO (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    image_path VARCHAR(500) NOT NULL 
);
"""

def create_table_and_insert():
    """Crea la tabla JUGADOR_HISTORICO y luego inserta los datos."""
    conn = None
    cursor = None
    
    try:
        # Conectar a la base de datos
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print(f"✅ Conexión a MySQL exitosa. Base de datos: {DB_CONFIG['database']}")

        # --- PASO 1: CREAR LA TABLA ---
        print("⏳ Creando tabla JUGADOR_HISTORICO...")
        cursor.execute(CREATE_TABLE_SQL)
        print("✅ Tabla JUGADOR_HISTORICO creada o ya existe")

        # --- PASO 2: LEER EL ARCHIVO JSON ---
        try:
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                jugadores = json.load(f)
            print(f"✅ JSON cargado: {len(jugadores)} jugadores encontrados")
        except FileNotFoundError:
            print(f"❌ Archivo no encontrado: {JSON_FILE}")
            return
        except json.JSONDecodeError:
            print(f"❌ Error en formato JSON: {JSON_FILE}")
            return

        # --- PASO 3: LIMPIAR DATOS EXISTENTES (OPCIONAL) ---
        print("⏳ Limpiando datos existentes en la tabla...")
        cursor.execute(f"DELETE FROM {TABLE_NAME}")
        print("✅ Tabla limpiada")

        # --- PASO 4: PREPARAR E INSERTAR DATOS ---
        sql = f"INSERT INTO {TABLE_NAME} (id, name, position, image_path) VALUES (%s, %s, %s, %s)"
        records_to_insert = []
        
        for jugador in jugadores:
            record = (jugador['id_jugador'], jugador['name'], jugador['position'], jugador['image_url'])
            records_to_insert.append(record)

        print(f"⏳ Insertando {len(records_to_insert)} jugadores...")
        cursor.executemany(sql, records_to_insert)
        
        # Confirmar cambios
        conn.commit()
        print(f"🎉 ¡ÉXITO COMPLETO! Se insertaron {cursor.rowcount} jugadores en la tabla '{TABLE_NAME}'")
        
        # --- PASO 5: VERIFICAR LA INSERCIÓN ---
        cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
        count = cursor.fetchone()[0]
        print(f"✅ Verificación: La tabla ahora tiene {count} jugadores")

    except Error as e:
        print(f"❌ Error durante el proceso: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            print("🔌 Conexión cerrada")

if __name__ == '__main__':
    create_table_and_insert()