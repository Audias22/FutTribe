import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

function LoadingScreen({ onLoadingComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('Cargando...');

  const loadingTexts = [
    'Cargando FutTribe...',
    'Preparando el estadio...',
    'Calentando jugadores...',
    '¡Casi listos!'
  ];

  useEffect(() => {
    const duration = 3000; // 3 segundos
    const interval = 50; // actualizar cada 50ms
    const steps = duration / interval;
    const progressStep = 100 / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(currentStep * progressStep, 100);
      setProgress(newProgress);

      // Cambiar texto según el progreso
      if (newProgress >= 75) {
        setCurrentText(loadingTexts[3]);
      } else if (newProgress >= 50) {
        setCurrentText(loadingTexts[2]);
      } else if (newProgress >= 25) {
        setCurrentText(loadingTexts[1]);
      } else {
        setCurrentText(loadingTexts[0]);
      }

      if (newProgress >= 100) {
        clearInterval(timer);
        // Esperar un momento antes de completar
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Logo animado */}
        <div className="loading-logo">
          <div className="soccer-ball">
            <div className="ball-shadow"></div>
            ⚽
          </div>
        </div>

        {/* Título */}
        <h1 className="loading-title">
          <span className="fut">Fut</span>
          <span className="tribe">Tribe</span>
        </h1>

        {/* Subtítulo */}
        <p className="loading-subtitle">Tu trivia de fútbol favorita</p>

        {/* Texto de carga */}
        <p className="loading-text">{currentText}</p>

        {/* Barra de progreso */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>

        {/* Partículas de fondo */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}>⚽</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;