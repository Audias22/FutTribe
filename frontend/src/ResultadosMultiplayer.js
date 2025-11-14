// frontend/src/ResultadosMultiplayer.js
import React, { useEffect } from 'react';
import socket from './socket';

function ResultadosMultiplayer({ codigoSala, datos, esFinal, isAuthenticated, actualizarEstadisticas, onContinuar, onIrEsperaFinal }) {
  
  // Actualizar estadísticas cuando el componente se monta (solo para finales)
  useEffect(() => {
    if (esFinal && isAuthenticated && actualizarEstadisticas && datos?.jugadores) {
      // Encontrar mi puntuación
      const miJugador = datos.jugadores.find(j => j.socket_id === socket.id);
      if (miJugador) {
        const puntuacion = miJugador.puntuacion || 0;
        // Verificar si gané (primer lugar)
        const gane = datos.jugadores[0]?.socket_id === socket.id;
        
        // Actualizar estadísticas en multijugador
        // TODO: Separar puntos multijugador de victorias
        console.log('Actualizando estadísticas multijugador:', { puntuacion, gane });
        actualizarEstadisticas(puntuacion, gane);
      }
    }
  }, [esFinal, isAuthenticated, actualizarEstadisticas, datos]);

  const handleContinuar = () => {
    if (esFinal) {
      // Volver a la sala de espera en lugar de desconectarse
      onContinuar(null);
    } else {
      // Ir a la pantalla de espera de la final
      onIrEsperaFinal();
    }
  };

  const soyFinalista = !esFinal && datos?.finalistas?.some(f => f.socket_id === socket.id);

  return (
    <div className="resultados-multiplayer">
      {!esFinal && (
        <>
          <h1 className="titulo-resultados">📊 Resultados - Ronda 1</h1>
          
          <div className="ranking-container">
            <h3>🏅 Clasificación General</h3>
            <ul className="ranking-lista">
              {datos?.jugadores?.map((jugador, index) => (
                <li key={index} className={`ranking-item posicion-${index + 1}`}>
                  <span className="posicion">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                  </span>
                  <span className="nombre">{jugador.nombre}</span>
                  <span className="puntos">{jugador.puntuacion_ronda1} pts</span>
                  {jugador.clasifico_final && <span className="badge-finalista">✨ FINALISTA</span>}
                </li>
              ))}
            </ul>
          </div>

          {soyFinalista ? (
            <div className="mensaje-clasificacion clasificado">
              <h2>🎉 ¡Clasificaste a la FINAL!</h2>
              <p>Prepárate para preguntas más difíciles...</p>
              <button className="btn-continuar final" onClick={handleContinuar}>
                🔥 Ir a la Final
              </button>
            </div>
          ) : (
            <div className="mensaje-clasificacion eliminado">
              <h2>😔 No clasificaste a la final</h2>
              <p>¡Sigue practicando para la próxima!</p>
              <button className="btn-continuar" onClick={() => onContinuar(null)}>
                🏠 Volver a la Sala
              </button>
            </div>
          )}
        </>
      )}

      {esFinal && (
        <>
          <h1 className="titulo-resultados">🏆 RESULTADOS FINALES</h1>
          
          <div className="ganador-container">
            {datos?.ganador && (
              <div className="ganador-card">
                <div className="corona">👑</div>
                <h2 className="nombre-ganador">{datos.ganador.nombre}</h2>
                <p className="puntos-ganador">{datos.ganador.puntuacion_total} puntos</p>
                <p className="subtitulo-ganador">¡Campeón de El Duelazo!</p>
              </div>
            )}
          </div>

          {isAuthenticated && (() => {
            const miJugador = datos?.jugadores?.find(j => j.socket_id === socket.id);
            const gane = datos?.jugadores?.[0]?.socket_id === socket.id;
            if (miJugador) {
              return (
                <div className="stats-saved-message-multiplayer">
                  🎯 <strong>+{miJugador.puntuacion || 0} puntos</strong> agregados a tu perfil
                  {gane && <div className="victoria-badge">🏆 +1 victoria multijugador</div>}
                </div>
              );
            }
            return null;
          })()}

          <div className="ranking-final">
            <h3>📋 Clasificación Final</h3>
            <ul className="ranking-lista">
              {datos?.ranking?.map((jugador, index) => (
                <li key={index} className={`ranking-item posicion-${index + 1}`}>
                  <span className="posicion">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                  </span>
                  <div className="info-jugador">
                    <span className="nombre">{jugador.nombre}</span>
                    <div className="desglose-puntos">
                      <small>R1: {jugador.puntuacion_ronda1} | Final: {jugador.puntuacion_final}</small>
                    </div>
                  </div>
                  <span className="puntos-total">{jugador.puntuacion_total} pts</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="acciones-finales">
            <button className="btn-continuar" onClick={handleContinuar}>
              🔄 Volver a la Sala
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ResultadosMultiplayer;
