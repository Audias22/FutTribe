# auth_routes.py - Rutas de autenticación para FutTribe
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from datetime import timedelta
import os
import json
from db_connector import get_db_connection
import mysql.connector

# Crear Blueprint para las rutas de autenticación
auth_bp = Blueprint('auth', __name__)

# Clave secreta para JWT (en producción debe estar en variables de entorno)
JWT_SECRET = os.environ.get('JWT_SECRET', 'futtribe_secret_key_2024')
JWT_ALGORITHM = 'HS256'

def generar_token_jwt(user_id, email, rol):
    """Generar token JWT para el usuario"""
    payload = {
        'user_id': user_id,
        'email': email,
        'rol': rol,
        'exp': datetime.datetime.utcnow() + timedelta(days=7),  # Expira en 7 días
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verificar_token_jwt(token):
    """Verificar y decodificar token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/api/registro', methods=['POST'])
def registro():
    """Endpoint para registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['email', 'password', 'nombre', 'nacionalidad']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'El campo {field} es requerido'
                }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        nombre = data['nombre'].strip()
        nacionalidad = data['nacionalidad'].strip()
        avatar_id = data.get('avatar_id', 1)  # Avatar por defecto
        
        # Validar formato de email básico
        if '@' not in email or '.' not in email:
            return jsonify({
                'success': False,
                'message': 'Formato de email inválido'
            }), 400
        
        # Validar longitud de contraseña
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'La contraseña debe tener al menos 6 caracteres'
            }), 400
        
        # Conectar a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({
                'success': False,
                'message': 'Este email ya está registrado'
            }), 409
        
        # Generar hash de la contraseña
        password_hash = generate_password_hash(password)
        
        # Once ideal por defecto (4-3-3)
        once_ideal_default = {
            "formacion": "4-3-3",
            "jugadores": {
                "portero": None,
                "defensas": [None, None, None, None],
                "medios": [None, None, None],
                "delanteros": [None, None, None]
            },
            "fecha_actualizacion": None
        }
        
        # Insertar nuevo usuario
        query = """
        INSERT INTO usuarios 
        (email, password_hash, nombre, nacionalidad, avatar_id, 
         puntos_totales, victorias_multijugador, once_ideal, rol)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            email, password_hash, nombre, nacionalidad, avatar_id,
            0, 0, json.dumps(once_ideal_default), 'jugador'
        ))
        
        connection.commit()
        user_id = cursor.lastrowid
        
        # Generar token JWT
        token = generar_token_jwt(user_id, email, 'jugador')
        
        # Respuesta exitosa
        response_data = {
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user_id,
                'email': email,
                'nombre': nombre,
                'nacionalidad': nacionalidad,
                'avatar_id': avatar_id,
                'puntos_totales': 0,
                'victorias_multijugador': 0,
                'rol': 'jugador'
            },
            'token': token
        }
        
        return jsonify(response_data), 201
        
    except mysql.connector.Error as e:
        print(f"Error MySQL en registro: {e}")
        return jsonify({
            'success': False,
            'message': 'Error en la base de datos'
        }), 500
    except Exception as e:
        print(f"Error en registro: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Endpoint para iniciar sesión"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email y contraseña son requeridos'
            }), 400
        
        # Conectar a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Buscar usuario por email
        query = """
        SELECT id, email, password_hash, nombre, nacionalidad, 
               avatar_id, puntos_totales, victorias_multijugador, 
               once_ideal, rol
        FROM usuarios 
        WHERE email = %s
        """
        
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Email o contraseña incorrectos'
            }), 401
        
        # Verificar contraseña
        if not check_password_hash(user[2], password):
            return jsonify({
                'success': False,
                'message': 'Email o contraseña incorrectos'
            }), 401
        
        # Generar token JWT
        token = generar_token_jwt(user[0], user[1], user[9])
        
        # Respuesta exitosa
        response_data = {
            'success': True,
            'message': 'Login exitoso',
            'user': {
                'id': user[0],
                'email': user[1],
                'nombre': user[3],
                'nacionalidad': user[4],
                'avatar_id': user[5],
                'puntos_totales': user[6],
                'victorias_multijugador': user[7],
                'once_ideal': json.loads(user[8]) if user[8] else None,
                'rol': user[9]
            },
            'token': token
        }
        
        return jsonify(response_data), 200
        
    except mysql.connector.Error as e:
        print(f"Error MySQL en login: {e}")
        return jsonify({
            'success': False,
            'message': 'Error en la base de datos'
        }), 500
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

@auth_bp.route('/api/verificar_sesion', methods=['GET'])
def verificar_sesion():
    """Endpoint para verificar si la sesión es válida"""
    try:
        # Obtener token del header Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token no proporcionado'
            }), 401
        
        token = auth_header.split(' ')[1]
        payload = verificar_token_jwt(token)
        
        if not payload:
            return jsonify({
                'success': False,
                'message': 'Token inválido o expirado'
            }), 401
        
        # Obtener datos actualizados del usuario
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
        SELECT id, email, nombre, nacionalidad, avatar_id, 
               puntos_totales, victorias_multijugador, once_ideal, rol
        FROM usuarios 
        WHERE id = %s
        """
        
        cursor.execute(query, (payload['user_id'],))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user[0],
                'email': user[1],
                'nombre': user[2],
                'nacionalidad': user[3],
                'avatar_id': user[4],
                'puntos_totales': user[5],
                'victorias_multijugador': user[6],
                'once_ideal': json.loads(user[7]) if user[7] else None,
                'rol': user[8]
            }
        }), 200
        
    except Exception as e:
        print(f"Error en verificar_sesion: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    """Endpoint para cerrar sesión (principalmente para limpiar cliente)"""
    return jsonify({
        'success': True,
        'message': 'Sesión cerrada exitosamente'
    }), 200

@auth_bp.route('/api/actualizar_estadisticas', methods=['POST'])
def actualizar_estadisticas():
    """Endpoint para actualizar estadísticas de usuario"""
    try:
        # Verificar token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token no proporcionado'
            }), 401
        
        token = auth_header.split(' ')[1]
        payload = verificar_token_jwt(token)
        
        if not payload:
            return jsonify({
                'success': False,
                'message': 'Token inválido'
            }), 401
        
        data = request.get_json()
        puntos_ganados = data.get('puntos_ganados', 0)
        victoria_multijugador = data.get('victoria_multijugador', False)
        
        # Actualizar estadísticas
        connection = get_db_connection()
        cursor = connection.cursor()
        
        if victoria_multijugador:
            query = """
            UPDATE usuarios 
            SET puntos_totales = puntos_totales + %s,
                victorias_multijugador = victorias_multijugador + 1
            WHERE id = %s
            """
        else:
            query = """
            UPDATE usuarios 
            SET puntos_totales = puntos_totales + %s
            WHERE id = %s
            """
        
        cursor.execute(query, (puntos_ganados, payload['user_id']))
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Estadísticas actualizadas'
        }), 200
        
    except Exception as e:
        print(f"Error actualizando estadísticas: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

@auth_bp.route('/api/guardar-once-ideal', methods=['POST'])
def guardar_once_ideal():
    """Guarda el once ideal del usuario autenticado"""
    try:
        # Verificar token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token no proporcionado'
            }), 401
        
        token = auth_header.split(' ')[1]
        payload = verificar_token_jwt(token)
        
        if not payload:
            return jsonify({
                'success': False,
                'message': 'Token inválido'
            }), 401
        
        data = request.get_json()
        once_ideal = data.get('once_ideal')
        
        if not once_ideal:
            return jsonify({
                'success': False,
                'message': 'No se proporcionó el once ideal'
            }), 400
        
        # Validar que sea un array de 11 jugadores
        if not isinstance(once_ideal, list) or len(once_ideal) != 11:
            return jsonify({
                'success': False,
                'message': 'El once ideal debe contener exactamente 11 jugadores'
            }), 400
        
        # Actualizar en base de datos
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
        UPDATE usuarios 
        SET once_ideal = %s
        WHERE id = %s
        """
        
        cursor.execute(query, (json.dumps(once_ideal), payload['user_id']))
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': '¡Once ideal guardado exitosamente!'
        }), 200
        
    except Exception as e:
        print(f"Error guardando once ideal: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
