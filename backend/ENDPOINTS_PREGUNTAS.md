# 📘 DOCUMENTACIÓN DE ENDPOINTS - EL DUELAZO

## ✅ Endpoints Implementados

El backend ahora tiene **4 nuevos endpoints** para manejar las preguntas de fútbol para "El Duelazo de la Jornada".

---

## 🔗 **1. GET /api/v1/preguntas**

Obtiene preguntas filtradas por dificultad y cantidad.

### **Query Parameters:**
- `dificultad` (string, opcional): `'facil'`, `'intermedia'`, `'avanzada'`, `'todas'` (default: `'todas'`)
- `cantidad` (number, opcional): número de preguntas a retornar (default: `10`)
- `aleatorio` (string, opcional): `'true'` o `'false'` para orden aleatorio (default: `'true'`)

### **Ejemplos de uso:**

```bash
# Obtener 10 preguntas aleatorias de cualquier dificultad
GET http://localhost:5000/api/v1/preguntas

# Obtener 5 preguntas fáciles
GET http://localhost:5000/api/v1/preguntas?dificultad=facil&cantidad=5

# Obtener 3 preguntas avanzadas sin aleatorizar
GET http://localhost:5000/api/v1/preguntas?dificultad=avanzada&cantidad=3&aleatorio=false
```

### **Respuesta (200 OK):**
```json
{
  "total": 5,
  "dificultad": "facil",
  "data": [
    {
      "id": "qf1",
      "pregunta": "¿Qué club tiene más Champions League?",
      "opcion_a": "Real Madrid",
      "opcion_b": "AC Milan",
      "opcion_c": "Barcelona",
      "opcion_d": "Liverpool",
      "respuesta_correcta": "Real Madrid",
      "dificultad": "facil"
    },
    ...
  ]
}
```

---

## 🔗 **2. GET /api/v1/preguntas/:id**

Obtiene una pregunta específica por su ID.

### **Parámetros de ruta:**
- `pregunta_id` (string): ID de la pregunta (ej: `'qf1'`, `'qi5'`, `'qa10'`)

### **Ejemplo de uso:**

```bash
GET http://localhost:5000/api/v1/preguntas/qf1
```

### **Respuesta (200 OK):**
```json
{
  "id": "qf1",
  "pregunta": "¿Qué club tiene más Champions League?",
  "opcion_a": "Real Madrid",
  "opcion_b": "AC Milan",
  "opcion_c": "Barcelona",
  "opcion_d": "Liverpool",
  "respuesta_correcta": "Real Madrid",
  "dificultad": "facil"
}
```

### **Respuesta (404 Not Found):**
```json
{
  "error": "Pregunta no encontrada"
}
```

---

## 🔗 **3. GET /api/v1/preguntas/stats**

Obtiene estadísticas sobre todas las preguntas disponibles.

### **Ejemplo de uso:**

```bash
GET http://localhost:5000/api/v1/preguntas/stats
```

### **Respuesta (200 OK):**
```json
{
  "total_preguntas": 160,
  "por_dificultad": [
    {
      "dificultad": "facil",
      "cantidad": 50
    },
    {
      "dificultad": "intermedia",
      "cantidad": 50
    },
    {
      "dificultad": "avanzada",
      "cantidad": 60
    }
  ]
}
```

---

## 🔗 **4. POST /api/v1/preguntas/mix**

Obtiene un mix personalizado de preguntas con diferentes dificultades.

### **Body (JSON):**
```json
{
  "faciles": 2,
  "intermedias": 2,
  "avanzadas": 1
}
```

### **Ejemplo de uso:**

```bash
POST http://localhost:5000/api/v1/preguntas/mix
Content-Type: application/json

{
  "faciles": 2,
  "intermedias": 2,
  "avanzadas": 1
}
```

### **Respuesta (200 OK):**
```json
{
  "total": 5,
  "mix": {
    "faciles": 2,
    "intermedias": 2,
    "avanzadas": 1
  },
  "data": [
    {
      "id": "qf3",
      "pregunta": "¿Qué selección tiene más Copas del Mundo?",
      "opcion_a": "Brasil",
      "opcion_b": "Alemania",
      "opcion_c": "Italia",
      "opcion_d": "Argentina",
      "respuesta_correcta": "Brasil",
      "dificultad": "facil"
    },
    {
      "id": "qi7",
      "pregunta": "¿Qué jugador marcó con la 'Mano de Dios'?",
      "opcion_a": "Maradona",
      "opcion_b": "Messi",
      "opcion_c": "Pelé",
      "opcion_d": "Valderrama",
      "respuesta_correcta": "Maradona",
      "dificultad": "intermedia"
    },
    ...
  ]
}
```

---

## 🧪 **Probar los Endpoints**

### **Opción 1: Usar un navegador**
Para endpoints GET, simplemente abre en tu navegador:
```
http://localhost:5000/api/v1/preguntas/stats
http://localhost:5000/api/v1/preguntas?cantidad=3
```

### **Opción 2: Usar PowerShell (Invoke-WebRequest)**

```powershell
# GET con query params
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/preguntas?dificultad=facil&cantidad=5" -Method GET
$response.Content | ConvertFrom-Json

# POST con body JSON
$body = @{
    faciles = 2
    intermedias = 2
    avanzadas = 1
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/preguntas/mix" -Method POST -Body $body -ContentType "application/json"
$response.Content | ConvertFrom-Json
```

### **Opción 3: Usar Postman o Insomnia**
Importa las URLs y prueba directamente desde la interfaz.

---

## 🚀 **Próximos Pasos**

Una vez que los endpoints estén funcionando en Railway, puedes:

1. **Actualizar `app.py` en Railway** (commit y push)
2. **Probar desde el frontend** usando fetch/axios
3. **Crear los componentes de React** para "El Duelazo"
4. **Implementar WebSockets** para sincronización en tiempo real

---

## 📝 **Notas Importantes**

- Las preguntas se aleatorizan por defecto para evitar patrones predecibles
- El endpoint `/mix` es ideal para crear rondas de preguntas con dificultad progresiva
- Todos los endpoints tienen manejo de errores y retornan mensajes claros
- La conexión a la base de datos se cierra automáticamente después de cada consulta

---

## ✅ **Checklist de Implementación**

- [x] Tabla `preguntas_futbol` creada en Railway
- [x] 160 preguntas insertadas
- [x] 4 endpoints implementados en `app.py`
- [x] Servidor Flask corriendo localmente
- [ ] Probar endpoints localmente
- [ ] Commit y push a GitHub
- [ ] Verificar que funcionen en Railway
- [ ] Crear componentes del frontend
