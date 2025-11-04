"""
Script de prueba para los endpoints de preguntas.
"""
import requests
import json

BASE_URL = "http://localhost:5000/api/v1"

def print_response(title, response):
    print("\n" + "="*60)
    print(f"📝 {title}")
    print("="*60)
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(response.text)

def test_endpoints():
    print("\n🚀 PROBANDO ENDPOINTS DE PREGUNTAS\n")
    
    # 1. Probar estadísticas
    print("1️⃣ Probando /api/v1/preguntas/stats")
    response = requests.get(f"{BASE_URL}/preguntas/stats")
    print_response("Estadísticas", response)
    
    # 2. Probar obtener 3 preguntas fáciles
    print("\n2️⃣ Probando /api/v1/preguntas?dificultad=facil&cantidad=3")
    response = requests.get(f"{BASE_URL}/preguntas", params={"dificultad": "facil", "cantidad": 3})
    print_response("3 Preguntas Fáciles", response)
    
    # 3. Probar obtener pregunta por ID
    print("\n3️⃣ Probando /api/v1/preguntas/qf1")
    response = requests.get(f"{BASE_URL}/preguntas/qf1")
    print_response("Pregunta por ID", response)
    
    # 4. Probar mix de preguntas
    print("\n4️⃣ Probando /api/v1/preguntas/mix (POST)")
    payload = {
        "faciles": 2,
        "intermedias": 1,
        "avanzadas": 1
    }
    response = requests.post(f"{BASE_URL}/preguntas/mix", json=payload)
    print_response("Mix de Preguntas", response)
    
    print("\n" + "="*60)
    print("✅ PRUEBAS COMPLETADAS")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        test_endpoints()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: No se pudo conectar al servidor Flask")
        print("💡 Asegúrate de que el servidor esté corriendo en http://localhost:5000")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
