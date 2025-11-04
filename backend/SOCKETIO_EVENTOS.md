# 🔌 Eventos de Socket.IO - El Duelazo Multijugador

## Conexión

### URL del Servidor
- **Local**: `http://localhost:5000`
- **Producción**: `https://tu-app.railway.app`

### Conectar desde Frontend (React)
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```

---

## 📡 Eventos del Cliente → Servidor

### 1. `crear_sala`
Crea una nueva sala de juego.

**Enviar:**
```javascript
socket.emit('crear_sala', {
  nombre: 'Juan',
  max_jugadores: 10 // opcional, default 10
});
```

**Respuesta: `sala_creada`**
```javascript
socket.on('sala_creada', (data) => {
  // data = {
  //   success: true,
  //   codigo: 'ABC123',
  //   sala_id: 42
  // }
});
```

---

### 2. `unirse_sala`
Un jugador se une a una sala existente.

**Enviar:**
```javascript
socket.emit('unirse_sala', {
  codigo: 'ABC123',
  nombre: 'María'
});
```

**Respuesta: `unido_a_sala`**
```javascript
socket.on('unido_a_sala', (data) => {
  // data = {
  //   success: true,
  //   codigo: 'ABC123',
  //   sala: {
  //     codigo: 'ABC123',
  //     creador: 'Juan',
  //     jugadores: [...],
  //     max_jugadores: 10
  //   }
  // }
});
```

**Evento para TODOS en la sala: `jugador_unido`**
```javascript
socket.on('jugador_unido', (data) => {
  // data = {
  //   jugador: { nombre: 'María', ... },
  //   jugadores: [...], // lista completa
  //   total: 3
  // }
});
```

---

### 3. `marcar_listo`
El jugador marca que está listo para comenzar.

**Enviar:**
```javascript
socket.emit('marcar_listo', {
  codigo: 'ABC123'
});
```

**Respuesta para TODOS: `estado_listos`**
```javascript
socket.on('estado_listos', (data) => {
  // data = {
  //   listos: 3,
  //   total: 4,
  //   jugadores: [...]
  // }
  
  // Si listos === total && total >= 2:
  //   → Se inicia automáticamente la Ronda 1
});
```

---

### 4. `enviar_respuesta`
El jugador envía su respuesta a una pregunta.

**Enviar:**
```javascript
socket.emit('enviar_respuesta', {
  codigo: 'ABC123',
  pregunta_id: 'qa01',
  respuesta: 'Pelé',
  tiempo: 12, // segundos restantes (0-15)
  ronda: 'ronda1' // o 'final'
});
```

**Respuesta: `respuesta_procesada`**
```javascript
socket.on('respuesta_procesada', (data) => {
  // data = {
  //   es_correcta: true,
  //   puntos_ganados: 140,
  //   puntuacion_total: 580
  // }
});
```

---

### 5. `finalizar_ronda1`
Finaliza la Ronda 1 y muestra los finalistas.

**Enviar:**
```javascript
socket.emit('finalizar_ronda1', {
  codigo: 'ABC123'
});
```

**Respuesta para TODOS: `resultados_ronda1`**
```javascript
socket.on('resultados_ronda1', (data) => {
  // data = {
  //   jugadores: [...], // todos ordenados por puntuación
  //   finalistas: [...] // top 2
  // }
});
```

---

### 6. `iniciar_final`
Inicia la ronda final con preguntas más difíciles.

**Enviar:**
```javascript
socket.emit('iniciar_final', {
  codigo: 'ABC123'
});
```

**Respuesta para TODOS: `iniciar_final`**
```javascript
socket.on('iniciar_final', (data) => {
  // data = {
  //   preguntas: [...], // 10 preguntas más difíciles
  //   total_preguntas: 10
  // }
});
```

---

### 7. `finalizar_partida`
Finaliza la partida completa y declara al ganador.

**Enviar:**
```javascript
socket.emit('finalizar_partida', {
  codigo: 'ABC123'
});
```

**Respuesta para TODOS: `resultados_finales`**
```javascript
socket.on('resultados_finales', (data) => {
  // data = {
  //   ganador: { nombre: 'Juan', puntuacion_total: 1450, ... },
  //   ranking: [...] // todos los jugadores ordenados
  // }
});
```

---

## 📥 Eventos del Servidor → Cliente

### `connected`
Confirmación de conexión exitosa.
```javascript
socket.on('connected', (data) => {
  console.log(data.message); // "Conectado al servidor"
});
```

### `iniciar_ronda1`
El juego comienza con la Ronda 1.
```javascript
socket.on('iniciar_ronda1', (data) => {
  // data = {
  //   preguntas: [
  //     {
  //       id: 'qa01',
  //       pregunta: '¿Quién ganó...?',
  //       opciones: ['A', 'B', 'C', 'D'],
  //       dificultad: 'intermedia'
  //     },
  //     ...
  //   ],
  //   total_preguntas: 10
  // }
});
```

### `jugador_salio`
Un jugador se desconectó de la sala.
```javascript
socket.on('jugador_salio', (data) => {
  // data = {
  //   jugadores: [...], // lista actualizada
  //   total: 2
  // }
});
```

### `error`
Error genérico del servidor.
```javascript
socket.on('error', (data) => {
  console.error(data.message);
});
```

---

## 🎯 Flujo Completo del Juego

```
1. Usuario A: crear_sala({ nombre: 'Juan' })
   ← sala_creada({ codigo: 'ABC123' })

2. Usuario B: unirse_sala({ codigo: 'ABC123', nombre: 'María' })
   ← unido_a_sala(...)
   → TODOS reciben: jugador_unido(...)

3. Usuario A: marcar_listo({ codigo: 'ABC123' })
   → TODOS reciben: estado_listos({ listos: 1, total: 2 })

4. Usuario B: marcar_listo({ codigo: 'ABC123' })
   → TODOS reciben: estado_listos({ listos: 2, total: 2 })
   → AUTOMÁTICO: iniciar_ronda1(...)

5. Ambos usuarios envían respuestas durante 10 preguntas
   enviar_respuesta(...) × 10 por jugador

6. Usuario A (o cualquiera): finalizar_ronda1({ codigo: 'ABC123' })
   → TODOS reciben: resultados_ronda1({ finalistas: [top 2] })

7. Usuario A (o cualquiera): iniciar_final({ codigo: 'ABC123' })
   → FINALISTAS reciben: iniciar_final({ preguntas: [...] })

8. Finalistas envían respuestas × 10

9. Usuario A (o cualquiera): finalizar_partida({ codigo: 'ABC123' })
   → TODOS reciben: resultados_finales({ ganador: {...} })
```

---

## 🔢 Sistema de Puntuación

- **Base por respuesta correcta**: 100 puntos
- **Bono por velocidad**: hasta 50 puntos adicionales
  - Fórmula: `(tiempo_restante / 15) * 50`
  - Ejemplo: Si quedan 12 segundos → (12/15) × 50 = 40 puntos extra
  - **Total**: 100 + 40 = **140 puntos**

- **Tiempo por pregunta**: 15 segundos

---

## ⚙️ Configuración de Dificultad

### Ronda 1 (Clasificatoria)
- 3 preguntas fáciles
- 4 preguntas intermedias
- 3 preguntas avanzadas

### Ronda Final
- 3 preguntas intermedias
- 7 preguntas avanzadas

---

## 🛠️ Manejo de Errores

Todos los errores del servidor se emiten como:
```javascript
socket.on('error', (data) => {
  // Ejemplos de mensajes:
  // - "Sala no encontrada"
  // - "La sala está llena"
  // - "La partida ya comenzó"
  // - "Error al crear sala: ..."
});
```

---

## 📦 Instalación en Frontend

```bash
npm install socket.io-client
```

```javascript
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
export const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```
