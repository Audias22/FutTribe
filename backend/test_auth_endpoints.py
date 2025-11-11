# test_auth_endpoints.py - Script para probar endpoints de autenticación
import requests
import json

BASE_URL = "http://localhost:5000"

def test_registro():
    """Probar endpoint de registro"""
    print("🧪 PROBANDO REGISTRO...")
    
    data = {
        "email": "test@futtribe.com",
        "password": "123456",
        "nombre": "Usuario Test",
        "nacionalidad": "Colombia",
        "avatar_id": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/registro", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 201:
            return response.json().get('token')
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def test_login():
    """Probar endpoint de login"""
    print("\n🧪 PROBANDO LOGIN...")
    
    data = {
        "email": "test@futtribe.com",
        "password": "123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/login", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            return response.json().get('token')
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def test_verificar_sesion(token):
    """Probar endpoint de verificar sesión"""
    print("\n🧪 PROBANDO VERIFICAR SESIÓN...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/api/verificar_sesion", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_logout():
    """Probar endpoint de logout"""
    print("\n🧪 PROBANDO LOGOUT...")
    
    try:
        response = requests.post(f"{BASE_URL}/api/logout")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 PROBANDO ENDPOINTS DE AUTENTICACIÓN FUTTRIBE")
    print("=" * 50)
    
    # Probar registro
    token = test_registro()
    
    # Probar login
    if not token:
        token = test_login()
    
    # Probar verificar sesión
    if token:
        test_verificar_sesion(token)
    
    # Probar logout
    test_logout()
    
    print("\n✅ PRUEBAS COMPLETADAS")