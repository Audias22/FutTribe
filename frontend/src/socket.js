// frontend/src/socket.js
import { io } from 'socket.io-client';

// URL del backend
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Crear conexión Socket.IO
export const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: false // No conectar automáticamente, solo cuando sea necesario
});

// Event listeners para debug
socket.on('connect', () => {
  console.log('🟢 Conectado al servidor Socket.IO:', socket.id);
});

socket.on('disconnect', () => {
  console.log('🔴 Desconectado del servidor Socket.IO');
});

socket.on('error', (error) => {
  console.error('❌ Error de Socket.IO:', error);
});

export default socket;
