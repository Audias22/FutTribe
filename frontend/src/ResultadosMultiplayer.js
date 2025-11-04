// frontend/src/ResultadosMultiplayer.js
import React from 'react';
import socket from './socket';

function ResultadosMultiplayer({ codigoSala, datos, esFinal, onContinuar }) {
  const handleContinuar = () => {
    if (esFinal) {
      // Finalizar y volver al inicio
      socket.disconnect();
      onContinuar(null);
    } else {
      // Iniciar la final
      socket.emit('iniciar_final', { codigo: codigoSala });
      
      socket.once('iniciar_final', (data) => {
        console.log('🔥 Datos de la final:', data);
        onContinuar(data);
      });
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
              <button className="btn-continuar" onClick={() => { socket.disconnect(); onContinuar(null); }}>
                🏠 Volver al Menú
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
              🏠 Volver al Menú
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ResultadosMultiplayer;
