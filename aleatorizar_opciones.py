#!/usr/bin/env python3
"""
Script para ACTUALIZAR las preguntas existentes aleatorizando el orden de las opciones.
Esto arregla el bug donde siempre la opción A es la correcta.
"""

import os
import sys
import random
sys.path.append('backend')
from db_connector import get_db_connection

def aleatorizar_opciones_pregunta(pregunta_data):
    """
    Toma los datos de una pregunta y aleatoriza las opciones,
    manteniendo la referencia a cuál es la correcta.
    """
    # Crear lista de opciones con sus valores
    opciones = [
        ('opcion_a', pregunta_data[2]),
        ('opcion_b', pregunta_data[3]),
        ('opcion_c', pregunta_data[4]),
        ('opcion_d', pregunta_data[5])
    ]
    
    # Identificar cuál es la correcta
    respuesta_correcta = pregunta_data[6]
    
    # Aleatorizar el orden
    random.shuffle(opciones)
    
    # Construir el diccionario con el nuevo orden
    nuevo_orden = {
        'id': pregunta_data[0],
        'pregunta': pregunta_data[1],
        'opcion_a': opciones[0][1],
        'opcion_b': opciones[1][1],
        'opcion_c': opciones[2][1],
        'opcion_d': opciones[3][1],
        'respuesta_correcta': respuesta_correcta,  # Mantiene la misma
        'dificultad': pregunta_data[7]
    }
    
    return nuevo_orden

def actualizar_preguntas():
    """Actualiza todas las preguntas con opciones aleatorizadas."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Obtener todas las preguntas
    cursor.execute("SELECT * FROM preguntas_futbol")
    preguntas = cursor.fetchall()
    
    print(f"📊 Total de preguntas a actualizar: {len(preguntas)}")
    print("\n⏳ Aleatorizando opciones...")
    
    actualizadas = 0
    
    for pregunta in preguntas:
        # Aleatorizar opciones
        nuevo_orden = aleatorizar_opciones_pregunta(pregunta)
        
        # Actualizar en la base de datos
        cursor.execute("""
            UPDATE preguntas_futbol
            SET opcion_a = %s,
                opcion_b = %s,
                opcion_c = %s,
                opcion_d = %s
            WHERE id = %s
        """, (
            nuevo_orden['opcion_a'],
            nuevo_orden['opcion_b'],
            nuevo_orden['opcion_c'],
            nuevo_orden['opcion_d'],
            nuevo_orden['id']
        ))
        
        actualizadas += 1
        
        if actualizadas % 20 == 0:
            print(f"   Progreso: {actualizadas}/{len(preguntas)}...")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"\n✅ Actualización completada: {actualizadas} preguntas aleatorizadas")
    print("🎉 Ahora las opciones A, B, C, D están en orden aleatorio")

def verificar_muestra():
    """Muestra una muestra de preguntas para verificar."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Obtener 3 preguntas aleatorias
    cursor.execute("SELECT * FROM preguntas_futbol ORDER BY RAND() LIMIT 3")
    preguntas = cursor.fetchall()
    
    print("\n" + "="*70)
    print("📝 MUESTRA DE VERIFICACIÓN:")
    print("="*70)
    
    for p in preguntas:
        print(f"\n🎯 {p['id']}: {p['pregunta']}")
        print(f"   A) {p['opcion_a']}")
        print(f"   B) {p['opcion_b']}")
        print(f"   C) {p['opcion_c']}")
        print(f"   D) {p['opcion_d']}")
        print(f"   ✅ Correcta: {p['respuesta_correcta']}")
        
        # Verificar que la respuesta correcta esté entre las opciones
        opciones_valores = [p['opcion_a'], p['opcion_b'], p['opcion_c'], p['opcion_d']]
        if p['respuesta_correcta'] in opciones_valores:
            posicion = opciones_valores.index(p['respuesta_correcta'])
            letra = ['A', 'B', 'C', 'D'][posicion]
            print(f"   📍 La correcta está en la posición: {letra}")
        else:
            print(f"   ❌ ERROR: La respuesta correcta no está entre las opciones!")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🔧 SCRIPT PARA ALEATORIZAR OPCIONES DE PREGUNTAS")
    print("="*70)
    print("\n⚠️  Este script va a cambiar el orden de las opciones A, B, C, D")
    print("   de TODAS las preguntas en la base de datos.")
    print("   La respuesta correcta seguirá siendo la misma, pero puede")
    print("   estar en cualquier posición (no siempre en A).\n")
    
    confirmar = input("¿Deseas continuar? (s/n): ").lower()
    
    if confirmar == 's':
        actualizar_preguntas()
        verificar_muestra()
        print("\n✅ ¡Listo! El bug está corregido.\n")
    else:
        print("\n❌ Operación cancelada\n")
