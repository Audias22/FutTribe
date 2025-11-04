import os
import mysql.connector
from urllib.parse import urlparse

def get_db_connection():
    """Parsea la URL de conexión de MySQL y retorna un objeto de conexión."""
    mysql_url = os.getenv('MYSQL_PUBLIC_URL')
    
    if not mysql_url:
        mysql_url = input("🔑 Ingresa la URL de conexión MySQL (MYSQL_PUBLIC_URL): ").strip()
    
    # Parsear la URL: mysql://user:password@host:port/database
    parsed = urlparse(mysql_url)
    
    return mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path[1:]  # Eliminar el '/' inicial
    )

def crear_tablas():
    """Crea las tablas necesarias para el modo multijugador."""
    print("\n" + "="*60)
    print("🎮 CREACIÓN DE TABLAS PARA MODO MULTIJUGADOR")
    print("="*60 + "\n")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f"✅ Conexión exitosa a la base de datos: {conn.database}")
        
        # Crear tabla salas_duelazo
        print("\n📋 Creando tabla 'salas_duelazo'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS salas_duelazo (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(6) NOT NULL UNIQUE,
                nombre_creador VARCHAR(100) NOT NULL,
                estado ENUM('esperando', 'jugando_ronda1', 'jugando_final', 'finalizado') DEFAULT 'esperando',
                max_jugadores INT DEFAULT 10,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_codigo (codigo),
                INDEX idx_estado (estado)
            )
        """)
        print("✅ Tabla 'salas_duelazo' creada")
        
        # Crear tabla jugadores_sala
        print("\n📋 Creando tabla 'jugadores_sala'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jugadores_sala (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sala_id INT NOT NULL,
                nombre_jugador VARCHAR(100) NOT NULL,
                socket_id VARCHAR(100) NOT NULL,
                esta_listo BOOLEAN DEFAULT FALSE,
                puntuacion_ronda1 INT DEFAULT 0,
                puntuacion_final INT DEFAULT 0,
                puntuacion_total INT DEFAULT 0,
                clasifico_final BOOLEAN DEFAULT FALSE,
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sala_id) REFERENCES salas_duelazo(id) ON DELETE CASCADE,
                INDEX idx_sala (sala_id)
            )
        """)
        print("✅ Tabla 'jugadores_sala' creada")
        
        # Crear tabla respuestas_jugador
        print("\n📋 Creando tabla 'respuestas_jugador'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS respuestas_jugador (
                id INT AUTO_INCREMENT PRIMARY KEY,
                jugador_sala_id INT NOT NULL,
                pregunta_id VARCHAR(10) NOT NULL,
                respuesta VARCHAR(200) NOT NULL,
                es_correcta BOOLEAN NOT NULL,
                puntos_ganados INT NOT NULL,
                tiempo_respuesta INT NOT NULL,
                ronda ENUM('ronda1', 'final') NOT NULL,
                fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (jugador_sala_id) REFERENCES jugadores_sala(id) ON DELETE CASCADE,
                FOREIGN KEY (pregunta_id) REFERENCES preguntas_futbol(id),
                INDEX idx_jugador (jugador_sala_id)
            )
        """)
        print("✅ Tabla 'respuestas_jugador' creada")
        
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ TODAS LAS TABLAS CREADAS EXITOSAMENTE")
        print("="*60)
        
    except mysql.connector.Error as err:
        print(f"\n❌ Error: {err}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return True

if __name__ == "__main__":
    crear_tablas()
