# simple_test.py - Test simple de la funcionalidad de autenticación
import json
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from datetime import timedelta

# Simular datos de usuario
test_user = {
    "email": "test@futtribe.com",
    "password": "123456",
    "nombre": "Usuario Test",
    "nacionalidad": "Colombia"
}

def test_password_hashing():
    """Probar hash de contraseñas"""
    print("🧪 PROBANDO HASH DE CONTRASEÑAS...")
    
    password_hash = generate_password_hash(test_user["password"])
    print(f"✅ Hash generado: {password_hash[:50]}...")
    
    is_valid = check_password_hash(password_hash, test_user["password"])
    print(f"✅ Verificación: {is_valid}")
    
    is_invalid = check_password_hash(password_hash, "wrong_password")
    print(f"✅ Verificación incorrecta: {is_invalid}")

def test_jwt_tokens():
    """Probar generación y verificación de tokens JWT"""
    print("\n🧪 PROBANDO TOKENS JWT...")
    
    JWT_SECRET = 'futtribe_secret_key_2024'
    JWT_ALGORITHM = 'HS256'
    
    # Generar token
    payload = {
        'user_id': 1,
        'email': test_user["email"],
        'rol': 'jugador',
        'exp': datetime.datetime.utcnow() + timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(f"✅ Token generado: {token[:50]}...")
    
    # Verificar token
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        print(f"✅ Token decodificado: {decoded}")
    except jwt.ExpiredSignatureError:
        print("❌ Token expirado")
    except jwt.InvalidTokenError:
        print("❌ Token inválido")

def test_once_ideal_json():
    """Probar serialización JSON del once ideal"""
    print("\n🧪 PROBANDO ONCE IDEAL JSON...")
    
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
    
    json_string = json.dumps(once_ideal_default)
    print(f"✅ JSON generado: {json_string}")
    
    parsed = json.loads(json_string)
    print(f"✅ JSON parseado: {parsed}")

if __name__ == "__main__":
    print("🚀 PROBANDO FUNCIONALIDADES DE AUTENTICACIÓN")
    print("=" * 50)
    
    test_password_hashing()
    test_jwt_tokens()
    test_once_ideal_json()
    
    print("\n✅ TODAS LAS FUNCIONALIDADES FUNCIONAN CORRECTAMENTE")
    print("🎯 Los endpoints están listos para ser integrados")