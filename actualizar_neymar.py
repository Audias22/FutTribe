import sys
sys.path.append('backend')
from db_connector import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

# Actualizar la pregunta de Neymar
cursor.execute("""
    UPDATE preguntas_futbol 
    SET opcion_a = 'Brasil', 
        opcion_c = 'Arabia Saudita', 
        opcion_d = 'Estados Unidos', 
        respuesta_correcta = 'Brasil' 
    WHERE id = 'qf25'
""")

conn.commit()
print(f'✅ Pregunta de Neymar actualizada: {cursor.rowcount} fila(s) afectada(s)')

# Verificar el cambio
cursor.execute("SELECT * FROM preguntas_futbol WHERE id = 'qf25'")
pregunta = cursor.fetchone()
print(f'\n📝 Verificación:')
print(f'Pregunta: {pregunta[1]}')
print(f'A) {pregunta[2]}')
print(f'B) {pregunta[3]}')
print(f'C) {pregunta[4]}')
print(f'D) {pregunta[5]}')
print(f'Respuesta correcta: {pregunta[6]}')

cursor.close()
conn.close()
