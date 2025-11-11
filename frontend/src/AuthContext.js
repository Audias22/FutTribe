// AuthContext.js - Context para manejo de autenticación global
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Base URL del backend - Usar siempre producción para pruebas
    const API_BASE_URL = 'https://futtribe-production.up.railway.app';

    // Verificar sesión al cargar la app
    useEffect(() => {
        verificarSesion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verificarSesion = async () => {
        const storedToken = localStorage.getItem('futtribe_token');
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/verificar_sesion`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setToken(storedToken);
            } else {
                // Token inválido, limpiar
                localStorage.removeItem('futtribe_token');
                setUser(null);
                setToken(null);
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            localStorage.removeItem('futtribe_token');
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('futtribe_token', data.token);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { 
                success: false, 
                message: 'Error de conexión. Verifica tu internet.' 
            };
        } finally {
            setLoading(false);
        }
    };

    const registro = async (userData) => {
        setLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('futtribe_token', data.token);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { 
                success: false, 
                message: 'Error de conexión. Verifica tu internet.' 
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar estado local
            setUser(null);
            setToken(null);
            localStorage.removeItem('futtribe_token');
        }
    };

    const actualizarEstadisticas = async (puntos_ganados, victoria_multijugador = false) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/actualizar_estadisticas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    puntos_ganados,
                    victoria_multijugador
                })
            });

            if (response.ok) {
                // Actualizar datos del usuario localmente
                setUser(prevUser => ({
                    ...prevUser,
                    puntos_totales: prevUser.puntos_totales + puntos_ganados,
                    victorias_multijugador: victoria_multijugador ? 
                        prevUser.victorias_multijugador + 1 : 
                        prevUser.victorias_multijugador
                }));
            }
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        registro,
        logout,
        verificarSesion,
        actualizarEstadisticas,
        API_BASE_URL
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};