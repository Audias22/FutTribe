"""
Módulo de Socket.IO para El Duelazo Multijugador
Maneja todas las conexiones en tiempo real y lógica de salas
"""
import random
import string
from datetime import datetime
from flask import request
from flask_socketio import emit, join_room, leave_room
from db_connector import get_db_connection

# Almacenamiento en memoria de salas activas (para mejor rendimiento)
salas_activas = {}

def generar_codigo_sala():
    """Genera un código único de 6 caracteres para la sala."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def registrar_eventos_socket(socketio):
    """Registra todos los eventos de Socket.IO."""
    
    @socketio.on('connect')
    def handle_connect():
        """Maneja nueva conexión de cliente."""
        print(f'🟢 Cliente conectado: {request.sid}')
        emit('connected', {'message': 'Conectado al servidor'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Maneja desconexión de cliente."""
        print(f'🔴 Cliente desconectado: {request.sid}')
        # Buscar y remover jugador de salas activas
        for codigo_sala, sala in salas_activas.items():
            jugadores_actualizados = [j for j in sala['jugadores'] if j['socket_id'] != request.sid]
            if len(jugadores_actualizados) < len(sala['jugadores']):
                sala['jugadores'] = jugadores_actualizados
                socketio.emit('jugador_salio', {
                    'jugadores': jugadores_actualizados,
                    'total': len(jugadores_actualizados)
                }, room=codigo_sala)
                
                # Solo eliminar sala si NO está finalizada (permite reconexión)
                if len(jugadores_actualizados) == 0 and sala.get('estado') != 'finalizado':
                    del salas_activas[codigo_sala]
                    print(f'🗑️ Sala {codigo_sala} eliminada (sin jugadores)')
                elif len(jugadores_actualizados) == 0:
                    print(f'🔄 Sala {codigo_sala} finalizada preservada para reconexión')
                break
    
    @socketio.on('crear_sala')
    def handle_crear_sala(data):
        """Crea una nueva sala de juego."""
        try:
            nombre_creador = data.get('nombre', 'Jugador')
            max_jugadores = data.get('max_jugadores', 10)
            
            # Generar código único
            codigo = generar_codigo_sala()
            while codigo in salas_activas:
                codigo = generar_codigo_sala()
            
            # Guardar en base de datos
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO salas_duelazo (codigo, nombre_creador, max_jugadores)
                VALUES (%s, %s, %s)
            """, (codigo, nombre_creador, max_jugadores))
            sala_id = cursor.lastrowid
            conn.commit()
            cursor.close()
            conn.close()
            
            # Crear jugador para el creador
            jugador_creador = {
                'socket_id': request.sid,
                'nombre': nombre_creador,
                'esta_listo': False,
                'puntuacion_ronda1': 0,
                'puntuacion_final': 0,
                'puntuacion_total': 0,
                'clasifico_final': False
            }
            
            # Crear sala en memoria
            salas_activas[codigo] = {
                'id': sala_id,
                'codigo': codigo,
                'creador': nombre_creador,
                'max_jugadores': max_jugadores,
                'estado': 'esperando',
                'jugadores': [jugador_creador],  # ← El creador ya está en la sala
                'preguntas_ronda1': [],
                'preguntas_final': []
            }
            
            # Unir al creador a la sala de Socket.IO
            join_room(codigo)
            
            # Guardar creador en base de datos como jugador
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO jugadores_sala (sala_id, nombre_jugador, socket_id)
                VALUES (%s, %s, %s)
            """, (sala_id, nombre_creador, request.sid))
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f'🎮 Sala creada: {codigo} por {nombre_creador}')
            emit('sala_creada', {
                'success': True,
                'codigo': codigo,
                'sala_id': sala_id,
                'sala': {
                    'codigo': codigo,
                    'creador': nombre_creador,
                    'jugadores': [jugador_creador],
                    'max_jugadores': max_jugadores
                }
            })
            
        except Exception as e:
            print(f'❌ Error al crear sala: {str(e)}')
            emit('error', {'message': f'Error al crear sala: {str(e)}'})
    
    @socketio.on('unirse_sala')
    def handle_unirse_sala(data):
        """Un jugador se une a una sala existente."""
        try:
            codigo = data.get('codigo', '').upper()
            nombre = data.get('nombre', 'Jugador')
            
            print(f'🔍 Intento unirse_sala - Código: {codigo}, Nombre: {nombre}')
            print(f'📋 Salas activas disponibles: {list(salas_activas.keys())}')
            
            if codigo not in salas_activas:
                print(f'❌ Sala {codigo} NO encontrada en salas activas')
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            print(f'✅ Sala {codigo} encontrada, procesando...')
            
            sala = salas_activas[codigo]
            print(f'📊 Estado actual de la sala: {sala.get("estado", "sin_estado")}')
            
            # Si la sala está finalizada, resetear para nueva partida
            if sala.get('estado') == 'finalizado':
                print(f'🔄 Reseteando sala finalizada {codigo} para nueva partida')
                sala['estado'] = 'esperando'
                # Resetear estado de jugadores
                for j in sala['jugadores']:
                    j['esta_listo'] = False
                
                # ✅ AJUSTAR max_jugadores al número actual de jugadores conectados
                jugadores_conectados = len(sala['jugadores'])
                if jugadores_conectados > 0 and sala['max_jugadores'] != jugadores_conectados:
                    print(f'⚙️ Ajustando max_jugadores de {sala["max_jugadores"]} a {jugadores_conectados} (jugadores actuales)')
                    sala['max_jugadores'] = jugadores_conectados
                    
                    # Actualizar en base de datos
                    try:
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        cursor.execute("""
                            UPDATE salas_duelazo 
                            SET max_jugadores = %s 
                            WHERE codigo = %s
                        """, (jugadores_conectados, codigo))
                        conn.commit()
                        cursor.close()
                        conn.close()
                        print(f'✅ max_jugadores actualizado en BD para sala {codigo}')
                    except Exception as e:
                        print(f'❌ Error al actualizar max_jugadores en BD: {str(e)}')
            
            # Verificar si la sala está llena (solo para jugadores nuevos)
            # Ya lo manejaremos más abajo
            
            # Verificar si el jugador ya está en la sala (reuniéndose)
            jugador_existente = None
            for j in sala['jugadores']:
                if j['nombre'] == nombre:
                    jugador_existente = j
                    break
            
            if jugador_existente:
                # Actualizar socket_id del jugador existente
                jugador_existente['socket_id'] = request.sid
                jugador_existente['esta_listo'] = False  # Resetear estado listo
                jugador = jugador_existente
                print(f'🔄 {nombre} se reunió a sala {codigo}')
            else:
                # Verificar si la sala está llena (solo para jugadores nuevos)
                # Si la sala se ajustó automáticamente, permitir expansión hasta el límite original
                limite_actual = min(sala['max_jugadores'], 10)  # Máximo absoluto de 10
                if len(sala['jugadores']) >= limite_actual:
                    if sala['max_jugadores'] < 10:
                        # Expandir automáticamente la sala para permitir el nuevo jugador
                        nueva_capacidad = min(len(sala['jugadores']) + 1, 10)
                        print(f'🔄 Expandiendo sala {codigo} de {sala["max_jugadores"]} a {nueva_capacidad} jugadores')
                        sala['max_jugadores'] = nueva_capacidad
                        
                        # Actualizar en BD
                        try:
                            conn = get_db_connection()
                            cursor = conn.cursor()
                            cursor.execute("""
                                UPDATE salas_duelazo 
                                SET max_jugadores = %s 
                                WHERE codigo = %s
                            """, (nueva_capacidad, codigo))
                            conn.commit()
                            cursor.close()
                            conn.close()
                        except Exception as e:
                            print(f'❌ Error al expandir sala: {str(e)}')
                    else:
                        emit('error', {'message': 'La sala está llena'})
                        return
                
                # Verificar si la sala ya empezó (solo para jugadores nuevos)
                if sala['estado'] != 'esperando':
                    emit('error', {'message': 'La partida ya comenzó'})
                    return
                
                # Agregar jugador nuevo
                jugador = {
                    'socket_id': request.sid,
                    'nombre': nombre,
                    'esta_listo': False,
                    'puntuacion_ronda1': 0,
                    'puntuacion_final': 0,
                    'puntuacion_total': 0,
                    'clasifico_final': False
                }
                
                sala['jugadores'].append(jugador)
                print(f'👤 {nombre} se unió a sala {codigo} (nuevo)')
            
            # Unir a la sala de Socket.IO
            join_room(codigo)
            
            # Solo guardar en base de datos si es jugador nuevo
            if not jugador_existente:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO jugadores_sala (sala_id, nombre_jugador, socket_id)
                    VALUES (%s, %s, %s)
                """, (sala['id'], nombre, request.sid))
                conn.commit()
                cursor.close()
                conn.close()
            
            # Notificar al jugador que se unió
            print(f'✅ Enviando unido_a_sala a {nombre} con {len(sala["jugadores"])} jugadores')
            emit('unido_a_sala', {
                'success': True,
                'codigo': codigo,
                'sala': {
                    'codigo': codigo,
                    'creador': sala['creador'],
                    'jugadores': sala['jugadores'],
                    'max_jugadores': sala['max_jugadores']
                }
            })
            
            # Notificar a todos en la sala
            socketio.emit('jugador_unido', {
                'jugador': jugador,
                'jugadores': sala['jugadores'],
                'total': len(sala['jugadores']),
                'max_jugadores': sala['max_jugadores']  # Incluir el límite actualizado
            }, room=codigo)
            
        except Exception as e:
            print(f'❌ Error al unirse a sala: {str(e)}')
            emit('error', {'message': f'Error al unirse: {str(e)}'})
    
    @socketio.on('marcar_listo')
    def handle_marcar_listo(data):
        """Un jugador marca que está listo para comenzar."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            sala = salas_activas[codigo]
            
            # ✅ VERIFICAR QUE NO ESTEMOS EN ESTADO DE ESPERA FINAL
            if sala.get('estado') == 'espera_final':
                print(f'⚠️ Ignorando marcar_listo en {codigo} - sala en espera_final (usar finalista_listo)')
                emit('error', {'message': 'La sala está en espera final. Los finalistas deben usar el botón correspondiente.'})
                return
            
            # Marcar jugador como listo
            jugador_encontrado = False
            for jugador in sala['jugadores']:
                if jugador['socket_id'] == request.sid:
                    # ✅ VERIFICAR QUE EL JUGADOR NO SEA FINALISTA
                    if jugador.get('clasifico_final', False):
                        print(f'⚠️ Finalista {jugador["nombre"]} intentando marcar listo en sala normal - redirigiendo')
                        emit('error', {'message': 'Eres finalista. Ve a la pantalla de Final.'})
                        return
                    
                    jugador['esta_listo'] = True
                    jugador_encontrado = True
                    break
            
            if not jugador_encontrado:
                print(f'❌ Jugador no encontrado en sala {codigo}')
                return
            
            # Contar solo jugadores NO finalistas
            jugadores_no_finalistas = [j for j in sala['jugadores'] if not j.get('clasifico_final', False)]
            listos = sum(1 for j in jugadores_no_finalistas if j['esta_listo'])
            total = len(jugadores_no_finalistas)
            
            print(f'✅ Jugadores NO finalistas listos en {codigo}: {listos}/{total}')
            
            # Notificar a todos
            socketio.emit('estado_listos', {
                'listos': listos,
                'total': total,
                'jugadores': sala['jugadores']  # Enviar todos para mostrar en UI
            }, room=codigo)
            
            # Si todos los NO finalistas están listos, iniciar juego
            if listos == total and total >= 1:  # Al menos 1 jugador eliminado debe estar listo
                print(f'🎮 Todos los jugadores no finalistas están listos, iniciando nueva partida')
                iniciar_ronda1(codigo, socketio)
            
        except Exception as e:
            print(f'❌ Error al marcar listo: {str(e)}')
            emit('error', {'message': f'Error: {str(e)}'})
    
    @socketio.on('desmarcar_listo')
    def handle_desmarcar_listo(data):
        """Un jugador desmarca que está listo (cancela su estado listo)."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            sala = salas_activas[codigo]
            
            # Desmarcar jugador como no listo
            for jugador in sala['jugadores']:
                if jugador['socket_id'] == request.sid:
                    jugador['esta_listo'] = False
                    break
            
            # Contar jugadores listos
            listos = sum(1 for j in sala['jugadores'] if j['esta_listo'])
            total = len(sala['jugadores'])
            
            print(f'❌ Jugador desmarcado en {codigo}: {listos}/{total} listos')
            
            # Notificar a todos
            socketio.emit('estado_listos', {
                'listos': listos,
                'total': total,
                'jugadores': sala['jugadores']
            }, room=codigo)
            
        except Exception as e:
            print(f'❌ Error al desmarcar listo: {str(e)}')
            emit('error', {'message': f'Error: {str(e)}'})
    
    @socketio.on('jugador_termino_ronda1')
    def handle_jugador_termino_ronda1(data):
        """Un jugador terminó la ronda 1 - verificar si todos terminaron"""
        try:
            codigo = data.get('codigo')
            resultados = data.get('resultados', {})
            
            if codigo not in salas_activas:
                return
            
            sala = salas_activas[codigo]
            
            # Inicializar lista de jugadores que terminaron si no existe
            if 'jugadores_terminaron_r1' not in sala:
                sala['jugadores_terminaron_r1'] = []
            
            # Agregar jugador a la lista de terminados
            if request.sid not in sala['jugadores_terminaron_r1']:
                sala['jugadores_terminaron_r1'].append(request.sid)
                print(f'✅ Jugador terminó ronda 1 en {codigo}: {len(sala["jugadores_terminaron_r1"])}/{len(sala["jugadores"])}')
            
            # Si TODOS terminaron, procesar resultados
            if len(sala['jugadores_terminaron_r1']) >= len(sala['jugadores']):
                print(f'🎯 Todos terminaron ronda 1 en {codigo}, procesando resultados...')
                # Llamar a la función original de finalizar ronda 1
                handle_finalizar_ronda1(data)
                # Limpiar lista para próxima ronda
                sala['jugadores_terminaron_r1'] = []
            
        except Exception as e:
            print(f'❌ Error al manejar jugador terminó ronda 1: {str(e)}')
    
    @socketio.on('jugador_termino_final')
    def handle_jugador_termino_final(data):
        """Un jugador terminó la final - verificar si todos terminaron"""
        try:
            codigo = data.get('codigo')
            resultados = data.get('resultados', {})
            
            if codigo not in salas_activas:
                return
            
            sala = salas_activas[codigo]
            
            # Solo finalistas pueden terminar la final
            finalistas = sala.get('finalistas', [])
            if not any(f['socket_id'] == request.sid for f in finalistas):
                return
            
            # Inicializar lista de finalistas que terminaron si no existe
            if 'finalistas_terminaron' not in sala:
                sala['finalistas_terminaron'] = []
            
            # Agregar finalista a la lista de terminados
            if request.sid not in sala['finalistas_terminaron']:
                sala['finalistas_terminaron'].append(request.sid)
                print(f'✅ Finalista terminó en {codigo}: {len(sala["finalistas_terminaron"])}/{len(finalistas)}')
            
            # Si TODOS los finalistas terminaron, procesar resultados
            if len(sala['finalistas_terminaron']) >= len(finalistas):
                print(f'🏆 Todos los finalistas terminaron en {codigo}, procesando resultados...')
                # Llamar a la función original de finalizar partida
                handle_finalizar_partida(data)
                # Limpiar lista
                sala['finalistas_terminaron'] = []
            
        except Exception as e:
            print(f'❌ Error al manejar finalista terminó: {str(e)}')
    
    @socketio.on('enviar_respuesta')
    def handle_enviar_respuesta(data):
        """Procesa la respuesta de un jugador."""
        try:
            codigo = data.get('codigo')
            pregunta_id = data.get('pregunta_id')
            respuesta = data.get('respuesta')
            tiempo = data.get('tiempo', 15)
            ronda = data.get('ronda', 'ronda1')
            
            if codigo not in salas_activas:
                return
            
            sala = salas_activas[codigo]
            
            # Buscar jugador
            jugador = None
            for j in sala['jugadores']:
                if j['socket_id'] == request.sid:
                    jugador = j
                    break
            
            if not jugador:
                return
            
            # Verificar respuesta
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT respuesta_correcta FROM preguntas_futbol WHERE id = %s", (pregunta_id,))
            pregunta = cursor.fetchone()
            
            # Comparar respuestas (trim y case-insensitive para evitar errores)
            if pregunta:
                respuesta_correcta_db = pregunta['respuesta_correcta'].strip()
                respuesta_usuario = respuesta.strip()
                es_correcta = respuesta_correcta_db == respuesta_usuario
                
                # Debug log
                print(f'🔍 Pregunta {pregunta_id}:')
                print(f'   Respuesta usuario: "{respuesta_usuario}"')
                print(f'   Respuesta correcta: "{respuesta_correcta_db}"')
                print(f'   ¿Es correcta? {es_correcta}')
            else:
                es_correcta = False
            
            # Calcular puntos
            puntos = 0
            if es_correcta:
                puntos_base = 100
                bono_tiempo = int((tiempo / 15) * 50)
                puntos = puntos_base + bono_tiempo
            
            # Actualizar puntuación
            if ronda == 'ronda1':
                jugador['puntuacion_ronda1'] += puntos
            else:
                jugador['puntuacion_final'] += puntos
            
            jugador['puntuacion_total'] = jugador['puntuacion_ronda1'] + jugador['puntuacion_final']
            
            cursor.close()
            conn.close()
            
            # Enviar confirmación al jugador
            emit('respuesta_procesada', {
                'es_correcta': es_correcta,
                'puntos_ganados': puntos,
                'puntuacion_total': jugador['puntuacion_total']
            })
            
        except Exception as e:
            print(f'❌ Error al procesar respuesta: {str(e)}')
    
    @socketio.on('finalizar_ronda1')
    def handle_finalizar_ronda1(data):
        """Finaliza la Ronda 1 y selecciona finalistas."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                return
            
            sala = salas_activas[codigo]
            
            # Ordenar jugadores por puntuación de ronda 1
            sala['jugadores'].sort(key=lambda x: x['puntuacion_ronda1'], reverse=True)
            
            # Los top 2 avanzan a la final
            if len(sala['jugadores']) >= 2:
                sala['jugadores'][0]['clasifico_final'] = True
                sala['jugadores'][1]['clasifico_final'] = True
            
            finalistas = [j for j in sala['jugadores'] if j['clasifico_final']]
            
            # Guardar finalistas en la sala para uso posterior
            sala['finalistas'] = finalistas
            
            # ✅ CAMBIAR ESTADO DE SALA A ESPERA_FINAL
            if len(finalistas) >= 2:
                sala['estado'] = 'espera_final'
                print(f'🎯 Sala {codigo} cambiada a estado: espera_final')
            
            print(f'🏆 Finalistas de sala {codigo}: {[f["nombre"] for f in finalistas]}')
            
            # Notificar resultados de ronda 1
            socketio.emit('resultados_ronda1', {
                'jugadores': sala['jugadores'],
                'finalistas': finalistas
            }, room=codigo)
            
        except Exception as e:
            print(f'❌ Error al finalizar ronda 1: {str(e)}')
    
    @socketio.on('iniciar_final')
    def handle_iniciar_final(data):
        """Inicia la ronda final con preguntas más difíciles."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                return
            
            sala = salas_activas[codigo]
            sala['estado'] = 'jugando_final'
            
            # Obtener 10 preguntas más difíciles (más avanzadas)
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                (SELECT * FROM preguntas_futbol WHERE dificultad = 'intermedia' ORDER BY RAND() LIMIT 3)
                UNION ALL
                (SELECT * FROM preguntas_futbol WHERE dificultad = 'avanzada' ORDER BY RAND() LIMIT 7)
            """)
            
            preguntas = cursor.fetchall()
            random.shuffle(preguntas)
            
            # Convertir a formato frontend
            preguntas_formateadas = []
            for p in preguntas:
                preguntas_formateadas.append({
                    'id': p['id'],
                    'pregunta': p['pregunta'],
                    'opciones': [p['opcion_a'], p['opcion_b'], p['opcion_c'], p['opcion_d']],
                    'respuesta_correcta': p['respuesta_correcta'],  # ← AGREGADO
                    'dificultad': p['dificultad']
                })
            
            sala['preguntas_final'] = preguntas_formateadas
            
            cursor.close()
            conn.close()
            
            print(f'🔥 Iniciando Final en sala {codigo}')
            
            # Notificar a los finalistas
            socketio.emit('iniciar_final', {
                'preguntas': preguntas_formateadas,
                'total_preguntas': len(preguntas_formateadas)
            }, room=codigo)
            
        except Exception as e:
            print(f'❌ Error al iniciar final: {str(e)}')
    
    @socketio.on('finalizar_partida')
    def handle_finalizar_partida(data):
        """Finaliza la partida y declara al ganador."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                return
            
            sala = salas_activas[codigo]
            sala['estado'] = 'finalizado'
            
            # Ordenar todos los jugadores por puntuación total
            sala['jugadores'].sort(key=lambda x: x['puntuacion_total'], reverse=True)
            
            ganador = sala['jugadores'][0] if sala['jugadores'] else None
            
            print(f'👑 Ganador de sala {codigo}: {ganador["nombre"] if ganador else "N/A"}')
            
            # Notificar resultados finales
            socketio.emit('resultados_finales', {
                'ganador': ganador,
                'ranking': sala['jugadores']
            }, room=codigo)
            
            # Actualizar base de datos
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE salas_duelazo 
                SET estado = 'finalizado', 
                    fecha_fin = NOW(),
                    ganador = %s
                WHERE codigo = %s
            """, (ganador['nombre'] if ganador else None, codigo))
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f'❌ Error al finalizar partida: {str(e)}')

def iniciar_ronda1(codigo, socketio):
    """Inicia la Ronda 1 de la partida."""
    try:
        sala = salas_activas[codigo]
        sala['estado'] = 'jugando_ronda1'
        
        # ✅ RESETEAR PUNTUACIONES AL INICIAR NUEVA PARTIDA
        print(f'🔄 Reseteando puntuaciones para nueva partida en sala {codigo}')
        for jugador in sala['jugadores']:
            jugador['puntuacion_ronda1'] = 0
            jugador['puntuacion_final'] = 0
            jugador['puntuacion_total'] = 0
            jugador['clasifico_final'] = False
        
        # Obtener 10 preguntas aleatorias (mezcla de dificultades)
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            (SELECT * FROM preguntas_futbol WHERE dificultad = 'facil' ORDER BY RAND() LIMIT 3)
            UNION ALL
            (SELECT * FROM preguntas_futbol WHERE dificultad = 'intermedia' ORDER BY RAND() LIMIT 4)
            UNION ALL
            (SELECT * FROM preguntas_futbol WHERE dificultad = 'avanzada' ORDER BY RAND() LIMIT 3)
        """)
        
        preguntas = cursor.fetchall()
        random.shuffle(preguntas)  # Mezclar el orden
        
        # Convertir a formato frontend
        preguntas_formateadas = []
        for p in preguntas:
            preguntas_formateadas.append({
                'id': p['id'],
                'pregunta': p['pregunta'],
                'opciones': [p['opcion_a'], p['opcion_b'], p['opcion_c'], p['opcion_d']],
                'respuesta_correcta': p['respuesta_correcta'],  # ← AGREGADO
                'dificultad': p['dificultad']
            })
        
        sala['preguntas_ronda1'] = preguntas_formateadas
        
        cursor.close()
        conn.close()
        
        print(f'🎯 Iniciando Ronda 1 en sala {codigo}')
        
        # Notificar a todos que empieza la ronda 1
        socketio.emit('iniciar_ronda1', {
            'preguntas': preguntas_formateadas,
            'total_preguntas': len(preguntas_formateadas)
        }, room=codigo)
        
    except Exception as e:
        print(f'❌ Error al iniciar ronda 1: {str(e)}')

    @socketio.on('finalista_listo')
    def handle_finalista_listo(data):
        """Maneja cuando un finalista marca que está listo para la final."""
        try:
            codigo = data.get('codigo')
            print(f'🎯 Recibido finalista_listo para sala {codigo}')
            
            if codigo not in salas_activas:
                print(f'❌ Sala {codigo} no encontrada')
                return
            
            sala = salas_activas[codigo]
            print(f'📊 Estado actual de la sala: {sala.get("estado", "sin_estado")}')
            print(f'👥 Finalistas en sala: {len(sala.get("finalistas", []))}')
            
            # Inicializar lista de finalistas listos si no existe
            if 'finalistas_listos' not in sala:
                sala['finalistas_listos'] = []
            
            # Agregar finalista a la lista si no está ya
            socket_id = request.sid
            print(f'🔍 Buscando finalista con socket_id: {socket_id}')
            
            if socket_id not in [f['socket_id'] for f in sala['finalistas_listos']]:
                # Buscar datos del finalista
                finalista = None
                for f in sala.get('finalistas', []):
                    if f['socket_id'] == socket_id:
                        finalista = f
                        break
                
                if finalista:
                    sala['finalistas_listos'].append(finalista)
                    print(f'✅ Finalista {finalista["nombre"]} listo en sala {codigo}')
                    print(f'📋 Total finalistas listos: {len(sala["finalistas_listos"])}/2')
                else:
                    print(f'❌ No se encontró finalista con socket_id: {socket_id}')
                    print(f'🔍 Finalistas disponibles: {[f.get("socket_id") for f in sala.get("finalistas", [])]}')
            else:
                print(f'⚠️ Finalista ya estaba listo: {socket_id}')
            
            # Notificar actualización a todos en la sala
            socketio.emit('finalistas_listos_update', {
                'finalistas_listos': sala['finalistas_listos'],
                'total_finalistas': len(sala.get('finalistas', []))
            }, room=codigo)
            
            # Si ambos finalistas están listos, iniciar la final
            if len(sala['finalistas_listos']) == 2:
                print(f'🔥 Ambos finalistas listos, iniciando final en sala {codigo}')
                
                # Cambiar estado de la sala
                sala['estado'] = 'jugando_final'
                
                # Obtener preguntas difíciles para la final
                conn = get_db_connection()
                cursor = conn.cursor(dictionary=True)
                
                cursor.execute("""
                    (SELECT * FROM preguntas_futbol WHERE dificultad = 'intermedia' ORDER BY RAND() LIMIT 3)
                    UNION ALL
                    (SELECT * FROM preguntas_futbol WHERE dificultad = 'avanzada' ORDER BY RAND() LIMIT 7)
                """)
                
                preguntas = cursor.fetchall()
                random.shuffle(preguntas)
                
                # Convertir a formato frontend
                preguntas_formateadas = []
                for p in preguntas:
                    preguntas_formateadas.append({
                        'id': p['id'],
                        'pregunta': p['pregunta'],
                        'opciones': [p['opcion_a'], p['opcion_b'], p['opcion_c'], p['opcion_d']],
                        'respuesta_correcta': p['respuesta_correcta'],
                        'dificultad': p['dificultad']
                    })
                
                sala['preguntas_final'] = preguntas_formateadas
                
                cursor.close()
                conn.close()
                
                # Notificar que la final está iniciando
                socketio.emit('finalistas_listos_update', {
                    'finalistas_listos': sala['finalistas_listos'],
                    'datos_final': {
                        'preguntas': preguntas_formateadas,
                        'total_preguntas': len(preguntas_formateadas)
                    }
                }, room=codigo)
                
        except Exception as e:
            print(f'❌ Error al marcar finalista listo: {str(e)}')
    
    @socketio.on('cerrar_sala')
    def handle_cerrar_sala(data):
        """El host cierra la sala para todos."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            sala = salas_activas[codigo]
            
            # Verificar que el que cierra sea el host (primer jugador)
            if sala['jugadores'] and sala['jugadores'][0]['socket_id'] == request.sid:
                print(f'🚪 Host cerrando sala: {codigo}')
                
                # Notificar a todos los jugadores que la sala se cerró
                socketio.emit('sala_cerrada', {
                    'message': 'La sala ha sido cerrada por el host'
                }, room=codigo)
                
                # Remover jugadores de la sala
                for jugador in sala['jugadores']:
                    leave_room(codigo, sid=jugador['socket_id'])
                
                # Eliminar sala
                del salas_activas[codigo]
            else:
                emit('error', {'message': 'Solo el host puede cerrar la sala'})
                
        except Exception as e:
            print(f'❌ Error al cerrar sala: {str(e)}')
    
    @socketio.on('salir_sala')
    def handle_salir_sala(data):
        """Un jugador abandona la sala."""
        try:
            codigo = data.get('codigo')
            
            if codigo not in salas_activas:
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            sala = salas_activas[codigo]
            
            # Remover jugador de la sala
            jugadores_actualizados = [j for j in sala['jugadores'] if j['socket_id'] != request.sid]
            sala['jugadores'] = jugadores_actualizados
            
            # Salir de la room de Socket.IO
            leave_room(codigo)
            
            print(f'🚪 Jugador salió de sala {codigo}. Jugadores restantes: {len(jugadores_actualizados)}')
            
            # Si no quedan jugadores, eliminar sala
            if len(jugadores_actualizados) == 0:
                del salas_activas[codigo]
                print(f'🗑️ Sala {codigo} eliminada (sin jugadores)')
            else:
                # Notificar a los jugadores restantes
                socketio.emit('jugador_salio', {
                    'jugadores': jugadores_actualizados,
                    'total': len(jugadores_actualizados)
                }, room=codigo)
                
        except Exception as e:
            print(f'❌ Error al salir de sala: {str(e)}')
    
    @socketio.on('obtener_estado_sala')
    def handle_obtener_estado_sala(data):
        """Obtiene el estado actual de una sala."""
        try:
            codigo = data.get('codigoSala')
            
            if codigo not in salas_activas:
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            sala = salas_activas[codigo]
            
            print(f'📊 Enviando estado de sala {codigo} a {request.sid}')
            
            # Enviar estado actual de la sala
            emit('estado_sala_actual', {
                'sala': {
                    'codigo': codigo,
                    'creador': sala['creador'],
                    'jugadores': sala['jugadores'],
                    'max_jugadores': sala['max_jugadores'],
                    'estado': sala['estado']
                },
                'jugadores': sala['jugadores'],
                'total': len(sala['jugadores']),
                'max_jugadores': sala['max_jugadores']
            })
                
        except Exception as e:
            print(f'❌ Error al obtener estado de sala: {str(e)}')
            emit('error', {'message': f'Error al obtener estado: {str(e)}'})

    @socketio.on('actualizar_configuracion_sala')
    def handle_actualizar_configuracion_sala(data):
        """El host actualiza la configuración de participantes de la sala."""
        try:
            codigo = data.get('codigo', '').upper()
            nuevo_max_jugadores = data.get('max_jugadores', 10)
            
            print(f'⚙️ Actualizando configuración de sala {codigo} - Nuevo máximo: {nuevo_max_jugadores}')
            
            if codigo not in salas_activas:
                emit('error', {'message': 'Sala no encontrada'})
                return
            
            sala = salas_activas[codigo]
            
            # Verificar que el jugador que solicita el cambio es el host
            jugador_actual = None
            for jugador in sala['jugadores']:
                if jugador['socket_id'] == request.sid:
                    jugador_actual = jugador
                    break
            
            if not jugador_actual or jugador_actual['nombre'] != sala['creador']:
                emit('error', {'message': 'Solo el host puede cambiar la configuración'})
                return
            
            # Validar el nuevo número de jugadores
            if nuevo_max_jugadores < 2 or nuevo_max_jugadores > 10:
                emit('error', {'message': 'El número de jugadores debe estar entre 2 y 10'})
                return
            
            if nuevo_max_jugadores < len(sala['jugadores']):
                emit('error', {
                    'message': f'No se puede reducir a {nuevo_max_jugadores}. Hay {len(sala["jugadores"])} jugadores conectados.'
                })
                return
            
            # Actualizar la configuración en memoria
            sala['max_jugadores'] = nuevo_max_jugadores
            
            # Actualizar en base de datos
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE salas_duelazo 
                SET max_jugadores = %s 
                WHERE codigo = %s
            """, (nuevo_max_jugadores, codigo))
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f'✅ Configuración actualizada para sala {codigo}: {nuevo_max_jugadores} jugadores máximo')
            
            # Notificar a todos los jugadores de la sala sobre el cambio
            emit('configuracion_sala_actualizada', {
                'max_jugadores': nuevo_max_jugadores,
                'jugadores': sala['jugadores'],
                'total': len(sala['jugadores']),
                'mensaje': f'El host cambió el límite a {nuevo_max_jugadores} jugadores'
            }, room=codigo)
            
        except Exception as e:
            print(f'❌ Error al actualizar configuración de sala: {str(e)}')
            emit('error', {'message': f'Error al actualizar configuración: {str(e)}'})

# Exportar función para registrar eventos
def init_socketio_events(socketio):
    """Inicializa todos los eventos de Socket.IO."""
    registrar_eventos_socket(socketio)
