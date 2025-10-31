import json
import mysql.connector
from mysql.connector import Error
import time

# --- CONFIGURACIÓN ALTERNATIVA ---
# Prueba diferentes configuraciones de conexión
CONFIGS_TO_TRY = [
    {
        'name': 'Railway Público',
        'host': 'centersam.proxy.rlwy.net',
        'database': 'railway',
        'user': 'root',
        'password': 'ZJAXqtmBOOWHLDObtmmOGKceSMLHUaRd',
        'port': 35357,
        'connect_timeout': 30
    },
    {
        'name': 'Railway con SSL',
        'host': 'centersam.proxy.rlwy.net',
        'database': 'railway',
        'user': 'root',
        'password': 'ZJAXqtmBOOWHLDObtmmOGKceSMLHUaRd',
        'port': 35357,
        'connect_timeout': 30,
        'ssl_disabled': False
    }
]

JSON_FILE = "C:/Users/user8/Desktop/archivos/VIII_SEM2025/AD_sistemas/FutTribe/db/jugadores_historicos.json" 
TABLE_NAME = 'JUGADOR_HISTORICO'

def test_connections():
    """Prueba diferentes configuraciones de conexión."""
    print("🔍 Probando diferentes configuraciones de conexión...\n")
    
    for i, config in enumerate(CONFIGS_TO_TRY):
        print(f"⏳ Probando configuración {i+1}: {config['name']}")
        try:
            conn = mysql.connector.connect(**{k: v for k, v in config.items() if k != 'name'})
            if conn.is_connected():
                print(f"✅ ¡Conexión exitosa con {config['name']}!")
                return config
        except Error as e:
            print(f"❌ Falló {config['name']}: {e}")
        print()
    
    return None

def connect_and_insert():
    """Conecta a MySQL usando la mejor configuración encontrada."""
    
    # Primero probar conexiones
    working_config = test_connections()
    
    if not working_config:
        print("❌ No se pudo establecer conexión con ninguna configuración.")
        print("💡 Verifica:")
        print("   • Tu conexión a internet")
        print("   • Que Railway esté activo")
        print("   • Que las credenciales sean correctas")
        return
    
    # Usar la configuración que funcionó
    config_to_use = {k: v for k, v in working_config.items() if k != 'name'}
    
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**config_to_use)
        cursor = conn.cursor()
        print(f"✅ Conexión establecida con {working_config['name']}")

        # Leer JSON
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

        # Preparar inserción
        sql = f"INSERT INTO {TABLE_NAME} (id, name, position, image_path) VALUES (%s, %s, %s, %s)"
        records_to_insert = []
        
        for jugador in jugadores:
            record = (jugador['id_jugador'], jugador['name'], jugador['position'], jugador['image_url'])
            records_to_insert.append(record)

        # Insertar datos
        print("⏳ Insertando jugadores en la base de datos...")
        cursor.executemany(sql, records_to_insert)
        conn.commit()
        
        print(f"🎉 ¡ÉXITO! Se insertaron {cursor.rowcount} jugadores en la tabla '{TABLE_NAME}'")

    except Error as e:
        print(f"❌ Error durante la inserción: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            print("🔌 Conexión cerrada")

if __name__ == '__main__':
    connect_and_insert()