// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Estado para guardar la lista de jugadores
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // La URL de tu API de Flask
    const API_URL = 'http://localhost:5000/api/v1/jugadores-historicos';

    fetch(API_URL)
      .then(response => {
        // Chequea si la respuesta fue exitosa (código 200)
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json(); // Convierte la respuesta a JSON
      })
      .then(data => {
        // Guarda los datos en el estado
        setJugadores(data);
        setLoading(false);
      })
      .catch(err => {
        // Captura cualquier error (de red o de la API)
        console.error("Error al obtener jugadores:", err);
        setError(`Error de conexión con la API: ${err.message}. Asegúrate que Flask (puerto 5000) esté corriendo.`);
        setLoading(false);
      });
  }, []); // El array vacío [] asegura que esto solo se ejecute al montar el componente

  if (loading) {
    return <div className="App">Cargando datos de la API de Flask...</div>;
  }

  if (error) {
    return <div className="App" style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏆 FutTribe - Jugadores Históricos</h1>
        <p>Conexión exitosa con el Backend (Flask/MySQL).</p>
        <p>Se cargaron **{jugadores.length}** jugadores históricos.</p>
        
        <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px', textAlign: 'left' }}>
            <h3>Primer Jugador Cargado:</h3>
            <p><strong>ID:</strong> {jugadores[0].id}</p>
            <p><strong>Nombre:</strong> {jugadores[0].name}</p>
            <p><strong>Posición:</strong> {jugadores[0].position}</p>
            <p><strong>URL Imagen:</strong> <a href={jugadores[0].image_path} target="_blank" rel="noopener noreferrer">Ver Imagen</a></p>
        </div>
        
        {/* Aquí es donde se podría mapear y mostrar toda la lista */}
        {/* <div style={{marginTop: '20px'}}>{JSON.stringify(jugadores, null, 2)}</div> */}
      </header>
    </div>
  );
}

export default App;