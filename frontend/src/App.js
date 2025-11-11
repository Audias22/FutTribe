// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider } from './AuthContext';
import LoadingScreen from './LoadingScreen';
import MenuPrincipal from './MenuPrincipal';
import MiOnceIdeal from './MiOnceIdeal';
import ElDuelazo from './ElDuelazo';
import ElDuelazoMultiplayer from './ElDuelazoMultiplayer';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [modoActual, setModoActual] = useState('menu'); // menu, once-ideal, duelazo, duelazo-multiplayer
  const [codigoSalaDirecto, setCodigoSalaDirecto] = useState(null);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    
    // Verificar si hay un código de sala en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const sala = urlParams.get('sala');
    if (sala) {
      setCodigoSalaDirecto(sala);
      setModoActual('duelazo-multiplayer');
      // Limpiar la URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleSelectMode = (modo) => {
    setModoActual(modo);
  };

  const handleVolver = () => {
    setModoActual('menu');
  };

  // Mostrar pantalla de carga primero
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <AuthProvider>
      <div className="App">
        {modoActual === 'menu' && <MenuPrincipal onSelectMode={handleSelectMode} />}
        {modoActual === 'once-ideal' && <MiOnceIdeal onVolver={handleVolver} />}
        {modoActual === 'duelazo' && <ElDuelazo onVolver={handleVolver} />}
        {modoActual === 'duelazo-multiplayer' && (
          <ElDuelazoMultiplayer 
            onVolver={handleVolver}
            codigoSalaDirecto={codigoSalaDirecto}
          />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;