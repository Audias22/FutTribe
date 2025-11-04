# 📋 INSTRUCCIONES PARA INSERTAR LAS 200 PREGUNTAS EN RAILWAY

## ⚠️ IMPORTANTE: Sigue estos pasos EN ORDEN

---

## **PASO 1: Crear la tabla en Railway** 🗄️

1. Ve a Railway.app y abre tu proyecto FutTribe
2. Haz clic en el servicio de MySQL
3. Ve a la pestaña "Data" o "Query"
4. **Copia y ejecuta este SQL:**

```sql
CREATE TABLE preguntas_futbol (
    id VARCHAR(10) PRIMARY KEY,
    pregunta TEXT NOT NULL,
    opcion_a VARCHAR(200) NOT NULL,
    opcion_b VARCHAR(200) NOT NULL,
    opcion_c VARCHAR(200) NOT NULL,
    opcion_d VARCHAR(200) NOT NULL,
    respuesta_correcta VARCHAR(200) NOT NULL,
    dificultad ENUM('facil', 'intermedia', 'avanzada') NOT NULL,
    INDEX idx_dificultad (dificultad)
);
```

5. Verifica que se creó exitosamente (deberías ver "Query successful")

---

## **PASO 2: Configurar variables de entorno (si no las tienes)** 🔐

Si vas a ejecutar el script **localmente** (no en Railway):

1. Copia la variable de entorno de Railway:
   - En Railway, ve a tu servicio MySQL
   - Busca la variable `MYSQL_PUBLIC_URL`
   - Cópiala completa (se ve como: `mysql://root:pass@host:port/railway`)

2. En tu terminal PowerShell, ejecuta:
```powershell
$env:MYSQL_PUBLIC_URL="mysql://root:TU_PASSWORD_AQUI@..."
```

---

## **PASO 3: Ejecutar el script de inserción** 🚀

### Opción A: Ejecutar localmente desde tu máquina

1. Abre PowerShell en la carpeta `backend`:
```powershell
cd C:\Users\user8\Desktop\archivos\VIII_SEM2025\AD_sistemas\FutTribe\backend
```

2. Asegúrate de tener las dependencias instaladas:
```powershell
pip install mysql-connector-python
```

3. Ejecuta el script:
```powershell
python insert_preguntas_script.py
```

4. Responde las preguntas:
   - ¿Limpiar tabla? → `n` (primera vez) o `s` (si re-ejecutas)
   - ¿Continuar? → `s`

5. Espera a que termine (debería insertar las 200 preguntas)

---

### Opción B: Ejecutar desde Railway CLI (si tienes railway CLI instalado)

```bash
railway run python backend/insert_preguntas_script.py
```

---

## **PASO 4: Verificar que se insertaron correctamente** ✅

1. En Railway, ve a la pestaña "Data" o "Query"
2. Ejecuta este SQL para verificar:

```sql
SELECT COUNT(*) as total FROM preguntas_futbol;

SELECT dificultad, COUNT(*) as cantidad 
FROM preguntas_futbol 
GROUP BY dificultad;
```

3. Deberías ver:
   - Total: 200 preguntas
   - Facil: 50
   - Intermedia: 50
   - Avanzada: 60

---

## **PASO 5: (Opcional) Ver algunas preguntas de muestra**

```sql
SELECT * FROM preguntas_futbol WHERE dificultad = 'facil' LIMIT 5;
SELECT * FROM preguntas_futbol WHERE dificultad = 'intermedia' LIMIT 5;
SELECT * FROM preguntas_futbol WHERE dificultad = 'avanzada' LIMIT 5;
```

---

## ⚠️ **ERRORES COMUNES Y SOLUCIONES**

### Error: "Variable de entorno MYSQL_PUBLIC_URL no encontrada"
**Solución:** Configura la variable (ver PASO 2)

### Error: "La tabla 'preguntas_futbol' no existe"
**Solución:** Ejecuta el SQL del PASO 1 primero

### Error: "Duplicate entry for key 'PRIMARY'"
**Solución:** La tabla ya tiene datos. Responde `s` para limpiar tabla antes de insertar

### Error: "No se encontró el archivo preguntas_futbol.json"
**Solución:** Asegúrate de ejecutar desde la carpeta correcta o verifica la ruta del archivo

---

## 📝 **ARCHIVOS CREADOS/MODIFICADOS:**

- ✅ `db/schema.sql` → Actualizado con la tabla preguntas_futbol
- ✅ `db/preguntas_futbol.json` → 200 preguntas únicas y variadas
- ✅ `backend/insert_preguntas_script.py` → Script de inserción automatizado
- ✅ `backend/INSTRUCCIONES_INSERCION.md` → Este archivo

---

## 🎯 **SIGUIENTE PASO DESPUÉS DE ESTO:**

Una vez que las preguntas estén insertadas en Railway, me avisas y continuamos con:
1. Crear los endpoints del backend para obtener preguntas
2. Crear los componentes del frontend para "El Duelazo"
3. Implementar WebSockets para sincronización en tiempo real

---

**¿Listo?** Empieza con el PASO 1 y avísame si encuentras algún problema. 🚀
