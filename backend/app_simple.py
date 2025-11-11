# app_simple.py - Versión simplificada para desarrollo local (sin Socket.IO)
from flask import Flask, jsonify
from flask_cors import CORS
from auth_routes import auth_bp

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)

# Registrar rutas de autenticación
app.register_blueprint(auth_bp)

@app.route('/')
def home():
    return jsonify({
        "message": "🚀 FutTribe API - Desarrollo Local",
        "status": "running",
        "endpoints": {
            "registro": "/api/registro",
            "login": "/api/login",
            "verificar_sesion": "/api/verificar_sesion",
            "logout": "/api/logout",
            "actualizar_estadisticas": "/api/actualizar_estadisticas"
        }
    })

if __name__ == '__main__':
    print("🚀 Iniciando servidor FutTribe Local...")
    print("📡 Servidor corriendo en: http://localhost:5000")
    print("🔐 Endpoints de autenticación disponibles")
    print("🎯 Solo para desarrollo - Sin Socket.IO")
    app.run(host='0.0.0.0', port=5000, debug=True)