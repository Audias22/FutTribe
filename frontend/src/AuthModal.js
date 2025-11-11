// AuthModal.js - Modal que combina login y registro
import React, { useState } from 'react';
import Login from './Login';
import Registro from './Registro';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
    const [mode, setMode] = useState(defaultMode); // 'login' o 'registro'

    if (!isOpen) return null;

    const handleSuccess = () => {
        // Cerrar modal después de login/registro exitoso
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={handleOverlayClick}>
            <div className="auth-modal-content">
                <button 
                    className="auth-modal-close"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                {mode === 'login' ? (
                    <Login 
                        onSwitchToRegister={() => setMode('registro')}
                        onLoginSuccess={handleSuccess}
                    />
                ) : (
                    <Registro 
                        onSwitchToLogin={() => setMode('login')}
                        onRegistroSuccess={handleSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthModal;