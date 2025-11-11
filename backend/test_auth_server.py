# test_auth_server.py - Servidor de prueba solo para autenticación
from flask import Flask
from flask_cors import CORS
from auth_routes import auth_bp

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)

# Registrar rutas de autenticación
app.register_blueprint(auth_bp)

@app.route('/')
def home():
    return jsonify({
        "message": "🚀 FutTribe API - Server Test",
        "status": "running",
        "endpoints": {
            "registro": "/api/registro",
            "login": "/api/login",
            "verificar_sesion": "/api/verificar_sesion",
            "logout": "/api/logout"
        }
    })

if __name__ == '__main__':
    print("🚀 Iniciando servidor de prueba FutTribe Auth...")
    print("📡 Servidor corriendo en: http://localhost:5000")
    print("🔐 Endpoints de autenticación disponibles")
    app.run(host='0.0.0.0', port=5000, debug=True)