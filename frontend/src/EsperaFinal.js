// frontend/src/EsperaFinal.js
import React, { useState, useEffect } from 'react';
import socket from './socket';

function EsperaFinal({ codigoSala, finalistas, onIniciarFinal }) {
  const [jugadoresListos, setJugadoresListos] = useState([]);
  const [yaMarqueListo, setYaMarqueListo] = useState(false);

  useEffect(() => {
    // Escuchar actualizaciones de jugadores listos para la final
    socket.on('finalistas_listos_update', (data) => {
      setJugadoresListos(data.finalistas_listos);
      
      // Si ambos finalistas están listos, iniciar la final
      if (data.finalistas_listos.length === 2) {
        setTimeout(() => {
          onIniciarFinal(data.datos_final);
        }, 1000);
      }
    });

    return () => {
      socket.off('finalistas_listos_update');
    };
  }, [onIniciarFinal]);

  const handleMarcarListo = () => {
    if (!yaMarqueListo) {
      setYaMarqueListo(true);
      socket.emit('finalista_listo', { codigo: codigoSala });
    }
  };

  const soyFinalista = finalistas?.some(f => f.socket_id === socket.id);

  return (
    <div className="espera-final">
      <div className="espera-final-container">
        <h1 className="titulo-espera-final">🏆 PREPARANDO LA FINAL</h1>
        
        <div className="finalistas-container">
          <h2>🔥 Finalistas</h2>
          <div className="finalistas-grid">
            {finalistas?.map((finalista, index) => (
              <div key={finalista.socket_id} className="finalista-card">
                <div className="finalista-avatar">
                  {index === 0 ? '🥊' : '⚔️'}
                </div>
                <h3 className="finalista-nombre">{finalista.nombre}</h3>
                <p className="finalista-puntos">{finalista.puntuacion_ronda1} pts</p>
                
                {jugadoresListos.some(j => j.socket_id === finalista.socket_id) ? (
                  <div className="estado-listo">
                    <span className="checkmark">✅</span>
                    <span>¡LISTO!</span>
                  </div>
                ) : (
                  <div className="estado-esperando">
                    <span className="loading-dots">⏳</span>
                    <span>Esperando...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {soyFinalista && (
          <div className="accion-container">
            {!yaMarqueListo ? (
              <div className="instrucciones">
                <p>🎯 ¡Llegaste a la FINAL!</p>
                <p>Las preguntas serán más difíciles. ¿Estás listo para el duelo final?</p>
                <button 
                  className="btn-listo-final"
                  onClick={handleMarcarListo}
                >
                  🔥 ¡ESTOY LISTO!
                </button>
              </div>
            ) : (
              <div className="esperando-rival">
                <p>✅ Marcaste que estás listo</p>
                <p>Esperando a que tu rival también esté preparado...</p>
                <div className="loading-animation">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring delay-1"></div>
                  <div className="pulse-ring delay-2"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {!soyFinalista && (
          <div className="espectador-container">
            <h3>👀 Eres Espectador</h3>
            <p>Los finalistas se están preparando para el duelo final...</p>
          </div>
        )}

        {jugadoresListos.length === 2 && (
          <div className="iniciando-final">
            <h2>🚀 ¡Iniciando la Final!</h2>
            <div className="countdown-final">3... 2... 1...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EsperaFinal;