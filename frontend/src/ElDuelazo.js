import React, { useState, useEffect } from 'react';
import './ElDuelazo.css';

function ElDuelazo({ onVolver }) {
  const [pantalla, setPantalla] = useState('inicio'); // inicio, jugando, resultado
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [puntuacion, setPuntuacion] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dificultad, setDificultad] = useState('todas');

  const API_BASE_URL = 'https://futtribe-production.up.railway.app';

  // Manejar navegación del navegador (botón atrás)
  useEffect(() => {
    // Agregar una entrada al historial cuando entramos
    window.history.pushState({ page: 'duelazo' }, '', '');

    const handlePopState = (event) => {
      // Si estamos en la pantalla de inicio, volver al menú principal
      if (pantalla === 'inicio') {
        onVolver();
      } else {
        // Si estamos jugando o en resultados, volver a inicio de duelazo
        setPantalla('inicio');
        // Agregar nueva entrada para mantener el historial
        window.history.pushState({ page: 'duelazo' }, '', '');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pantalla, onVolver]);

  // Cargar preguntas
  const cargarPreguntas = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/preguntas?dificultad=${dificultad}&cantidad=10&aleatorio=true`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar las preguntas');
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setPreguntas(data.data);
        setPantalla('jugando');
        setPreguntaActual(0);
        setRespuestas([]);
        setPuntuacion(0);
        setTiempoRestante(15);
      } else {
        setError('No se encontraron preguntas disponibles');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Timer para cada pregunta
  useEffect(() => {
    if (pantalla === 'jugando' && tiempoRestante > 0) {
      const timer = setTimeout(() => {
        setTiempoRestante(tiempoRestante - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (pantalla === 'jugando' && tiempoRestante === 0) {
      // Tiempo agotado, pasar a la siguiente pregunta
      handleRespuesta(null);
    }
  }, [pantalla, tiempoRestante]);

  const handleRespuesta = (opcionSeleccionada) => {
    const pregunta = preguntas[preguntaActual];
    const esCorrecta = opcionSeleccionada === pregunta.respuesta_correcta;
    
    // Calcular puntos (más tiempo = más puntos)
    const puntosBase = esCorrecta ? 100 : 0;
    const bonoTiempo = esCorrecta ? Math.floor((tiempoRestante / 15) * 50) : 0;
    const puntosGanados = puntosBase + bonoTiempo;
    
    setRespuestas([
      ...respuestas,
      {
        pregunta: pregunta.pregunta,
        respuestaUsuario: opcionSeleccionada,
        respuestaCorrecta: pregunta.respuesta_correcta,
        esCorrecta,
        puntos: puntosGanados,
        tiempo: 15 - tiempoRestante
      }
    ]);
    
    setPuntuacion(puntuacion + puntosGanados);
    
    // Siguiente pregunta o resultado final
    if (preguntaActual < preguntas.length - 1) {
      setTimeout(() => {
        setPreguntaActual(preguntaActual + 1);
        setTiempoRestante(15);
      }, 1500);
    } else {
      setTimeout(() => {
        setPantalla('resultado');
      }, 1500);
    }
  };

  const reiniciar = () => {
    setPantalla('inicio');
    setPreguntas([]);
    setPreguntaActual(0);
    setRespuestas([]);
    setPuntuacion(0);
    setTiempoRestante(15);
    setError('');
  };

  // Pantalla de Inicio
  if (pantalla === 'inicio') {
    return (
      <div className="duelazo-container">
        <div className="duelazo-inicio">
          <button className="btn-volver" onClick={onVolver}>
            ← Volver al Menú
          </button>
          
          <h1 className="duelazo-titulo">⚡ El Duelazo de la Jornada ⚡</h1>
          <p className="duelazo-descripcion">
            Responde 10 preguntas de fútbol lo más rápido posible. 
            ¡Más velocidad = más puntos!
          </p>
          
          <div className="seleccion-dificultad">
            <h3>Selecciona la dificultad:</h3>
            <div className="dificultad-opciones">
              <button 
                className={`btn-dificultad ${dificultad === 'todas' ? 'activo' : ''}`}
                onClick={() => setDificultad('todas')}
              >
                🎯 Todas
              </button>
              <button 
                className={`btn-dificultad ${dificultad === 'facil' ? 'activo' : ''}`}
                onClick={() => setDificultad('facil')}
              >
                😊 Fácil
              </button>
              <button 
                className={`btn-dificultad ${dificultad === 'intermedia' ? 'activo' : ''}`}
                onClick={() => setDificultad('intermedia')}
              >
                🤔 Intermedia
              </button>
              <button 
                className={`btn-dificultad ${dificultad === 'avanzada' ? 'activo' : ''}`}
                onClick={() => setDificultad('avanzada')}
              >
                🔥 Avanzada
              </button>
            </div>
          </div>
          
          {error && <div className="error-mensaje">{error}</div>}
          
          <button 
            className="btn-comenzar" 
            onClick={cargarPreguntas}
            disabled={loading}
          >
            {loading ? '⏳ Cargando...' : '🚀 Comenzar Duelazo'}
          </button>
          
          <div className="reglas">
            <h4>📋 Reglas:</h4>
            <ul>
              <li>10 preguntas de fútbol</li>
              <li>15 segundos por pregunta</li>
              <li>Respuesta correcta: 100 puntos base</li>
              <li>Bono de velocidad: hasta 50 puntos extra</li>
              <li>¡Puntuación máxima: 1500 puntos!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Juego
  if (pantalla === 'jugando' && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    const opciones = [
      pregunta.opcion_a,
      pregunta.opcion_b,
      pregunta.opcion_c,
      pregunta.opcion_d
    ];
    
    return (
      <div className="duelazo-container">
        <div className="duelazo-juego">
          {/* Header con info */}
          <div className="juego-header">
            <div className="progreso">
              Pregunta {preguntaActual + 1} de {preguntas.length}
            </div>
            <div className="puntuacion-actual">
              💰 {puntuacion} pts
            </div>
          </div>
          
          {/* Timer */}
          <div className="timer-container">
            <div 
              className={`timer-barra ${tiempoRestante <= 5 ? 'urgente' : ''}`}
              style={{ width: `${(tiempoRestante / 15) * 100}%` }}
            />
            <div className="timer-numero">{tiempoRestante}s</div>
          </div>
          
          {/* Pregunta */}
          <div className="pregunta-card">
            <div className="dificultad-badge">
              {pregunta.dificultad === 'facil' && '😊 Fácil'}
              {pregunta.dificultad === 'intermedia' && '🤔 Intermedia'}
              {pregunta.dificultad === 'avanzada' && '🔥 Avanzada'}
            </div>
            <h2 className="pregunta-texto">{pregunta.pregunta}</h2>
          </div>
          
          {/* Opciones */}
          <div className="opciones-grid">
            {opciones.map((opcion, index) => (
              <button
                key={index}
                className="opcion-btn"
                onClick={() => handleRespuesta(opcion)}
              >
                <span className="opcion-letra">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="opcion-texto">{opcion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Resultados
  if (pantalla === 'resultado') {
    const correctas = respuestas.filter(r => r.esCorrecta).length;
    const porcentaje = Math.round((correctas / respuestas.length) * 100);
    
    return (
      <div className="duelazo-container">
        <div className="duelazo-resultado">
          <h1 className="resultado-titulo">🏆 ¡Duelazo Completado! 🏆</h1>
          
          <div className="resultado-stats">
            <div className="stat-card">
              <div className="stat-valor">{puntuacion}</div>
              <div className="stat-label">Puntos Totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">{correctas}/{respuestas.length}</div>
              <div className="stat-label">Correctas</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">{porcentaje}%</div>
              <div className="stat-label">Precisión</div>
            </div>
          </div>
          
          <div className="resultado-mensaje">
            {porcentaje >= 90 && '🌟 ¡Eres una leyenda del fútbol!'}
            {porcentaje >= 70 && porcentaje < 90 && '⚽ ¡Excelente conocimiento futbolero!'}
            {porcentaje >= 50 && porcentaje < 70 && '👍 ¡Buen trabajo, sigue así!'}
            {porcentaje < 50 && '💪 ¡Sigue practicando, puedes mejorar!'}
          </div>
          
          <div className="respuestas-detalle">
            <h3>📊 Detalle de Respuestas</h3>
            {respuestas.map((resp, index) => (
              <div 
                key={index} 
                className={`respuesta-item ${resp.esCorrecta ? 'correcta' : 'incorrecta'}`}
              >
                <div className="respuesta-numero">#{index + 1}</div>
                <div className="respuesta-contenido">
                  <p className="respuesta-pregunta">{resp.pregunta}</p>
                  <p className="respuesta-info">
                    {resp.esCorrecta ? (
                      <span className="correcto">
                        ✅ Correcto (+{resp.puntos} pts en {resp.tiempo}s)
                        {resp.respuestaUsuario && `
(Tu respuesta: ${resp.respuestaUsuario})`}
                      </span>
                    ) : (
                      <span className="incorrecto">
                        ❌ Incorrecto 
                        {resp.respuestaUsuario && ` (Tu respuesta: ${resp.respuestaUsuario})`}
                        <br />Correcta: {resp.respuestaCorrecta}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="resultado-botones">
            <button className="btn-reintentar" onClick={reiniciar}>
              🔄 Jugar de Nuevo
            </button>
            <button className="btn-menu" onClick={onVolver}>
              🏠 Menú Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div>Cargando...</div>;
}

export default ElDuelazo;
