// frontend/src/UnirseSala.js
import React, { useState, useEffect } from 'react';
import socket from './socket';

function UnirseSala({ nombreJugador, onUnido, onVolver, codigoPredefinido }) {
  const [codigo, setCodigo] = useState(codigoPredefinido || '');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Conectar socket al montar
    if (!socket.connected) {
      socket.connect();
    }

    // Escuchar respuesta de unión
    socket.on('unido_a_sala', (data) => {
      if (data.success) {
        console.log('✅ Unido a sala:', data.codigo);
        setCargando(false);
        onUnido(data.codigo);
      }
    });

    socket.on('error', (data) => {
      setError(data.message);
      setCargando(false);
    });

    return () => {
      socket.off('unido_a_sala');
      socket.off('error');
    };
  }, [onUnido]);

  const handleUnirse = () => {
    if (!codigo.trim()) {
      setError('Debes ingresar un código de sala');
      return;
    }

    if (codigo.length !== 6) {
      setError('El código debe tener 6 caracteres');
      return;
    }

    setCargando(true);
    setError('');

    socket.emit('unirse_sala', {
      codigo: codigo.toUpperCase(),
      nombre: nombreJugador
    });
  };

  const handleCodigoChange = (e) => {
    const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCodigo(valor.substring(0, 6));
  };

  return (
    <div className="unirse-sala-container">
      <button className="btn-volver" onClick={onVolver}>
        ← Volver
      </button>

      <h2>🔗 Unirse a Sala</h2>

      <div className="form-unirse-sala">
        <div className="campo">
          <label>Tu nombre:</label>
          <input type="text" value={nombreJugador} disabled />
        </div>

        <div className="campo">
          <label>Código de la sala:</label>
          <input
            type="text"
            placeholder="Ej: ABC123"
            value={codigo}
            onChange={handleCodigoChange}
            maxLength={6}
            disabled={cargando}
            className="input-codigo"
          />
          <small>{codigo.length}/6 caracteres</small>
        </div>

        {error && <div className="error-mensaje">❌ {error}</div>}

        <button 
          className="btn-confirmar-unirse"
          onClick={handleUnirse}
          disabled={cargando || codigo.length !== 6}
        >
          {cargando ? '⏳ Uniéndose...' : '✅ Unirse a Sala'}
        </button>
      </div>

      <div className="info-unirse">
        <p>💡 Pide el código de 6 caracteres al creador de la sala.</p>
        <p>🔤 Solo letras mayúsculas y números (A-Z, 0-9).</p>
      </div>
    </div>
  );
}

export default UnirseSala;
