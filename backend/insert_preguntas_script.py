#!/usr/bin/env python3
"""
Script para insertar las 200 preguntas de fútbol en la base de datos Railway.
Ejecutar una sola vez después de crear la tabla preguntas_futbol.
"""

import json
import os
import sys
import mysql.connector
from mysql.connector import Error

def get_db_connection():
    """Obtiene la conexión a la base de datos desde la variable de entorno."""
    try:
        # Railway provee MYSQL_PUBLIC_URL con el formato completo
        db_url = os.environ.get('MYSQL_PUBLIC_URL')
        
        if not db_url:
            print("❌ Error: Variable de entorno MYSQL_PUBLIC_URL no encontrada")
            print("💡 Asegúrate de estar ejecutando desde Railway o con las variables configuradas")
            sys.exit(1)
        
        # Parsear la URL: mysql://user:password@host:port/database
        # Formato: mysql://root:password@host:port/railway
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

def cargar_preguntas_json():
    """Carga las preguntas desde el archivo JSON."""
    # Ruta al archivo JSON (relativa al script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, '..', 'db', 'preguntas_futbol.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            preguntas = json.load(file)
            print(f"✅ Archivo JSON cargado: {len(preguntas)} preguntas encontradas")
            return preguntas
    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {json_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error al parsear JSON: {e}")
        sys.exit(1)

def verificar_tabla_existe(connection):
    """Verifica si la tabla preguntas_futbol existe."""
    try:
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES LIKE 'preguntas_futbol'")
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            print("✅ Tabla 'preguntas_futbol' encontrada")
            return True
        else:
            print("❌ Error: La tabla 'preguntas_futbol' no existe")
            print("💡 Debes ejecutar primero el schema SQL en Railway")
            return False
    except Error as e:
        print(f"❌ Error al verificar tabla: {e}")
        return False

def limpiar_tabla(connection):
    """Limpia la tabla antes de insertar (opcional, para re-ejecuciones)."""
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM preguntas_futbol")
        connection.commit()
        print(f"🗑️  Tabla limpiada (registros eliminados: {cursor.rowcount})")
        cursor.close()
    except Error as e:
        print(f"⚠️  Advertencia al limpiar tabla: {e}")

def insertar_preguntas(connection, preguntas):
    """Inserta todas las preguntas en la base de datos."""
    try:
        cursor = connection.cursor()
        
        sql_insert = """
        INSERT INTO preguntas_futbol 
        (id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, dificultad)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        insertadas = 0
        errores = 0
        
        for pregunta in preguntas:
            try:
                valores = (
                    pregunta['id'],
                    pregunta['pregunta'],
                    pregunta['opciones'][0],
                    pregunta['opciones'][1],
                    pregunta['opciones'][2],
                    pregunta['opciones'][3],
                    pregunta['respuesta_correcta'],
                    pregunta['dificultad']
                )
                
                cursor.execute(sql_insert, valores)
                insertadas += 1
                
                # Mostrar progreso cada 20 preguntas
                if insertadas % 20 == 0:
                    print(f"📝 Progreso: {insertadas}/{len(preguntas)} preguntas insertadas...")
                    
            except Error as e:
                errores += 1
                print(f"⚠️  Error al insertar pregunta {pregunta['id']}: {e}")
        
        connection.commit()
        cursor.close()
        
        print("\n" + "="*60)
        print(f"✅ Inserción completada:")
        print(f"   - Preguntas insertadas exitosamente: {insertadas}")
        print(f"   - Errores encontrados: {errores}")
        print("="*60)
        
        return insertadas, errores
        
    except Error as e:
        print(f"❌ Error fatal durante inserción: {e}")
        connection.rollback()
        sys.exit(1)

def verificar_insercion(connection):
    """Verifica que las preguntas se insertaron correctamente."""
    try:
        cursor = connection.cursor()
        
        # Contar total
        cursor.execute("SELECT COUNT(*) FROM preguntas_futbol")
        total = cursor.fetchone()[0]
        
        # Contar por dificultad
        cursor.execute("""
            SELECT dificultad, COUNT(*) 
            FROM preguntas_futbol 
            GROUP BY dificultad
        """)
        por_dificultad = cursor.fetchall()
        
        cursor.close()
        
        print("\n📊 Verificación de datos insertados:")
        print(f"   Total de preguntas en DB: {total}")
        for dificultad, cantidad in por_dificultad:
            print(f"   - {dificultad.capitalize()}: {cantidad}")
        
    except Error as e:
        print(f"⚠️  Error al verificar inserción: {e}")

def main():
    """Función principal del script."""
    print("\n" + "="*60)
    print("🚀 SCRIPT DE INSERCIÓN DE PREGUNTAS DE FÚTBOL")
    print("="*60 + "\n")
    
    # 1. Conectar a la base de datos
    connection = get_db_connection()
    
    # 2. Verificar que la tabla existe
    if not verificar_tabla_existe(connection):
        connection.close()
        sys.exit(1)
    
    # 3. Cargar preguntas desde JSON
    preguntas = cargar_preguntas_json()
    
    # 4. Preguntar si desea limpiar tabla (para re-ejecuciones)
    respuesta = input("\n¿Deseas limpiar la tabla antes de insertar? (s/n): ").lower()
    if respuesta == 's':
        limpiar_tabla(connection)
    
    # 5. Confirmar inserción
    print(f"\n⚠️  Se van a insertar {len(preguntas)} preguntas en la base de datos.")
    confirmar = input("¿Continuar? (s/n): ").lower()
    
    if confirmar != 's':
        print("❌ Operación cancelada por el usuario")
        connection.close()
        sys.exit(0)
    
    # 6. Insertar preguntas
    print("\n⏳ Insertando preguntas...")
    insertar_preguntas(connection, preguntas)
    
    # 7. Verificar inserción
    verificar_insercion(connection)
    
    # 8. Cerrar conexión
    connection.close()
    print("\n✅ Script completado exitosamente\n")

if __name__ == "__main__":
    main()
