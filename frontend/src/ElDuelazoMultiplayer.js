// frontend/src/ElDuelazoMultiplayer.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import CrearSala from './CrearSala';
import UnirseSala from './UnirseSala';
import SalaEspera from './SalaEspera';
import JuegoMultiplayer from './JuegoMultiplayer';
import ResultadosMultiplayer from './ResultadosMultiplayer';
import EsperaFinal from './EsperaFinal';
import './ElDuelazoMultiplayer.css';
import './EsperaFinal.css';

function ElDuelazoMultiplayer({ onVolver, codigoSalaDirecto }) {
  const { isAuthenticated, actualizarEstadisticas } = useAuth();
  const [pantalla, setPantalla] = useState('inicio'); // inicio, crear, unirse, espera, jugando_ronda1, resultados_ronda1, espera_final, jugando_final, resultados_finales
  const [nombreJugador, setNombreJugador] = useState('');
  const [codigoSala, setCodigoSala] = useState('');
  const [datosJuego, setDatosJuego] = useState(null);
  const [esHost, setEsHost] = useState(false);

  // Manejar enlace directo a sala
  useEffect(() => {
    if (codigoSalaDirecto) {
      setCodigoSala(codigoSalaDirecto);
      setPantalla('unirse');
    }
  }, [codigoSalaDirecto]);

  // Manejar navegación del navegador (botón atrás)
  useEffect(() => {
    // Agregar una entrada al historial cuando entramos
    window.history.pushState({ page: 'duelazo-multiplayer' }, '', '');

    const handlePopState = (event) => {
      // Si estamos en la pantalla de inicio, volver al menú principal
      if (pantalla === 'inicio') {
        onVolver();
      } else {
        // Si estamos en otra pantalla, volver a inicio de multiplayer
        handleVolverInicio();
        // Agregar nueva entrada para mantener el historial
        window.history.pushState({ page: 'duelazo-multiplayer' }, '', '');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pantalla, onVolver]);

  const handleVolverInicio = () => {
    setPantalla('inicio');
    setCodigoSala('');
    setDatosJuego(null);
    setEsHost(false);
  };

  return (
    <div className="duelazo-multiplayer">
      {pantalla === 'inicio' && (
        <div className="seleccion-modo">
          <button className="btn-volver-menu" onClick={onVolver}>
            ← Volver al Menú
          </button>
          
          <h1 className="titulo-multiplayer">🏆 El Duelazo Multijugador</h1>
          <p className="subtitulo-multiplayer">
            Compite contra otros jugadores en tiempo real
          </p>

          <div className="nombre-jugador-input">
            <label>Tu nombre:</label>
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              value={nombreJugador}
              onChange={(e) => setNombreJugador(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="botones-modo">
            <button
              className="btn-crear-sala"
              onClick={() => setPantalla('crear')}
              disabled={!nombreJugador.trim()}
            >
              <span className="icono">➕</span>
              Crear Sala
            </button>

            <button
              className="btn-unirse-sala"
              onClick={() => setPantalla('unirse')}
              disabled={!nombreJugador.trim()}
            >
              <span className="icono">🔗</span>
              Unirse a Sala
            </button>
          </div>

          <div className="info-torneos">
            <h3>📋 Formato del Torneo</h3>
            <div className="fases">
              <div className="fase">
                <strong>Ronda 1:</strong> 10 preguntas - Clasifican los 2 mejores
              </div>
              <div className="fase">
                <strong>Final:</strong> 10 preguntas más difíciles - Decide el ganador
              </div>
            </div>
          </div>
        </div>
      )}

      {pantalla === 'crear' && (
        <CrearSala
          nombreJugador={nombreJugador}
          onSalaCreada={(codigo) => {
            setCodigoSala(codigo);
            setEsHost(true);
            setPantalla('espera');
          }}
          onVolver={handleVolverInicio}
        />
      )}

      {pantalla === 'unirse' && (
        <UnirseSala
          nombreJugador={nombreJugador}
          codigoPredefinido={codigoSalaDirecto}
          onUnido={(codigo) => {
            setCodigoSala(codigo);
            setEsHost(false);
            setPantalla('espera');
          }}
          onVolver={handleVolverInicio}
        />
      )}

      {pantalla === 'espera' && (
        <SalaEspera
          codigoSala={codigoSala}
          nombreJugador={nombreJugador}
          esHost={esHost}
          onIniciarJuego={(datos) => {
            setDatosJuego(datos);
            setPantalla('jugando_ronda1');
          }}
          onVolver={handleVolverInicio}
        />
      )}

      {(pantalla === 'jugando_ronda1' || pantalla === 'jugando_final') && (
        <JuegoMultiplayer
          codigoSala={codigoSala}
          nombreJugador={nombreJugador}
          preguntas={datosJuego?.preguntas || []}
          ronda={pantalla === 'jugando_ronda1' ? 'ronda1' : 'final'}
          onFinalizarRonda={(resultados) => {
            setDatosJuego(resultados);
            setPantalla(pantalla === 'jugando_ronda1' ? 'resultados_ronda1' : 'resultados_finales');
          }}
        />
      )}

      {(pantalla === 'resultados_ronda1' || pantalla === 'resultados_finales') && (
        <ResultadosMultiplayer
          codigoSala={codigoSala}
          datos={datosJuego}
          esFinal={pantalla === 'resultados_finales'}
          isAuthenticated={isAuthenticated}
          actualizarEstadisticas={actualizarEstadisticas}
          onContinuar={(datos) => {
            if (pantalla === 'resultados_finales') {
              handleVolverInicio();
            }
          }}
          onIrEsperaFinal={() => {
            setPantalla('espera_final');
          }}
        />
      )}

      {pantalla === 'espera_final' && (
        <EsperaFinal
          codigoSala={codigoSala}
          finalistas={datosJuego?.finalistas}
          onIniciarFinal={(datosFinales) => {
            setDatosJuego(datosFinales);
            setPantalla('jugando_final');
          }}
        />
      )}
    </div>
  );
}

export default ElDuelazoMultiplayer;
