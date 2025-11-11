// Registro.js - Componente de formulario de registro
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Registro.css';

const Registro = ({ onSwitchToLogin, onRegistroSuccess }) => {
    const { registro, loading } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        nacionalidad: '',
        avatar_id: 1
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    const nacionalidades = [
        'Argentina', 'Brasil', 'Colombia', 'México', 'España', 'Francia',
        'Inglaterra', 'Italia', 'Alemania', 'Portugal', 'Uruguay', 'Chile',
        'Perú', 'Ecuador', 'Venezuela', 'Paraguay', 'Bolivia', 'Holanda',
        'Bélgica', 'Croacia', 'Otro'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar error específico cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Formato de email inválido';
        }

        // Nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        // Nacionalidad
        if (!formData.nacionalidad) {
            newErrors.nacionalidad = 'La nacionalidad es requerida';
        }

        // Contraseña
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        // Confirmar contraseña
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateForm()) {
            return;
        }

        const { confirmPassword, ...userData } = formData;
        const result = await registro(userData);

        if (result.success) {
            setMessage(result.message);
            if (onRegistroSuccess) {
                onRegistroSuccess();
            }
        } else {
            setMessage(result.message);
        }
    };

    return (
        <div className="registro-container">
            <div className="registro-card">
                <div className="registro-header">
                    <h2>⚽ Crear Cuenta</h2>
                    <p>Únete a la comunidad FutTribe</p>
                </div>

                <form onSubmit={handleSubmit} className="registro-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="nombre">👤 Nombre</label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={errors.nombre ? 'error' : ''}
                                placeholder="Tu nombre"
                                disabled={loading}
                            />
                            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="nacionalidad">🌍 Nacionalidad</label>
                            <select
                                id="nacionalidad"
                                name="nacionalidad"
                                value={formData.nacionalidad}
                                onChange={handleChange}
                                className={errors.nacionalidad ? 'error' : ''}
                                disabled={loading}
                            >
                                <option value="">Selecciona tu país</option>
                                {nacionalidades.map(pais => (
                                    <option key={pais} value={pais}>{pais}</option>
                                ))}
                            </select>
                            {errors.nacionalidad && <span className="error-text">{errors.nacionalidad}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">📧 Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="tu@email.com"
                            disabled={loading}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">🔒 Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">🔒 Confirmar</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="avatar-selection">
                        <label>🎭 Avatar</label>
                        <div className="avatar-options">
                            {[1, 2, 3, 4, 5].map(id => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`avatar-option ${formData.avatar_id === id ? 'selected' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, avatar_id: id }))}
                                    disabled={loading}
                                >
                                    {id === 1 && '⚽'}
                                    {id === 2 && '🏆'}
                                    {id === 3 && '🎯'}
                                    {id === 4 && '🔥'}
                                    {id === 5 && '⭐'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {message && (
                        <div className={`message ${message.includes('exitoso') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="registro-button"
                        disabled={loading}
                    >
                        {loading ? '🔄 Creando cuenta...' : '🚀 Crear Cuenta'}
                    </button>
                </form>

                <div className="registro-footer">
                    <p>
                        ¿Ya tienes cuenta?{' '}
                        <button 
                            type="button"
                            className="switch-button"
                            onClick={onSwitchToLogin}
                            disabled={loading}
                        >
                            Inicia sesión aquí
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Registro;