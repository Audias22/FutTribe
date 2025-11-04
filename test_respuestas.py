# Test de comparación de respuestas
import sys
sys.path.append('backend')

from db_connector import get_db_connection

# Obtener una pregunta de ejemplo
conn = get_db_connection()
cursor = conn.cursor(dictionary=True)

# Obtener la pregunta de Neymar
cursor.execute("SELECT * FROM preguntas_futbol WHERE id = 'qf25'")
pregunta = cursor.fetchone()

print("=" * 60)
print("PREGUNTA DE PRUEBA:")
print("=" * 60)
print(f"ID: {pregunta['id']}")
print(f"Pregunta: {pregunta['pregunta']}")
print(f"\nOpciones:")
print(f"  A) {pregunta['opcion_a']}")
print(f"  B) {pregunta['opcion_b']}")
print(f"  C) {pregunta['opcion_c']}")
print(f"  D) {pregunta['opcion_d']}")
print(f"\nRespuesta correcta en DB: '{pregunta['respuesta_correcta']}'")
print(f"Longitud: {len(pregunta['respuesta_correcta'])} caracteres")
print(f"Repr: {repr(pregunta['respuesta_correcta'])}")

print("\n" + "=" * 60)
print("PRUEBAS DE COMPARACIÓN:")
print("=" * 60)

# Simular respuestas del usuario
respuestas_test = [
    "Arabia Saudita",
    "Francia",
    "Brasil",
    "España"
]

for i, resp in enumerate(respuestas_test):
    letra = ['A', 'B', 'C', 'D'][i]
    es_correcta = pregunta['respuesta_correcta'].strip() == resp.strip()
    print(f"{letra}) '{resp}' -> {'✅ CORRECTA' if es_correcta else '❌ INCORRECTA'}")

cursor.close()
conn.close()
