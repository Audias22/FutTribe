// frontend/src/SalaEspera.js
import React, { useState, useEffect } from 'react';
import socket from './socket';

function SalaEspera({ codigoSala, nombreJugador, onIniciarJuego, onVolver }) {
  const [jugadores, setJugadores] = useState([]);
  const [listos, setListos] = useState(0);
  const [total, setTotal] = useState(0);
  const [estoyListo, setEstoyListo] = useState(false);
  const maxJugadores = 10;

  useEffect(() => {
    // Actualizar lista de jugadores cuando alguien se une
    socket.on('jugador_unido', (data) => {
      console.log('👤 Jugador unido:', data);
      setJugadores(data.jugadores);
      setTotal(data.total);
    });

    // Actualizar estado de listos
    socket.on('estado_listos', (data) => {
      console.log('✅ Estado listos:', data);
      setListos(data.listos);
      setTotal(data.total);
      setJugadores(data.jugadores);
    });

    // Cuando se inicia la ronda 1
    socket.on('iniciar_ronda1', (data) => {
      console.log('🎯 Iniciando Ronda 1:', data);
      onIniciarJuego(data);
    });

    // Cuando alguien sale
    socket.on('jugador_salio', (data) => {
      console.log('🚪 Jugador salió');
      setJugadores(data.jugadores);
      setTotal(data.total);
    });

    return () => {
      socket.off('jugador_unido');
      socket.off('estado_listos');
      socket.off('iniciar_ronda1');
      socket.off('jugador_salio');
    };
  }, [onIniciarJuego]);

  const handleMarcarListo = () => {
    if (!estoyListo) {
      socket.emit('marcar_listo', { codigo: codigoSala });
      setEstoyListo(true);
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoSala);
    alert('✅ Código copiado al portapapeles');
  };

  return (
    <div className="sala-espera-container">
      <button className="btn-volver" onClick={onVolver}>
        ← Salir de la Sala
      </button>

      <h2>⏳ Sala de Espera</h2>

      <div className="codigo-sala-display">
        <label>Código de la sala:</label>
        <div className="codigo-box">
          <span className="codigo">{codigoSala}</span>
          <button className="btn-copiar" onClick={copiarCodigo}>
            📋 Copiar
          </button>
        </div>
      </div>

      <div className="contador-listos">
        <div className="circulo-progreso">
          <span className="numeros">{listos}/{total}</span>
          <span className="texto">Listos</span>
        </div>
      </div>

      <div className="lista-jugadores">
        <h3>👥 Jugadores ({total}/{maxJugadores})</h3>
        <ul>
          {jugadores.map((jugador, index) => (
            <li key={index} className={jugador.esta_listo ? 'listo' : 'esperando'}>
              <span className="nombre">{jugador.nombre}</span>
              <span className="estado">
                {jugador.esta_listo ? '✅ Listo' : '⏳ Esperando...'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {!estoyListo && (
        <button className="btn-listo" onClick={handleMarcarListo}>
          ✅ Estoy Listo
        </button>
      )}

      {estoyListo && (
        <div className="mensaje-esperando">
          <p>✅ Marcado como listo</p>
          <p>⏳ Esperando a los demás jugadores...</p>
        </div>
      )}

      {total >= 2 && listos === total && (
        <div className="iniciando-juego">
          <h3>🎮 ¡Iniciando el juego!</h3>
          <div className="spinner"></div>
        </div>
      )}

      {total < 2 && (
        <div className="aviso-minimo">
          <p>⚠️ Se necesitan al menos 2 jugadores para comenzar</p>
        </div>
      )}
    </div>
  );
}

export default SalaEspera;
