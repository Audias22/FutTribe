import React from 'react';
import './MenuPrincipal.css';

function MenuPrincipal({ onSelectMode }) {
  return (
    <div className="menu-principal">
      <div className="menu-container">
        <h1 className="titulo-principal">⚽ FutTribe ⚽</h1>
        <p className="subtitulo">Elige tu modo de juego</p>
        
        <div className="modos-juego">
          <div className="modo-card" onClick={() => onSelectMode('once-ideal')}>
            <div className="modo-icon">🏆</div>
            <h2>Mi Once Ideal</h2>
            <p>Crea tu equipo con jugadores históricos</p>
            <button className="btn-jugar">Jugar Ahora</button>
          </div>

          <div className="modo-card" onClick={() => onSelectMode('duelazo')}>
            <div className="modo-icon">⚡</div>
            <h2>El Duelazo de la Jornada</h2>
            <p>Compite respondiendo preguntas de fútbol</p>
            <button className="btn-jugar">Jugar Ahora</button>
          </div>
        </div>

        <div className="info-footer">
          <p>🎮 Selecciona un modo para comenzar</p>
        </div>
      </div>
    </div>
  );
}

export default MenuPrincipal;
