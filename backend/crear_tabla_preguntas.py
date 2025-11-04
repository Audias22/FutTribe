#!/usr/bin/env python3
"""
Script temporal para crear la tabla preguntas_futbol en Railway.
"""

import os
import sys
import mysql.connector
from mysql.connector import Error

def get_db_connection():
    """Obtiene la conexión a la base de datos desde la variable de entorno."""
    try:
        db_url = os.environ.get('MYSQL_PUBLIC_URL')
        
        if not db_url:
            print("❌ Error: Variable de entorno MYSQL_PUBLIC_URL no encontrada")
            print("💡 Por favor proporciona la URL de conexión de Railway")
            print("\nFormato: mysql://user:password@host:port/database")
            db_url = input("\nPega aquí la MYSQL_PUBLIC_URL: ").strip()
            
            if not db_url:
                sys.exit(1)
        
        # Parsear la URL
        db_url = db_url.replace('mysql://', '')
        credentials, location = db_url.split('@')
        user, password = credentials.split(':')
        host_port, database = location.split('/')
        host, port = host_port.split(':')
        
        connection = mysql.connector.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=database
        )
        
        if connection.is_connected():
            print(f"✅ Conexión exitosa a la base de datos: {database}")
            return connection
            
    except Error as e:
        print(f"❌ Error al conectar a MySQL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error al parsear la URL: {e}")
        sys.exit(1)

def crear_tabla(connection):
    """Crea la tabla preguntas_futbol."""
    sql_create_table = """
    CREATE TABLE IF NOT EXISTS preguntas_futbol (
        id VARCHAR(10) PRIMARY KEY,
        pregunta TEXT NOT NULL,
        opcion_a VARCHAR(200) NOT NULL,
        opcion_b VARCHAR(200) NOT NULL,
        opcion_c VARCHAR(200) NOT NULL,
        opcion_d VARCHAR(200) NOT NULL,
        respuesta_correcta VARCHAR(200) NOT NULL,
        dificultad ENUM('facil', 'intermedia', 'avanzada') NOT NULL,
        INDEX idx_dificultad (dificultad)
    );
    """
    
    try:
        cursor = connection.cursor()
        cursor.execute(sql_create_table)
        connection.commit()
        cursor.close()
        print("✅ Tabla 'preguntas_futbol' creada exitosamente")
        return True
    except Error as e:
        print(f"❌ Error al crear tabla: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("🚀 SCRIPT PARA CREAR TABLA preguntas_futbol")
    print("="*60 + "\n")
    
    # Conectar
    connection = get_db_connection()
    
    # Crear tabla
    if crear_tabla(connection):
        print("\n✅ ¡Tabla creada exitosamente!")
        print("📝 Ahora puedes ejecutar insert_preguntas_script.py\n")
    
    connection.close()

if __name__ == "__main__":
    main()
