# test_local.py - Prueba rápida de endpoints locales
import time
import requests
import json

def test_local_endpoints():
    print("🧪 PROBANDO ENDPOINTS LOCALES")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Probar endpoint base
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Servidor: {response.status_code}")
        print(f"   {response.json()['message']}")
    except Exception as e:
        print(f"❌ Error conexión: {e}")
        return
    
    # Probar registro
    print("\n🔐 Probando registro...")
    user_data = {
        "email": f"test{int(time.time())}@local.com",
        "password": "123456",
        "nombre": "Usuario Local",
        "nacionalidad": "Colombia"
    }
    
    try:
        response = requests.post(f"{base_url}/api/registro", json=user_data)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Success: {data.get('success')}")
        print(f"Message: {data.get('message')}")
        
        if data.get('success'):
            token = data.get('token')
            print(f"✅ Token obtenido: {token[:30]}...")
            
            # Probar verificación de sesión
            print("\n🔍 Probando verificación de sesión...")
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{base_url}/api/verificar_sesion", headers=headers)
            print(f"Status: {response.status_code}")
            data = response.json()
            print(f"Usuario: {data.get('user', {}).get('nombre')}")
            print(f"Puntos: {data.get('user', {}).get('puntos_totales')}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_local_endpoints()