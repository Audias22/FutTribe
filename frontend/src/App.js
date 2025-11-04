// frontend/src/App.js

import React, { useState } from 'react';
import './App.css';
import MenuPrincipal from './MenuPrincipal';
import MiOnceIdeal from './MiOnceIdeal';
import ElDuelazo from './ElDuelazo';
import ElDuelazoMultiplayer from './ElDuelazoMultiplayer';

function App() {
  const [modoActual, setModoActual] = useState('menu'); // menu, once-ideal, duelazo, duelazo-multiplayer

  const handleSelectMode = (modo) => {
    setModoActual(modo);
  };

  const handleVolver = () => {
    setModoActual('menu');
  };

  return (
    <div className="App">
      {modoActual === 'menu' && <MenuPrincipal onSelectMode={handleSelectMode} />}
      {modoActual === 'once-ideal' && <MiOnceIdeal onVolver={handleVolver} />}
      {modoActual === 'duelazo' && <ElDuelazo onVolver={handleVolver} />}
      {modoActual === 'duelazo-multiplayer' && <ElDuelazoMultiplayer onVolver={handleVolver} />}
    </div>
  );
}

export default App;