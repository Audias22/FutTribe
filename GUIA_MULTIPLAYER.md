# 🎮 El Duelazo Multijugador - Guía Completa

## ✨ ¿Qué es El Duelazo Multijugador?

Un modo de juego en tiempo real donde varios jugadores compiten respondiendo preguntas de fútbol. El juego utiliza un sistema de torneos con dos rondas:

### 📋 Formato del Torneo

1. **Ronda 1 - Clasificatoria**
   - 10 preguntas variadas (3 fáciles, 4 intermedias, 3 avanzadas)
   - Todos los jugadores participan
   - Los **2 mejores puntajes** clasifican a la final

2. **Ronda Final**
   - 10 preguntas más difíciles (3 intermedias, 7 avanzadas)
   - Solo participan los 2 finalistas
   - El ganador es quien tenga más puntos totales

---

## 🚀 Cómo Jugar

### Opción A: Crear una Sala

1. Desde el menú principal, selecciona **"El Duelazo Multijugador"**
2. Ingresa tu nombre
3. Haz clic en **"Crear Sala"**
4. Elige el número máximo de jugadores (2-10)
5. Recibirás un **código de 6 caracteres** (ej: ABC123)
6. Comparte ese código con tus amigos

### Opción B: Unirse a una Sala

1. Pide el código de 6 caracteres al creador
2. Desde el menú principal, selecciona **"El Duelazo Multijugador"**
3. Ingresa tu nombre
4. Haz clic en **"Unirse a Sala"**
5. Escribe el código que te dieron
6. ¡Listo! Estás en la sala

---

## ⏳ Sala de Espera

Una vez dentro de la sala:

- Verás el **código de la sala** en grande
- Puedes **copiar el código** para compartirlo
- Aparece la **lista de jugadores** que se han unido
- Cada jugador debe marcar **"Estoy Listo"**
- El contador muestra **X/Y Listos**
- Cuando **TODOS** estén listos → **El juego inicia automáticamente** 🎯

⚠️ **Requisitos para iniciar:**
- Mínimo **2 jugadores**
- Todos deben estar **listos**

---

## 🎯 Durante el Juego

### Mecánica de Preguntas

- Cada pregunta tiene **15 segundos** para responder
- Selecciona una de las 4 opciones (A, B, C, D)
- La barra de tiempo cambia de color cuando quedan **5 segundos**
- Si no respondes a tiempo → 0 puntos

### Sistema de Puntuación

**Por respuesta correcta:**
- **100 puntos base**
- **+Bono de velocidad**: hasta 50 puntos adicionales

**Fórmula del bono:**
```
Bono = (tiempo_restante / 15) × 50
```

**Ejemplos:**
- Responder en 1 segundo (quedan 14s) → 100 + 47 = **147 puntos**
- Responder en 8 segundos (quedan 7s) → 100 + 23 = **123 puntos**
- Responder con 0 segundos → **100 puntos** (sin bono)

### Feedback Visual

- ✅ **Verde** → Respuesta correcta
- ❌ **Rojo** → Respuesta incorrecta
- **Contador de correctas** en la parte superior
- **Puntuación total** actualizada en tiempo real

---

## 📊 Resultados de Ronda 1

Después de las 10 preguntas:

- Se muestra el **ranking completo** de todos los jugadores
- Los **2 primeros lugares** clasifican a la final
- Los clasificados ven: **"✨ FINALISTA"**

### Si clasificaste:
- Botón **"🔥 Ir a la Final"** → Continúa jugando
- Preguntas más difíciles te esperan

### Si NO clasificaste:
- Botón **"🏠 Volver al Menú"** → Fin del juego para ti
- ¡Sigue practicando!

---

## 🏆 Ronda Final

Solo los 2 finalistas:

- Juegan **10 preguntas más difíciles**
- Mismo formato: 15 segundos por pregunta
- Puntos se suman al total de Ronda 1

---

## 👑 Resultados Finales

Al terminar la final:

- **Corona** 👑 para el ganador
- **Nombre del campeón** destacado
- **Ranking final** de todos los jugadores
- Desglose de puntos por ronda:
  - Ronda 1: X puntos
  - Final: Y puntos
  - **Total: Z puntos**

---

## 🛠️ Características Técnicas

### Sincronización en Tiempo Real

- **Socket.IO** mantiene a todos sincronizados
- Los eventos se propagan instantáneamente a todos los jugadores
- Si alguien se desconecta, los demás lo ven inmediatamente

### Gestión de Desconexiones

- Si te desconectas, **sales automáticamente** de la sala
- Los demás jugadores reciben notificación
- Si quedan menos de 2 jugadores → la sala se puede cancelar

### Códigos de Sala

- **6 caracteres** aleatorios (A-Z, 0-9)
- Únicos y temporales
- Válidos mientras la sala esté activa

---

## 🎨 Dificultades de Preguntas

### Ronda 1 (Mix Equilibrado)
- 🟢 **Fácil**: Preguntas básicas de fútbol
- 🟡 **Intermedia**: Requieren conocimiento medio
- 🔴 **Avanzada**: Para expertos del fútbol

### Ronda Final (Más Difícil)
- 🟡 **Intermedia**: 30%
- 🔴 **Avanzada**: 70%

---

## 💡 Consejos y Estrategia

### Para ganar:

1. **Velocidad + Precisión** → Más puntos
2. **Lee bien la pregunta** → Evita respuestas apresuradas incorrectas
3. **Gestiona el tiempo** → No uses todo el tiempo si sabes la respuesta
4. **Practica en modo individual** → Familiarízate con las preguntas

### En la Ronda 1:

- Busca **consistencia** → Responde bien todas
- No te arriesgues con respuestas al azar
- Objetivo: Estar en **top 2**

### En la Final:

- Aquí se define el **campeón** 👑
- Las preguntas son más difíciles
- El bono de velocidad puede ser decisivo

---

## 📱 Compatibilidad

- ✅ Navegadores modernos (Chrome, Firefox, Edge, Safari)
- ✅ Desktop y Mobile
- ✅ Requiere conexión a internet estable
- ✅ No requiere instalación

---

## 🐛 Solución de Problemas

### "Sala no encontrada"
- Verifica que el código sea correcto (6 caracteres)
- La sala puede haber expirado o terminado

### "La sala está llena"
- El creador estableció un límite de jugadores
- Espera a que se cree otra sala

### "La partida ya comenzó"
- No puedes unirte a una partida en curso
- Espera a la siguiente partida

### No puedo conectarme
- Revisa tu conexión a internet
- Recarga la página
- Verifica que el backend esté funcionando

---

## 🎯 Próximas Mejoras

- [ ] Chat en vivo durante el juego
- [ ] Sistema de rankings globales
- [ ] Salas privadas con contraseña
- [ ] Torneos programados
- [ ] Avatares personalizados
- [ ] Estadísticas detalladas por jugador

---

## 🔗 Enlaces Útiles

- **Menú Principal**: Volver al inicio
- **Crear Sala**: Iniciar nueva partida
- **Unirse a Sala**: Entrar con código
- **Modo Individual**: Practica solo

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica tu conexión a internet
2. Recarga la página
3. Intenta crear una nueva sala
4. Reporta el error al administrador

---

¡Que gane el mejor! ⚽🏆
