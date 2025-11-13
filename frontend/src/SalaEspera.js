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
    // Limpiar listeners existentes PRIMERO
    socket.off('sala_creada');
    socket.off('jugador_unido');
    socket.off('unido_a_sala');
    socket.off('estado_listos');
    socket.off('iniciar_ronda1');
    socket.off('jugador_salio');
    socket.off('sala_cerrada');
    socket.off('estado_sala_actual');

    // Al montar el componente, reconectarse a la sala
    console.log('🔄 SalaEspera montada, reconectando a:', codigoSala, 'con nombre:', nombreJugador);
    console.log('📊 Estado inicial - Jugadores:', jugadores.length, 'Total:', total);
    
    // Intentar recuperar código de localStorage si no está disponible
    let codigoParaUsar = codigoSala;
    let nombreParaUsar = nombreJugador;
    
    if (!codigoParaUsar.trim()) {
      codigoParaUsar = localStorage.getItem('futtribe_codigo_sala') || '';
      console.log('📁 Recuperando código de localStorage:', codigoParaUsar);
    }
    
    if (!nombreParaUsar.trim()) {
      nombreParaUsar = localStorage.getItem('futtribe_nombre_jugador') || '';
      console.log('📁 Recuperando nombre de localStorage:', nombreParaUsar);
    }
    
    if (codigoParaUsar && nombreParaUsar) {
      console.log('📤 Emitiendo unirse_sala con:', codigoParaUsar, nombreParaUsar);
      socket.emit('unirse_sala', {
        codigo: codigoParaUsar,
        nombre: nombreParaUsar
      });
    } else {
      console.error('❌ Faltan datos - código:', codigoParaUsar, 'nombre:', nombreParaUsar);
      console.error('❌ localStorage - código:', localStorage.getItem('futtribe_codigo_sala'));
      console.error('❌ localStorage - nombre:', localStorage.getItem('futtribe_nombre_jugador'));
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

  const handleDetenerListo = () => {
    if (estoyListo) {
      socket.emit('desmarcar_listo', { codigo: codigoSala });
      setEstoyListo(false);
    }
  };

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigoSala);
      alert('✅ Código copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = codigoSala;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Código copiado al portapapeles');
    }
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

  // Si no hay código, mostrar loading
  if (!codigoSala.trim()) {
    const codigoGuardado = localStorage.getItem('futtribe_codigo_sala');
    if (!codigoGuardado) {
      return (
        <div className="sala-espera-container">
          <button className="btn-volver" onClick={onVolver}>
            ← Salir de la Sala
          </button>
          <div style={{textAlign: 'center', padding: '50px', color: '#fff'}}>
            <h2>❌ Sin código de sala</h2>
            <p>No se encontró información de la sala.</p>
            <button onClick={onVolver} style={{padding: '10px 20px', fontSize: '16px'}}>
              Volver al Menú
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="sala-espera-container">
      <button className="btn-volver" onClick={onVolver}>
        ← Salir de la Sala
      </button>

      <h2>⏳ Sala de Espera</h2>
      
      {total === 0 && (
        <div style={{textAlign: 'center', padding: '20px', color: '#ffd700'}}>
          <p>🔄 Reconectando a la sala...</p>
        </div>
      )}

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
          <button className="btn-detener" onClick={handleDetenerListo}>
            ❌ DETENER
          </button>
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
