import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import './MenuPrincipal.css';

function MenuPrincipal({ onSelectMode }) {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleAuthClick = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const getAvatarEmoji = (avatarId) => {
    const avatars = {
      1: '⚽',
      2: '🏆', 
      3: '🎯',
      4: '🔥',
      5: '⭐'
    };
    return avatars[avatarId] || '⚽';
  };

  return (
    <div className="menu-principal">
      <div className="menu-container">
        {/* Header con autenticación */}
        <div className="menu-header">
          <div className="header-left">
            <h1 className="titulo-principal">⚽ FutTribe ⚽</h1>
            <p className="subtitulo">Elige tu modo de juego</p>
          </div>
          
          <div className="header-right">
            {isAuthenticated ? (
              <div className="user-section" onClick={() => setShowUserProfile(true)}>
                <div className="user-avatar">
                  {getAvatarEmoji(user.avatar_id)}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.nombre}</div>
                  <div className="user-points">🎯 {user.puntos_totales} pts</div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="btn-login"
                  onClick={() => handleAuthClick('login')}
                >
                  🚀 Iniciar Sesión
                </button>
                <button 
                  className="btn-register"
                  onClick={() => handleAuthClick('registro')}
                >
                  ⚽ Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="modos-juego">
          <div className="modo-card" onClick={() => onSelectMode('once-ideal')}>
            <div className="modo-icon">🏆</div>
            <h2>Mi Once Ideal</h2>
            <p>Crea tu equipo con jugadores históricos</p>
            <button className="btn-jugar">Jugar Ahora</button>
          </div>

          <div className="modo-card" onClick={() => onSelectMode('duelazo')}>
            <div className="modo-icon">⚡</div>
            <h2>El Duelazo</h2>
            <p>Modo individual - Responde preguntas de fútbol</p>
            <button className="btn-jugar">Jugar Ahora</button>
          </div>

          <div className="modo-card multiplayer" onClick={() => onSelectMode('duelazo-multiplayer')}>
            <div className="modo-icon">🎮</div>
            <h2>El Duelazo Multijugador</h2>
            <p>Compite en tiempo real contra otros jugadores</p>
            <span className="badge-nuevo">¡NUEVO!</span>
            <button className="btn-jugar">Jugar Ahora</button>
          </div>
        </div>

        <div className="info-footer">
          <p>🎮 Selecciona un modo para comenzar</p>
          {isAuthenticated && (
            <p className="welcome-message">
              ¡Bienvenido de vuelta, {user.nombre}! 🎉
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      {showUserProfile && (
        <UserProfile
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </div>
  );
}

export default MenuPrincipal;
