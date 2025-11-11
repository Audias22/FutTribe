// frontend/src/SalaEspera.js
import React, { useState, useEffect } from 'react';
import socket from './socket';

function SalaEspera({ codigoSala, nombreJugador, onIniciarJuego, onVolver, esHost = false }) {
  const [jugadores, setJugadores] = useState([]);
  const [listos, setListos] = useState(0);
  const [total, setTotal] = useState(0);
  const [estoyListo, setEstoyListo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const maxJugadores = 10;

  useEffect(() => {
    // Al montar el componente, reconectarse a la sala
    console.log('🔄 SalaEspera montada, reconectando a:', codigoSala, 'con nombre:', nombreJugador);
    console.log('📊 Estado inicial - Jugadores:', jugadores.length, 'Total:', total);
    
    if (codigoSala && nombreJugador) {
      console.log('📤 Emitiendo unirse_sala...');
      socket.emit('unirse_sala', {
        codigo: codigoSala,
        nombre: nombreJugador
      });
    } else {
      console.error('❌ Faltan datos - código:', codigoSala, 'nombre:', nombreJugador);
    }

    // Escuchar cuando se crea la sala (para el creador)
    socket.on('sala_creada', (data) => {
      if (data.sala) {
        console.log('🎮 Sala creada con jugadores:', data.sala);
        setJugadores(data.sala.jugadores);
        setTotal(data.sala.jugadores.length);
      }
    });

    // Actualizar lista de jugadores cuando alguien se une
    socket.on('jugador_unido', (data) => {
      console.log('👤 Jugador unido:', data);
      setJugadores(data.jugadores);
      setTotal(data.total);
    });

    // Cuando nos unimos exitosamente a una sala
    socket.on('unido_a_sala', (data) => {
      console.log('✅ Reunido a sala:', data);
      if (data.sala) {
        setJugadores(data.sala.jugadores);
        setTotal(data.sala.jugadores.length);
      }
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

    // Cuando la sala se cierra
    socket.on('sala_cerrada', () => {
      console.log('🚪 Sala cerrada por el host');
      onVolver();
    });

    // Cuando se obtiene el estado actual de la sala
    socket.on('estado_sala_actual', (data) => {
      console.log('📊 Estado actual de sala recibido:', data);
      setJugadores(data.jugadores);
      setTotal(data.total);
      // Resetear estado listo al volver
      setEstoyListo(false);
    });

    return () => {
      socket.off('sala_creada');
      socket.off('jugador_unido');
      socket.off('unido_a_sala');
      socket.off('estado_listos');
      socket.off('iniciar_ronda1');
      socket.off('jugador_salio');
      socket.off('sala_cerrada');
      socket.off('estado_sala_actual');
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

  const copiarLink = async () => {
    const link = `${window.location.origin}/?sala=${codigoSala}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch (err) {
      alert('❌ Error al copiar link');
    }
  };

  const cerrarSala = () => {
    if (esHost && window.confirm('¿Estás seguro de que quieres cerrar la sala para todos?')) {
      socket.emit('cerrar_sala', { codigo: codigoSala });
      onVolver();
    }
  };

  const abandonarSala = () => {
    if (window.confirm('¿Estás seguro de que quieres salir de la sala?')) {
      socket.emit('salir_sala', { codigo: codigoSala });
      onVolver();
    }
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
            📋 Copiar Código
          </button>
        </div>
        
        <div className="link-compartir">
          <label>🔗 Compartir link directo:</label>
          <div className="link-box">
            <button 
              className={`btn-copiar-link ${linkCopiado ? 'copiado' : ''}`}
              onClick={copiarLink}
            >
              {linkCopiado ? '✅ ¡Copiado!' : '📱 Copiar Link'}
            </button>
          </div>
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

      <div className="controles-sala">
        {esHost ? (
          <button className="btn-cerrar-sala" onClick={cerrarSala}>
            🚪 Cerrar Sala
          </button>
        ) : (
          <button className="btn-abandonar-sala" onClick={abandonarSala}>
            🚪 Abandonar Sala
          </button>
        )}
      </div>
    </div>
  );
}

export default SalaEspera;
