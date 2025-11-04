# 🎮 FutTribe - Sistema Multiplayer Completo

## 📦 Resumen del Proyecto

**FutTribe** es una aplicación de trivia de fútbol con tres modos de juego:
1. **Mi Once Ideal**: Crea tu equipo con jugadores históricos
2. **El Duelazo**: Modo individual de preguntas
3. **El Duelazo Multiplayer**: Competencia en tiempo real (NUEVO ✨)

---

## 🏗️ Arquitectura

```
Frontend (React)           Backend (Flask + Socket.IO)        Database (MySQL)
    Vercel          ←→         Railway              ←→         Railway
    
- React 18                  - Flask 3.0                      - MySQL 8.0
- Socket.IO Client          - Flask-SocketIO 5.4             - 160 preguntas
- CSS Animations            - Eventlet 0.37                  - Tablas multiplayer
                            - Python 3.14
```

---

## 🚀 Despliegue Completo

### Backend (Railway)

#### 1. Configuración Inicial

El backend ya está desplegado en Railway con:
- **URL**: `https://futtribe-production.up.railway.app`
- **Python**: 3.14
- **Base de datos**: MySQL en Railway

#### 2. Variables de Entorno

Asegúrate de tener en Railway:

```bash
MYSQL_PUBLIC_URL=mysql://root:PASSWORD@HOST:PORT/railway
PORT=5000
PYTHON_VERSION=3.14.0
```

#### 3. Archivos Clave

- `backend/app.py` - Aplicación principal con Socket.IO
- `backend/socket_events.py` - Lógica de eventos multiplayer
- `backend/requirements.txt` - Dependencias (actualizado con Socket.IO)
- `backend/Procfile` - `web: gunicorn app:app` (Railway)

#### 4. Despliegue Automático

Railway se actualiza automáticamente con cada `git push` a `main`.

```bash
git push origin main
# Railway detecta cambios y redespliega
```

---

### Frontend (Vercel)

#### 1. Configuración Inicial

El frontend está desplegado en Vercel:
- **URL**: `https://fut-tribe.vercel.app`
- **Framework**: React
- **Auto-deploy**: Conectado a GitHub

#### 2. Variables de Entorno en Vercel

En el dashboard de Vercel, agrega:

```
REACT_APP_BACKEND_URL=https://futtribe-production.up.railway.app
```

#### 3. Despliegue Manual (si es necesario)

```bash
cd frontend
npm install
npm run build
# Vercel detecta cambios automáticamente
```

#### 4. Despliegue Automático

Vercel redespliega automáticamente al hacer push a `main`:

```bash
git push origin main
# Vercel detecta cambios y redespliega
```

---

## 🗄️ Base de Datos

### Tablas Existentes

1. **jugadores_historicos** - Jugadores para Mi Once Ideal
2. **preguntas_futbol** - 160 preguntas de trivia (3 dificultades)

### Tablas Multiplayer (NUEVAS)

3. **salas_duelazo** - Gestión de salas
   ```sql
   - id, codigo (6 chars), nombre_creador
   - estado (esperando, jugando_ronda1, jugando_final, finalizado)
   - max_jugadores, ganador, fecha_creacion, fecha_fin
   ```

4. **jugadores_sala** - Jugadores en cada sala
   ```sql
   - id, sala_id, nombre_jugador, socket_id
   - esta_listo, puntuacion_ronda1, puntuacion_final, puntuacion_total
   - clasifico_final, fecha_union
   ```

5. **respuestas_jugador** - Historial de respuestas
   ```sql
   - id, jugador_sala_id, pregunta_id, respuesta
   - es_correcta, puntos_ganados, tiempo_respuesta
   - ronda (ronda1, final), fecha_respuesta
   ```

### Migraciones Aplicadas

```sql
-- Ya ejecutadas en Railway:
ALTER TABLE salas_duelazo 
ADD COLUMN ganador VARCHAR(100) DEFAULT NULL,
ADD COLUMN fecha_fin TIMESTAMP NULL DEFAULT NULL;
```

---

## 🔌 Socket.IO - Eventos Implementados

### Cliente → Servidor

| Evento | Descripción | Parámetros |
|--------|-------------|------------|
| `crear_sala` | Crea nueva sala | `{ nombre, max_jugadores }` |
| `unirse_sala` | Unirse a sala | `{ codigo, nombre }` |
| `marcar_listo` | Marcar ready | `{ codigo }` |
| `enviar_respuesta` | Enviar respuesta | `{ codigo, pregunta_id, respuesta, tiempo, ronda }` |
| `finalizar_ronda1` | Terminar R1 | `{ codigo }` |
| `iniciar_final` | Empezar final | `{ codigo }` |
| `finalizar_partida` | Terminar juego | `{ codigo }` |

### Servidor → Cliente

| Evento | Descripción | Data |
|--------|-------------|------|
| `sala_creada` | Confirmación | `{ success, codigo, sala_id }` |
| `unido_a_sala` | Confirmación | `{ success, codigo, sala }` |
| `jugador_unido` | Broadcast | `{ jugador, jugadores, total }` |
| `estado_listos` | Contador ready | `{ listos, total, jugadores }` |
| `iniciar_ronda1` | Empezar R1 | `{ preguntas, total_preguntas }` |
| `respuesta_procesada` | Feedback | `{ es_correcta, puntos_ganados, puntuacion_total }` |
| `resultados_ronda1` | Resultados R1 | `{ jugadores, finalistas }` |
| `iniciar_final` | Empezar final | `{ preguntas, total_preguntas }` |
| `resultados_finales` | Ganador | `{ ganador, ranking }` |
| `jugador_salio` | Desconexión | `{ jugadores, total }` |
| `error` | Error genérico | `{ message }` |

---

## 📁 Estructura de Archivos

```
FutTribe/
├── backend/
│   ├── app.py                          # Flask + SocketIO
│   ├── socket_events.py                # Lógica multiplayer
│   ├── db_connector.py                 # Conexión MySQL
│   ├── crear_tablas_multijugador.py    # Script de migración
│   ├── insert_preguntas_script.py      # Insertar preguntas
│   ├── requirements.txt                # Dependencias
│   ├── Procfile                        # Railway config
│   ├── SOCKETIO_EVENTOS.md             # Documentación eventos
│   └── ENDPOINTS_PREGUNTAS.md          # Documentación API REST
│
├── frontend/
│   ├── src/
│   │   ├── App.js                      # Router principal
│   │   ├── MenuPrincipal.js            # Menú con 3 modos
│   │   ├── MiOnceIdeal.js              # Once ideal
│   │   ├── ElDuelazo.js                # Modo individual
│   │   ├── ElDuelazoMultiplayer.js     # Wrapper multiplayer
│   │   ├── CrearSala.js                # Crear sala
│   │   ├── UnirseSala.js               # Unirse con código
│   │   ├── SalaEspera.js               # Waiting room
│   │   ├── JuegoMultiplayer.js         # Juego en vivo
│   │   ├── ResultadosMultiplayer.js    # Rankings
│   │   ├── socket.js                   # Socket.IO client
│   │   └── *.css                       # Estilos
│   ├── .env                            # Variables de entorno
│   └── package.json
│
├── db/
│   ├── schema.sql                      # Schema completo
│   ├── preguntas_futbol.json           # 200 preguntas
│   └── jugadores_historicos.json       # Jugadores
│
├── GUIA_MULTIPLAYER.md                 # Guía de usuario
└── README_DEPLOY.md                    # Esta guía
```

---

## 🧪 Pruebas Locales

### Backend Local

```bash
# Terminal 1: Backend
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
source .venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

# Configurar variable de entorno
$env:MYSQL_PUBLIC_URL="mysql://root:PASS@HOST:PORT/railway"  # Windows
export MYSQL_PUBLIC_URL="mysql://root:PASS@HOST:PORT/railway"  # Mac/Linux

python app.py
# 🚀 Servidor iniciado en puerto 5000 con Socket.IO
```

### Frontend Local

```bash
# Terminal 2: Frontend
cd frontend
npm install

# Editar .env para apuntar a localhost:
# REACT_APP_BACKEND_URL=http://localhost:5000

npm start
# Abre http://localhost:3000
```

### Prueba Multiplayer Local

1. Abre **2 pestañas** en tu navegador
2. En ambas: Ve a "El Duelazo Multiplayer"
3. Pestaña 1: Crear Sala → Copia código
4. Pestaña 2: Unirse → Pega código
5. Ambas: Marcar "Estoy Listo"
6. ¡Jugar! 🎮

---

## 📊 Sistema de Puntuación

### Fórmula

```javascript
if (respuesta_correcta) {
  puntos_base = 100;
  bono_tiempo = Math.floor((tiempo_restante / 15) * 50);
  puntos_totales = puntos_base + bono_tiempo;
}
```

### Ejemplos

| Tiempo Restante | Bono | Total |
|----------------|------|-------|
| 15s (instantáneo) | +50 | 150 pts |
| 10s | +33 | 133 pts |
| 5s | +17 | 117 pts |
| 1s | +3 | 103 pts |
| 0s (timeout) | 0 | 0 pts |

---

## 🔧 Comandos Útiles

### Git

```bash
# Commit y push (actualiza Railway + Vercel automáticamente)
git add .
git commit -m "Descripción"
git push origin main
```

### Backend

```bash
# Ver logs de Railway
railway logs

# Conectar a base de datos
railway connect mysql

# Ver variables de entorno
railway variables
```

### Frontend

```bash
# Build local
npm run build

# Ver logs de Vercel
vercel logs

# Deploy manual
vercel --prod
```

---

## 🐛 Debugging

### Backend no se conecta

```bash
# Verificar que Railway esté corriendo
curl https://futtribe-production.up.railway.app/api/v1/status

# Debe retornar: {"status":"ok","message":"API de FutTribe lista..."}
```

### Socket.IO no conecta

1. Abre DevTools → Console
2. Busca mensajes:
   - `🟢 Conectado al servidor Socket.IO: XXXXX` ✅
   - `❌ Error de Socket.IO: ...` ❌

3. Verifica CORS en `backend/app.py`:
   ```python
   CORS(app, origins="*", supports_credentials=True)
   socketio = SocketIO(app, cors_allowed_origins="*", ...)
   ```

### Preguntas no cargan

```bash
# Verificar que existan 160 preguntas
curl https://futtribe-production.up.railway.app/api/v1/preguntas/stats

# Respuesta esperada:
# {"total_preguntas":160,"faciles":50,"intermedias":50,"avanzadas":60}
```

---

## 📈 Monitoreo

### Métricas Clave

- **Backend (Railway)**:
  - CPU/RAM usage
  - Request latency
  - Active WebSocket connections

- **Frontend (Vercel)**:
  - Page load time
  - Bundle size
  - Edge cache hits

- **Base de Datos**:
  - Active connections
  - Query time
  - Storage usage

---

## 🔐 Seguridad

### Implementado

- ✅ CORS configurado correctamente
- ✅ Códigos de sala únicos (6 caracteres aleatorios)
- ✅ Validación de entrada en todos los endpoints
- ✅ Desconexión automática de jugadores inactivos
- ✅ Límite de jugadores por sala

### Mejoras Futuras

- [ ] Autenticación de usuarios
- [ ] Rate limiting en Socket.IO
- [ ] Salas privadas con contraseña
- [ ] Encriptación de mensajes

---

## 📚 Documentación Adicional

- `backend/SOCKETIO_EVENTOS.md` - Referencia completa de eventos
- `backend/ENDPOINTS_PREGUNTAS.md` - API REST de preguntas
- `GUIA_MULTIPLAYER.md` - Guía para usuarios finales

---

## 🎯 Roadmap

### ✅ Completado (Fase 1-5)

- [x] Base de datos con preguntas
- [x] API REST de preguntas
- [x] Frontend con menu principal
- [x] Modo individual (El Duelazo)
- [x] Sistema multiplayer con Socket.IO
- [x] Sala de espera con ready-check
- [x] Sistema de torneos (R1 → Final)
- [x] Rankings y ganador

### 🔜 Próximo (Fase 6)

- [ ] Chat en vivo durante partidas
- [ ] Sistema de amigos
- [ ] Rankings globales persistentes
- [ ] Estadísticas detalladas por jugador
- [ ] Logros y badges
- [ ] Torneos programados

---

## 👥 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -m "Agregar nueva característica"`
4. Push: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

---

## 📞 Soporte

- **Issues**: GitHub Issues
- **Email**: [tu-email@ejemplo.com]
- **Documentación**: Ver archivos `.md` en el repositorio

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

¡Listo para competir! ⚽🏆🎮
