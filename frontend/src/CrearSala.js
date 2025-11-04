// frontend/src/CrearSala.js
import React, { useState, useEffect } from 'react';
import socket from './socket';

function CrearSala({ nombreJugador, onSalaCreada, onVolver }) {
  const [maxJugadores, setMaxJugadores] = useState(10);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Conectar socket al montar
    if (!socket.connected) {
      socket.connect();
    }

    // Escuchar respuesta de creación de sala
    socket.on('sala_creada', (data) => {
      if (data.success) {
        console.log('✅ Sala creada:', data.codigo);
        setCargando(false);
        onSalaCreada(data.codigo);
      }
    });

    socket.on('error', (data) => {
      setError(data.message);
      setCargando(false);
    });

    return () => {
      socket.off('sala_creada');
      socket.off('error');
    };
  }, [onSalaCreada]);

  const handleCrearSala = () => {
    if (!nombreJugador.trim()) {
      setError('Debes ingresar tu nombre');
      return;
    }

    setCargando(true);
    setError('');

    socket.emit('crear_sala', {
      nombre: nombreJugador,
      max_jugadores: maxJugadores
    });
  };

  return (
    <div className="crear-sala-container">
      <button className="btn-volver" onClick={onVolver}>
        ← Volver
      </button>

      <h2>➕ Crear Nueva Sala</h2>

      <div className="form-crear-sala">
        <div className="campo">
          <label>Nombre del creador:</label>
          <input type="text" value={nombreJugador} disabled />
        </div>

        <div className="campo">
          <label>Máximo de jugadores:</label>
          <select 
            value={maxJugadores} 
            onChange={(e) => setMaxJugadores(parseInt(e.target.value))}
            disabled={cargando}
          >
            <option value={2}>2 jugadores</option>
            <option value={4}>4 jugadores</option>
            <option value={6}>6 jugadores</option>
            <option value={8}>8 jugadores</option>
            <option value={10}>10 jugadores</option>
          </select>
        </div>

        {error && <div className="error-mensaje">❌ {error}</div>}

        <button 
          className="btn-confirmar-crear"
          onClick={handleCrearSala}
          disabled={cargando}
        >
          {cargando ? '⏳ Creando sala...' : '🎮 Crear Sala'}
        </button>
      </div>

      <div className="info-crear">
        <p>💡 Una vez creada, recibirás un código de 6 caracteres para compartir con otros jugadores.</p>
      </div>
    </div>
  );
}

export default CrearSala;
