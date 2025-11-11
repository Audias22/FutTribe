// UserProfile.js - Componente del perfil de usuario
import React from 'react';
import { useAuth } from './AuthContext';
import './UserProfile.css';

const UserProfile = ({ onClose }) => {
    const { user, logout } = useAuth();

    if (!user || !onClose) return null;

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

    const getRoleBadge = (rol) => {
        return rol === 'admin' ? '👑 Administrador' : '⚽ Jugador';
    };

    const handleLogout = async () => {
        await logout();
        if (onClose) onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    return (
        <div className="user-profile-overlay" onClick={handleOverlayClick}>
            <div className="user-profile-modal">
                <div className="profile-header">
                    <button 
                        className="profile-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                    
                    <div className="profile-avatar">
                        {getAvatarEmoji(user.avatar_id)}
                    </div>
                    
                    <h2>{user.nombre}</h2>
                    <div className="profile-role">
                        {getRoleBadge(user.rol)}
                    </div>
                </div>

                <div className="profile-info">
                    <div className="info-section">
                        <h3>📊 Estadísticas</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{user.puntos_totales}</div>
                                <div className="stat-label">🎯 Puntos Totales</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{user.victorias_multijugador}</div>
                                <div className="stat-label">🏆 Victorias Multijugador</div>
                            </div>
                        </div>
                    </div>

                    <div className="info-section">
                        <h3>🌍 Información Personal</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📧 Email:</span>
                                <span className="info-value">{user.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">🌍 Nacionalidad:</span>
                                <span className="info-value">{user.nacionalidad}</span>
                            </div>
                        </div>
                    </div>

                    {user.once_ideal && user.once_ideal.formacion && (
                        <div className="info-section">
                            <h3>⚽ Mi Once Ideal</h3>
                            <div className="once-ideal-preview">
                                <div className="formacion-badge">
                                    {user.once_ideal.formacion}
                                </div>
                                <div className="once-status">
                                    {user.once_ideal.fecha_actualizacion ? 
                                        `Actualizado: ${new Date(user.once_ideal.fecha_actualizacion).toLocaleDateString()}` :
                                        'Sin configurar'
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-actions">
                    <button 
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;