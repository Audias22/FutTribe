// frontend/src/JuegoMultiplayer.js
import React, { useState, useEffect } from 'react';
import socket from './socket';

function JuegoMultiplayer({ codigoSala, nombreJugador, preguntas, ronda, onFinalizarRonda }) {
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState('');
  const [respondido, setRespondido] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(15);
  const [puntuacionTotal, setPuntuacionTotal] = useState(0);
  const [respuestasCorrectas, setRespuestasCorrectas] = useState(0);
  const [feedbackRespuesta, setFeedbackRespuesta] = useState(null);

  const preguntaActual = preguntas[indicePregunta];

  // Timer
  useEffect(() => {
    if (respondido || !preguntaActual) return;

    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [indicePregunta, respondido, preguntaActual]);

  // Escuchar respuesta procesada
  useEffect(() => {
    socket.on('respuesta_procesada', (data) => {
      console.log('📊 Respuesta procesada:', data);
      setPuntuacionTotal(data.puntuacion_total);
      
      if (data.es_correcta) {
        setRespuestasCorrectas((prev) => prev + 1);
      }

      setFeedbackRespuesta({
        correcta: data.es_correcta,
        puntos: data.puntos_ganados
      });

      // Siguiente pregunta después de 2 segundos
      setTimeout(() => {
        if (indicePregunta < preguntas.length - 1) {
          setIndicePregunta((prev) => prev + 1);
          setRespondido(false);
          setRespuestaSeleccionada('');
          setTiempoRestante(15);
          setFeedbackRespuesta(null);
        } else {
          // Terminó la ronda
          finalizarRonda();
        }
      }, 2000);
    });

    return () => {
      socket.off('respuesta_procesada');
    };
  }, [indicePregunta, preguntas.length]);

  const handleRespuesta = (opcion) => {
    if (respondido) return;

    setRespondido(true);
    setRespuestaSeleccionada(opcion);

    socket.emit('enviar_respuesta', {
      codigo: codigoSala,
      pregunta_id: preguntaActual.id,
      respuesta: opcion,
      tiempo: tiempoRestante,
      ronda: ronda
    });
  };

  const handleTimeOut = () => {
    if (!respondido) {
      setRespondido(true);
      setFeedbackRespuesta({
        correcta: false,
        puntos: 0
      });

      setTimeout(() => {
        if (indicePregunta < preguntas.length - 1) {
          setIndicePregunta((prev) => prev + 1);
          setRespondido(false);
          setRespuestaSeleccionada('');
          setTiempoRestante(15);
          setFeedbackRespuesta(null);
        } else {
          finalizarRonda();
        }
      }, 2000);
    }
  };

  const finalizarRonda = () => {
    const resultados = {
      puntuacion: puntuacionTotal,
      correctas: respuestasCorrectas,
      total: preguntas.length
    };

    // NUEVO: Solo notificar que este jugador terminó
    if (ronda === 'ronda1') {
      socket.emit('jugador_termino_ronda1', { 
        codigo: codigoSala,
        resultados: resultados
      });
      
      // Esperar a que TODOS terminen
      socket.once('resultados_ronda1', (data) => {
        onFinalizarRonda({ ...resultados, ...data });
      });
    } else {
      socket.emit('jugador_termino_final', { 
        codigo: codigoSala,
        resultados: resultados
      });
      
      // Esperar a que TODOS terminen
      socket.once('resultados_finales', (data) => {
        onFinalizarRonda({ ...resultados, ...data });
      });
    }
  };

  if (!preguntaActual) {
    return (
      <div className="cargando-preguntas">
        <h2>⏳ Cargando preguntas...</h2>
      </div>
    );
  }

  const porcentajeTiempo = (tiempoRestante / 15) * 100;
  const urgente = tiempoRestante <= 5;

  return (
    <div className="juego-multiplayer">
      <div className="header-juego">
        <div className="info-ronda">
          <span className="badge-ronda">
            {ronda === 'ronda1' ? '🥊 RONDA 1' : '🏆 FINAL'}
          </span>
          <span className="progreso-preguntas">
            Pregunta {indicePregunta + 1}/{preguntas.length}
          </span>
        </div>

        <div className="puntuacion-header">
          <span className="puntos">⭐ {puntuacionTotal} pts</span>
          <span className="correctas">✅ {respuestasCorrectas}/{preguntas.length}</span>
        </div>
      </div>

      <div className="timer-container">
        <div className="timer-numero">{tiempoRestante}s</div>
        <div className="timer-barra">
          <div
            className={`timer-progreso ${urgente ? 'urgente' : ''}`}
            style={{ width: `${porcentajeTiempo}%` }}
          ></div>
        </div>
      </div>

      <div className="pregunta-card">
        <span className={`badge-dificultad ${preguntaActual.dificultad}`}>
          {preguntaActual.dificultad}
        </span>
        <h2 className="pregunta-texto">{preguntaActual.pregunta}</h2>
      </div>

      <div className="opciones-grid">
        {preguntaActual.opciones.map((opcion, index) => {
          const letras = ['A', 'B', 'C', 'D'];
          const esSeleccionada = respuestaSeleccionada === opcion;
          let claseOpcion = 'opcion-btn';

          if (respondido && esSeleccionada) {
            claseOpcion += feedbackRespuesta?.correcta ? ' correcta' : ' incorrecta';
          }

          return (
            <button
              key={index}
              className={claseOpcion}
              onClick={() => handleRespuesta(opcion)}
              disabled={respondido}
            >
              <span className="letra-opcion">{letras[index]}</span>
              <span className="texto-opcion">{opcion}</span>
            </button>
          );
        })}
      </div>

      {feedbackRespuesta && (
        <div className={`feedback-respuesta ${feedbackRespuesta.correcta ? 'correcta' : 'incorrecta'}`}>
          {feedbackRespuesta.correcta ? (
            <>
              <span className="icono">✅</span>
              <span className="mensaje">¡Correcto! +{feedbackRespuesta.puntos} puntos</span>
            </>
          ) : (
            <>
              <span className="icono">❌</span>
              <span className="mensaje">Incorrecto</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default JuegoMultiplayer;
