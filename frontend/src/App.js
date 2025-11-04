// frontend/src/App.js

import React, { useState } from 'react';
import './App.css';
import MenuPrincipal from './MenuPrincipal';
import MiOnceIdeal from './MiOnceIdeal';
import ElDuelazo from './ElDuelazo';

function App() {
  const [modoActual, setModoActual] = useState('menu'); // menu, once-ideal, duelazo

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
    </div>
  );
}

export default App;