#!/usr/bin/env python3
"""
Script para crear la tabla usuarios en Railway MySQL
Ejecutar: python crear_tabla_usuarios.py
"""

import os
import mysql.connector
from mysql.connector import Error

def crear_tabla_usuarios():
    """Crea la tabla usuarios en la base de datos MySQL de Railway"""
    
    # URL de conexión de Railway
    mysql_url = os.getenv('MYSQL_PUBLIC_URL', 'mysql://root:ZJAXqtmBOOWHLDobtmmOGKceSMLHuARd@centerbeam.proxy.rlwy.net:35357/railway')
    
    try:
        # Parsear la URL de conexión
        # mysql://user:password@host:port/database
        url_parts = mysql_url.replace('mysql://', '').split('@')
        user_pass = url_parts[0].split(':')
        host_port_db = url_parts[1].split('/')
        host_port = host_port_db[0].split(':')
        
        user = user_pass[0]
        password = user_pass[1]
        host = host_port[0]
        port = int(host_port[1])
        database = host_port_db[1]
        
        print(f"🔗 Conectando a Railway MySQL...")
        print(f"   Host: {host}:{port}")
        print(f"   Database: {database}")
        print(f"   User: {user}")
        
        # Conectar a la base de datos
        connection = mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4',
            autocommit=True
        )
        
        if connection.is_connected():
            print("✅ Conexión exitosa a Railway MySQL")
            
            cursor = connection.cursor()
            
            # Leer el archivo SQL
            sql_file_path = os.path.join(os.path.dirname(__file__), 'crear_tabla_usuarios.sql')
            with open(sql_file_path, 'r', encoding='utf-8') as file:
                sql_commands = file.read()
            
            # Ejecutar cada comando SQL
            for command in sql_commands.split(';'):
                if command.strip():
                    try:
                        cursor.execute(command)
                        # Consumir resultados si los hay
                        if cursor.with_rows:
                            cursor.fetchall()
                        print(f"✅ Ejecutado: {command.strip()[:50]}...")
                    except Error as e:
                        print(f"⚠️ Warning: {e}")
            
            # Verificar que la tabla se creó correctamente
            cursor.execute("DESCRIBE usuarios")
            columns = cursor.fetchall()
            
            print("\n📋 Estructura de la tabla usuarios:")
            for column in columns:
                print(f"   {column[0]} - {column[1]}")
            
            print("\n🎉 ¡Tabla usuarios creada exitosamente!")
            
    except Error as e:
        print(f"❌ Error de MySQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Conexión cerrada")
    
    return True

if __name__ == "__main__":
    print("🚀 Iniciando creación de tabla usuarios...")
    success = crear_tabla_usuarios()
    
    if success:
        print("\n✅ PASO 1 COMPLETADO")
        print("   La tabla usuarios está lista en Railway MySQL")
        print("   Continuamos con el PASO 2: Backend endpoints")
    else:
        print("\n❌ PASO 1 FALLÓ")
        print("   Revisa la conexión a Railway MySQL")