import React, { useEffect, useState, useMemo, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://futtribe-production.up.railway.app";
const API_URL = `${API_BASE}/api/v1/jugadores-historicos`;

// Media query hook para detectar móvil
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
}

function MiOnceIdeal({ onVolver }) {
  const isMobile = useIsMobile();

// Diseños de cancha disponibles
const FIELD_DESIGNS = [
  { 
    id: 'classic', 
    name: 'Clásico',
    gradient: 'linear-gradient(180deg, #4a9d4f 0%, #3d8b41 50%, #4a9d4f 100%)',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.03) 50px, rgba(0,0,0,0.03) 100px)'
  },
  { 
    id: 'dark', 
    name: 'Oscuro',
    gradient: 'linear-gradient(180deg, #2d5016 0%, #1e3a0e 50%, #2d5016 100%)',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 100px)'
  },
  { 
    id: 'blue', 
    name: 'Azul',
    gradient: 'linear-gradient(180deg, #1e3a5f 0%, #14283d 50%, #1e3a5f 100%)',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.08) 50px, rgba(0,0,0,0.08) 100px)'
  },
  { 
    id: 'modern', 
    name: 'Moderno',
    gradient: 'linear-gradient(180deg, #3a7d44 0%, #2d6236 50%, #3a7d44 100%)',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.02) 30px, rgba(255,255,255,0.02) 60px)'
  }
];

// ----------------------------------------------------------------------------------
// FUNCIÓN CLAVE CORREGIDA: Determina la posición detallada por coordenadas X, Y
// Usa solo las 12 posiciones especificadas: LI, DC, MC, MCD, MD, MI, MP, LD, POR, DFC, ED, EI
// ----------------------------------------------------------------------------------
function getDetailedPosition(xPercent, yPercent) {
  // PORTERO (POR / GK) - Y > 80% (Fondo del campo)
  if (yPercent > 80) {
      if (xPercent > 40 && xPercent < 60) return { label: 'POR', type: 'GK' };
      // Si está en el fondo pero fuera del área, lo forzamos a ser defensa lateral
      if (xPercent < 20) return { label: 'LI', type: 'DEF' };
      if (xPercent > 80) return { label: 'LD', type: 'DEF' };
      // Normalizar Y para el cálculo de la zona defensiva más cercana
      yPercent = 70; 
  }
  
  // DEFENSA (LI, LD, DFC) - Y entre 60% y 80%
  if (yPercent > 60) {
    // Laterales (Cerca de la banda)
    if (xPercent < 25) return { label: 'LI', type: 'DEF' }; 
    if (xPercent > 75) return { label: 'LD', type: 'DEF' }; 
    
    // Centrales
    if (xPercent >= 25 && xPercent <= 75) return { label: 'DFC', type: 'DEF' }; 

    // Fallback
    return xPercent < 50 ? { label: 'LI', type: 'DEF' } : { label: 'LD', type: 'DEF' };
  }

  // MEDIOCAMPO (MCD, MC, MP, MI, MD) - Y entre 35% y 60%
  if (yPercent > 35) {
    // Media/Pivote Defensivo (Más atrás en el medio)
    if (yPercent > 50) {
      if (xPercent > 35 && xPercent < 65) return { label: 'MCD', type: 'MID' }; 
    }
    
    // Interiores/Extremos de Medio campo (Banda)
    if (xPercent < 20) return { label: 'MI', type: 'MID' }; // Interior Izquierdo
    if (xPercent > 80) return { label: 'MD', type: 'MID' }; // Interior Derecho

    // Media Punta (Más adelante en el medio)
    if (yPercent < 45) {
      if (xPercent > 35 && xPercent < 65) return { label: 'MP', type: 'MID' };
    }

    // Mediocentro (General)
    return { label: 'MC', type: 'MID' };
  }

  // ATAQUE (EI, ED, DC) - Y < 35% (Frente del campo)
  if (yPercent <= 35) {
    if (xPercent < 25) return { label: 'EI', type: 'FWD' }; // Extremo Izquierdo
    if (xPercent > 75) return { label: 'ED', type: 'FWD' }; // Extremo Derecho
    return { label: 'DC', type: 'FWD' }; // Delantero Centro
  }
  
  // Posición genérica (Fallback de seguridad)
  return { label: 'POS', type: 'CUSTOM' }; 
}
// ----------------------------------------------------------------------------------

  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [alineacion, setAlineacion] = useState(Array(11).fill(null));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [formation, setFormation] = useState("4-4-2");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [fieldDesign, setFieldDesign] = useState('classic');
  const fieldRef = useRef(null);

  const miEquipoIdeal = alineacion.filter(Boolean);

  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setJugadoresDisponibles(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const posicion = (p) => (p || "").toUpperCase();
  
  function tokensPos(pos) {
    return posicion(pos).split(/[^A-Z0-9]+/).map((t) => t.trim()).filter(Boolean);
  }
  
  // --- Categorización de Jugadores ---
  
  function esDefensa(pos) {
    const toks = tokensPos(pos);
    const defs = ["LI", "LD", "DFC", "CB", "DF", "LB", "RB"]; 
    return toks.some((t) => defs.includes(t));
  }
  
  function esCentral(pos) {
    const toks = tokensPos(pos);
    const centrales = ["DFC", "CB"];
    return toks.some((t) => centrales.includes(t));
  }
  
  function esPortero(pos) {
    const toks = tokensPos(pos);
    const porteros = ["POR", "GK"];
    return toks.some((t) => porteros.includes(t));
  }

  function esMediocampista(pos) {
    const toks = tokensPos(pos);
    const mcs = ["MC", "MCD", "MP", "MI", "MD", "M", "CM", "CDM", "CAM"]; 
    return toks.some((t) => mcs.includes(t));
  }

  function esDelantero(pos) {
    const toks = tokensPos(pos);
    const dels = ["DC", "ED", "EI", "DELANTERO", "FWD", "ST", "CF", "RW", "LW"]; 
    return toks.some((t) => dels.includes(t));
  }

  // --- Conteo de Límites ---
  
  function contarDefensas(equipoArr) {
    return equipoArr.filter((j) => esDefensa(j.position)).length;
  }
  
  function contarCentrales(equipoArr) {
    return equipoArr.filter((j) => esCentral(j.position)).length;
  }
  
  function contarPorteros(equipoArr) {
    return equipoArr.filter((j) => esPortero(j.position)).length;
  }

  // --- Formaciones Fijas (Completo) ---
  const base442 = [
    { top: '82%', left: '50%', label: 'POR', type: 'GK' },
    { top: '65%', left: '18%', label: 'LI', type: 'DEF' }, 
    { top: '65%', left: '38%', label: 'DFC', type: 'DEF' }, 
    { top: '65%', left: '62%', label: 'DFC', type: 'DEF' }, 
    { top: '65%', left: '82%', label: 'LD', type: 'DEF' },
    { top: '45%', left: '18%', label: 'MI', type: 'MID' }, 
    { top: '45%', left: '38%', label: 'MC', type: 'MID' }, 
    { top: '45%', left: '62%', label: 'MC', type: 'MID' }, 
    { top: '45%', left: '82%', label: 'MD', type: 'MID' },
    { top: '22%', left: '40%', label: 'DC', type: 'FWD' }, 
    { top: '22%', left: '60%', label: 'DC', type: 'FWD' }
  ];

  const formationPositions = useMemo(() => ({
    "4-4-2": base442,
    "4-3-3": [
      { top: '82%', left: '50%', label: 'POR', type: 'GK' },
      { top: '65%', left: '18%', label: 'LI', type: 'DEF' }, 
      { top: '65%', left: '38%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '62%', label: 'DFC', type: 'DEF' },
      { top: '65%', left: '82%', label: 'LD', type: 'DEF' },
      { top: '50%', left: '32%', label: 'MCD', type: 'MID' }, 
      { top: '45%', left: '50%', label: 'MC', type: 'MID' }, 
      { top: '50%', left: '68%', label: 'MC', type: 'MID' },
      { top: '22%', left: '18%', label: 'EI', type: 'FWD' }, 
      { top: '18%', left: '50%', label: 'DC', type: 'FWD' }, 
      { top: '22%', left: '82%', label: 'ED', type: 'FWD' }
    ],
    "3-5-2": [
      { top: '82%', left: '50%', label: 'POR', type: 'GK' },
      { top: '65%', left: '28%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '50%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '72%', label: 'DFC', type: 'DEF' },
      { top: '45%', left: '12%', label: 'MI', type: 'MID' }, 
      { top: '50%', left: '32%', label: 'MC', type: 'MID' }, 
      { top: '55%', left: '50%', label: 'MCD', type: 'MID' },
      { top: '50%', left: '68%', label: 'MC', type: 'MID' }, 
      { top: '45%', left: '88%', label: 'MD', type: 'MID' },
      { top: '22%', left: '40%', label: 'DC', type: 'FWD' }, 
      { top: '22%', left: '60%', label: 'DC', type: 'FWD' }
    ],
    "5-3-2": [
      { top: '82%', left: '50%', label: 'POR', type: 'GK' },
      { top: '68%', left: '12%', label: 'LI', type: 'DEF' }, 
      { top: '65%', left: '30%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '50%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '70%', label: 'DFC', type: 'DEF' }, 
      { top: '68%', left: '88%', label: 'LD', type: 'DEF' },
      { top: '45%', left: '32%', label: 'MC', type: 'MID' }, 
      { top: '45%', left: '50%', label: 'MCD', type: 'MID' }, 
      { top: '45%', left: '68%', label: 'MC', type: 'MID' },
      { top: '22%', left: '40%', label: 'DC', type: 'FWD' }, 
      { top: '22%', left: '60%', label: 'DC', type: 'FWD' }
    ],
    "3-4-3": [
      { top: '82%', left: '50%', label: 'POR', type: 'GK' },
      { top: '65%', left: '28%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '50%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '72%', label: 'DFC', type: 'DEF' },
      { top: '45%', left: '25%', label: 'MI', type: 'MID' }, 
      { top: '50%', left: '42%', label: 'MCD', type: 'MID' }, 
      { top: '50%', left: '58%', label: 'MC', type: 'MID' }, 
      { top: '45%', left: '75%', label: 'MD', type: 'MID' }, 
      { top: '22%', left: '20%', label: 'EI', type: 'FWD' }, 
      { top: '18%', left: '50%', label: 'DC', type: 'FWD' },
      { top: '22%', left: '80%', label: 'ED', type: 'FWD' }
    ],
    "4-2-3-1": [
      { top: '82%', left: '50%', label: 'POR', type: 'GK' },
      { top: '65%', left: '18%', label: 'LI', type: 'DEF' }, 
      { top: '65%', left: '38%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '62%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '82%', label: 'LD', type: 'DEF' },
      { top: '52%', left: '38%', label: 'MCD', type: 'MID' }, 
      { top: '52%', left: '62%', label: 'MCD', type: 'MID' },
      { top: '35%', left: '22%', label: 'MI', type: 'MID' }, 
      { top: '32%', left: '50%', label: 'MP', type: 'MID' }, 
      { top: '35%', left: '78%', label: 'MD', type: 'MID' }, 
      { top: '16%', left: '50%', label: 'DC', type: 'FWD' }
    ],
    "4-5-1": [
      { top: '82%', left: '50%', label: 'POR', type: 'GK' },
      { top: '65%', left: '18%', label: 'LI', type: 'DEF' }, 
      { top: '65%', left: '38%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '62%', label: 'DFC', type: 'DEF' }, 
      { top: '65%', left: '82%', label: 'LD', type: 'DEF' },
      { top: '45%', left: '14%', label: 'MI', type: 'MID' }, 
      { top: '45%', left: '32%', label: 'MC', type: 'MID' }, 
      { top: '50%', left: '50%', label: 'MCD', type: 'MID' }, 
      { top: '45%', left: '68%', label: 'MC', type: 'MID' }, 
      { top: '45%', left: '86%', label: 'MD', type: 'MID' },
      { top: '18%', left: '50%', label: 'DC', type: 'FWD' }
    ],
    "custom": base442.map(pos => ({ ...pos }))
  }), [base442]); 

  const [customPositions, setCustomPositions] = useState(null);

  useEffect(() => {
    // Inicialización del custom mode
    if (formation === 'custom' && !customPositions) {
      setCustomPositions(formationPositions['custom'].map(pos => {
        const x = parseFloat(pos.left);
        const y = parseFloat(pos.top);
        // Usa la función detallada para la etiqueta inicial
        return { ...pos, ...getDetailedPosition(x, y) }; 
      }));
    } else if (formation !== 'custom' && customPositions) {
      setCustomPositions(null); 
    }
  }, [formation, customPositions, formationPositions]);

  const positions = formation === 'custom' && customPositions 
    ? customPositions 
    : formationPositions[formation] || formationPositions['4-4-2'];
  
  // Filtrar jugadores según el TIPO (GK/DEF/MID/FWD) del slot seleccionado
  const getFilteredPlayers = () => {
    let filtered = jugadoresDisponibles.filter((j) => 
      (j.name || "").toLowerCase().includes(q.trim().toLowerCase())
    );

    if (selectedSlot === null || !positions[selectedSlot]) {
      return filtered;
    }
    
    // El filtro se aplica por el TIPO de zona (GK/DEF/MID/FWD)
    const slotType = positions[selectedSlot].type;
    
    if (slotType === 'GK') {
      filtered = filtered.filter(j => esPortero(j.position));
    } else if (slotType === 'DEF') {
      filtered = filtered.filter(j => esDefensa(j.position));
    } else if (slotType === 'MID') {
      filtered = filtered.filter(j => esMediocampista(j.position));
    } else if (slotType === 'FWD') {
      filtered = filtered.filter(j => esDelantero(j.position));
    }
    
    return filtered;
  };
  
  const filtered = getFilteredPlayers();

  // --- Lógica de Manejo de Slots y Jugadores ---
  
  function addPlayerToSlot(player, slotIdx) {
    if (!player) return false;
    
    // 1. Ya está en el equipo
    if (alineacion.find((j) => j && j.id === player.id)) {
      setMessage({ type: 'error', text: 'Este jugador ya está en el equipo.' });
      return false;
    }
    
    // 2. Equipo lleno
    if (miEquipoIdeal.length >= 11 && !alineacion[slotIdx]) {
      setMessage({ type: 'error', text: 'El equipo ya tiene 11 jugadores.' });
      return false;
    }

    const nueva = [...alineacion];
    const existente = nueva[slotIdx];
    
    // Candidato para la comprobación de límites
    let equipoCandidate = miEquipoIdeal.filter((j) => !existente || j.id !== existente.id);
    equipoCandidate = equipoCandidate.filter((j) => j.id !== player.id);
    equipoCandidate.push(player);

    // 3. Límite de Defensas (5)
    if (esDefensa(player.position) && contarDefensas(equipoCandidate) > 5) {
      setMessage({ type: 'error', text: `Límite: Ya tienes ${contarDefensas(equipoCandidate) - 1} defensas. Máximo 5.` });
      return false;
    }
    
    // 4. Límite de Centrales (4)
    if (esCentral(player.position) && contarCentrales(equipoCandidate) > 4) {
      setMessage({ type: 'error', text: `Límite: Ya tienes ${contarCentrales(equipoCandidate) - 1} centrales. Máximo 4.` });
      return false;
    }

    // 5. Límite de Porteros (1)
    if (esPortero(player.position) && contarPorteros(equipoCandidate) > 1) {
      setMessage({ type: 'error', text: 'Límite: Solo puedes seleccionar un portero.' });
      return false;
    }
    
    // 6. Restricción Portero/Posición
    const slotType = positions[slotIdx].type;
    if (esPortero(player.position) && slotType !== 'GK') {
       setMessage({ type: 'error', text: 'Un portero solo puede ser asignado a una posición de Portero.' });
       return false;
    }
    if (!esPortero(player.position) && slotType === 'GK') {
      setMessage({ type: 'error', text: `Un jugador de ${player.position} no puede ir en la posición de Portero.` });
      return false;
    }


    // Si se reemplaza un jugador existente, devolverlo a la lista de disponibles
    if (existente && existente.id !== player.id) {
      setJugadoresDisponibles((prev) => [...prev.filter(p => p.id !== existente.id), existente].sort((a,b)=>a.id-b.id));
    }

    // Ejecutar la adición
    setJugadoresDisponibles((prev) => prev.filter((p) => p.id !== player.id));
    nueva[slotIdx] = player;
    setAlineacion(nueva);
    setMessage({ type: 'success', text: `${player.name} añadido correctamente.` });
    setShowModal(false);
    return true;
  }

  function removeFromSlot(slotIdx) {
    const nueva = [...alineacion];
    const jugador = nueva[slotIdx];
    if (!jugador) return;
    nueva[slotIdx] = null;
    setAlineacion(nueva);
    setJugadoresDisponibles((prev) => [...prev, jugador].sort((a,b)=>a.id-b.id));
    setMessage({ type: 'info', text: `${jugador.name} devuelto a disponibles.` });
  }

  function swapPlayers(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    
    const nueva = [...alineacion];
    const playerFrom = nueva[fromIdx];
    const playerTo = nueva[toIdx];
    
    if (!playerFrom) return; // No hay jugador para mover
    
    // Intercambiar
    nueva[fromIdx] = playerTo;
    nueva[toIdx] = playerFrom;
    
    setAlineacion(nueva);
    setMessage({ type: 'success', text: playerTo ? `${playerFrom.name} ↔ ${playerTo.name}` : `${playerFrom.name} movido` });
  }

  function openModal(slotIdx) {
    setSelectedSlot(slotIdx);
    setShowModal(true);
    setQ("");
  }

  async function downloadAsImage() {
    if (miEquipoIdeal.length !== 11) {
      setMessage({ type: 'error', text: 'Completa tu once ideal primero.' });
      return;
    }

    try {
      setMessage({ type: 'info', text: 'Generando imagen... ⏳' });
      
      // Cargar todas las imágenes como crossOrigin para evitar CORS
      const images = fieldRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete) {
          img.crossOrigin = 'anonymous';
        }
      });
      
      // Esperar a que todas las imágenes carguen
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Resolver aunque falle para continuar
            setTimeout(resolve, 3000); // timeout de seguridad
          });
        })
      );
      
      const html2canvas = (await import('html2canvas')).default; 
      const canvas = await html2canvas(fieldRef.current, {
        backgroundColor: '#1e3c72',
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        removeContainer: true
      });
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'mi-once-ideal.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: '¡Imagen descargada correctamente! 📸' });
      }, 'image/png', 1.0);
      
    } catch (err) {
      console.error('Error al descargar:', err);
      setMessage({ type: 'error', text: 'Error al descargar. Intenta de nuevo.' });
    }
  }

  // ----------------------------------------------------------------------------------
  // Manejo de Arrastre en Modo Custom
  // ----------------------------------------------------------------------------------
  function handleDragPosition(idx, e) {
    if (formation !== 'custom' || !fieldRef.current) return;
    
    // Calcula las coordenadas X/Y como porcentaje
    const fieldRect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
    const y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

    // Obtener la nueva posición DETALLADA basada en las coordenadas
    const newDetailedPos = getDetailedPosition(x, y); 
    
    setCustomPositions(prev => {
      const newPos = [...prev];
      newPos[idx] = { 
          ...newPos[idx], 
          left: `${Math.max(5, Math.min(95, x))}%`, 
          top: `${Math.max(5, Math.min(95, y))}%`,  
          label: newDetailedPos.label, 
          type: newDetailedPos.type   
      };
      return newPos;
    });
  }
  // ----------------------------------------------------------------------------------

  const selectedDesign = FIELD_DESIGNS.find(d => d.id === fieldDesign) || FIELD_DESIGNS[0];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>Cargando jugadores...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', color: '#dc3545', padding: 24, background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: isMobile ? 16 : 24, marginBottom: isMobile ? 16 : 24, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 12 : 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, width: isMobile ? '100%' : 'auto' }}>
              {onVolver && (
                <button 
                  onClick={onVolver}
                  style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    padding: isMobile ? '8px 14px' : '10px 20px',
                    borderRadius: 25,
                    cursor: 'pointer',
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#667eea';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                    e.target.style.color = '#667eea';
                  }}
                >
                  ← {isMobile ? 'Menú' : 'Volver al Menú'}
                </button>
              )}
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 32, fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ⚽ Mi Once Ideal
                </h1>
                <p style={{ margin: '8px 0 0', color: '#666', fontSize: isMobile ? 10 : 14 }}>
                  {isMobile ? `${miEquipoIdeal.length}/11 | D: ${contarDefensas(miEquipoIdeal)}/5 | P: ${contarPorteros(miEquipoIdeal)}/1` : `Jugadores: ${miEquipoIdeal.length}/11 | Defensas: ${contarDefensas(miEquipoIdeal)}/5 | Porteros: ${contarPorteros(miEquipoIdeal)}/1`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, width: isMobile ? '100%' : 'auto' }}>
              <label style={{ fontWeight: 600, color: '#333', fontSize: isMobile ? 12 : 14 }}>Formación:</label>
              <select 
                value={formation} 
                onChange={(e) => setFormation(e.target.value)}
                style={{ padding: isMobile ? '8px 12px' : '10px 16px', fontSize: isMobile ? 14 : 16, border: '2px solid #667eea', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', background: 'white', flex: isMobile ? 1 : 'none' }}
              >
                <option value="4-4-2">4-4-2</option>
                <option value="4-3-3">4-3-3</option>
                <option value="3-5-2">3-5-2</option>
                <option value="5-3-2">5-3-2</option>
                <option value="3-4-3">3-4-3</option>
                <option value="4-2-3-1">4-2-3-1</option>
                <option value="4-5-1">4-5-1</option>
                <option value="custom">{isMobile ? '🎨 Custom' : '🎨 Crea tu táctica'}</option>
              </select>
            </div>
          </div>

          {message && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              borderRadius: 8, 
              background: message.type === 'error' ? '#fee' : message.type === 'success' ? '#efe' : '#eef',
              border: `2px solid ${message.type === 'error' ? '#f99' : message.type === 'success' ? '#9f9' : '#99f'}`,
              color: message.type === 'error' ? '#c33' : message.type === 'success' ? '#3c3' : '#33c',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: 20 }}>
                {message.type === 'error' ? '❌' : message.type === 'success' ? '✅' : 'ℹ️'}
              </span>
              {message.text}
            </div>
          )}
        </div>

        {/* Campo de fútbol */}
        <div ref={fieldRef} style={{ 
          position: 'relative',
          width: isMobile ? '95%' : '80%',
          paddingBottom: isMobile ? '95%' : '80%',
          maxWidth: 700,
          margin: '0 auto',
          background: selectedDesign.gradient,
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: selectedDesign.pattern,
            opacity: 0.6
          }} />
          
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.6)" />
            <rect x="25" y="2" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <rect x="35" y="2" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="12" r="0.8" fill="rgba(255,255,255,0.6)" />
            <rect x="25" y="82" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <rect x="35" y="90" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="88" r="0.8" fill="rgba(255,255,255,0.6)" />
          </svg>

          <div style={{ position: 'absolute', inset: 0 }}>
            {positions.map((pos, idx) => (
              <div
                key={idx}
                draggable={formation === 'custom'}
                onDragEnd={(e) => handleDragPosition(idx, e)}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.3s ease',
                  cursor: formation === 'custom' ? 'move' : 'default'
                }}
              >
                {alineacion[idx] ? (
                  <div 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('fromSlot', idx.toString());
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIdx = parseInt(e.dataTransfer.getData('fromSlot'));
                      if (!isNaN(fromIdx)) {
                        swapPlayers(fromIdx, idx);
                      }
                    }}
                    onClick={() => openModal(idx)}
                    style={{
                      width: isMobile ? 60 : 80,
                      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                      borderRadius: isMobile ? 8 : 10,
                      padding: isMobile ? 4 : 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      cursor: 'grab',
                      transition: 'all 0.3s ease',
                      border: '2px solid #ffd700',
                      position: 'relative'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                    onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSlot(idx);
                      }}
                      style={{
                        position: 'absolute',
                        top: isMobile ? -4 : -6,
                        right: isMobile ? -4 : -6,
                        width: isMobile ? 18 : 20,
                        height: isMobile ? 18 : 20,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#dc3545',
                        color: 'white',
                        fontSize: isMobile ? 12 : 14,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        zIndex: 10
                    }}
                >
                    ×
                </button>
                <img
                    src={alineacion[idx].image_path}
                    alt={alineacion[idx].name}
                    style={{
                        width: '100%',
                        height: isMobile ? 50 : 70,
                        objectFit: 'cover',
                        borderRadius: isMobile ? 4 : 6,
                        marginBottom: isMobile ? 2 : 4
                    }}
                />
                <div style={{ color: 'white', fontSize: isMobile ? 7 : 9, fontWeight: 'bold', textAlign: 'center', marginBottom: isMobile ? 1 : 2 }}>
                    {alineacion[idx].name.split(' ').slice(-1)[0].toUpperCase()}
                </div>
                <div style={{
                    background: 'rgba(255,215,0,0.9)',
                    color: '#1e3c72',
                    fontSize: isMobile ? 6 : 7,
                    fontWeight: 'bold',
                    padding: isMobile ? '1px' : '2px',
                    borderRadius: 3,
                    textAlign: 'center'
                }}>
                    {pos.label} {/* Etiqueta Dinámica: LI, DC, MP, etc. */}
                </div>
                </div>
                ) : (
                <div
                    onClick={() => openModal(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIdx = parseInt(e.dataTransfer.getData('fromSlot'));
                      if (!isNaN(fromIdx)) {
                        swapPlayers(fromIdx, idx);
                      }
                    }}
                    className="espacio-vacio"
                    style={{
                        width: isMobile ? 60 : 80,
                        height: isMobile ? 75 : 100,
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '2px dashed rgba(255,255,255,0.5)',
                        borderRadius: isMobile ? 8 : 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        gap: isMobile ? 3 : 6
                    }}
                >
                    <div style={{ fontSize: isMobile ? 20 : 28 }}>➕</div>
                    <div style={{
                        color: 'white',
                        fontSize: isMobile ? 7 : 10,
                        fontWeight: 'bold',
                        background: 'rgba(0,0,0,0.5)',
                        padding: isMobile ? '2px 4px' : '3px 6px',
                        borderRadius: 4
                    }}>
                        {pos.label} {/* Etiqueta Dinámica: LI, DC, MP, etc. */}
                    </div>
                </div>
                )}
                </div>
                ))}
                </div>
                </div>
                {/* Selector de diseño de cancha */}
    <div style={{ marginTop: isMobile ? 16 : 20, textAlign: 'center' }}>
      <p style={{ color: 'white', fontWeight: 'bold', marginBottom: isMobile ? 8 : 12, fontSize: isMobile ? 12 : 14 }}>🎨 Diseño de Cancha:</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
        {FIELD_DESIGNS.map(design => (
          <div
            key={design.id}
            onClick={() => setFieldDesign(design.id)}
            style={{
              width: isMobile ? 60 : 80,
              height: isMobile ? 60 : 80,
              background: design.gradient,
              borderRadius: isMobile ? 6 : 8,
              cursor: 'pointer',
              border: fieldDesign === design.id ? `${isMobile ? 3 : 4}px solid #ffd700` : `${isMobile ? 2 : 3}px solid rgba(255,255,255,0.3)`,
              boxShadow: fieldDesign === design.id ? '0 4px 16px rgba(255,215,0,0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: design.pattern,
              opacity: 0.5
            }} />
            <div style={{
              position: 'absolute',
              bottom: isMobile ? 2 : 4,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: 'white',
              fontSize: isMobile ? 7 : 9,
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}>
              {design.name}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Botones de acción */}
    <div style={{ marginTop: isMobile ? 16 : 24, textAlign: 'center', display: 'flex', gap: isMobile ? 8 : 12, justifyContent: 'center', flexWrap: 'wrap', padding: isMobile ? '0 10px' : '0' }}>
      <button
        disabled={miEquipoIdeal.length !== 11}
        onClick={downloadAsImage}
        style={{
          padding: isMobile ? '10px 16px' : '14px 32px',
          fontSize: isMobile ? 12 : 16,
          fontWeight: 'bold',
          background: miEquipoIdeal.length === 11 ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: isMobile ? 8 : 10,
          cursor: miEquipoIdeal.length === 11 ? 'pointer' : 'not-allowed',
          boxShadow: miEquipoIdeal.length === 11 ? '0 6px 20px rgba(40,167,69,0.4)' : 'none',
          transition: 'all 0.3s ease',
          flex: isMobile ? '1' : 'none'
        }}
      >
        📸 {isMobile ? 'Descargar' : 'Descargar como Imagen'}
      </button>

      <button
        onClick={() => {
            setAlineacion(Array(11).fill(null));
            setJugadoresDisponibles(prev => [...prev].sort((a,b)=>a.id-b.id)); 
            setCustomPositions(null); 
            setFormation("4-4-2"); 
            setMessage({ type: 'info', text: 'El equipo ha sido vaciado.' });
        }}
        style={{
          padding: isMobile ? '10px 16px' : '14px 32px',
          fontSize: isMobile ? 12 : 16,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #dc3545 0%, #e85e71 100%)',
          color: 'white',
          border: 'none',
          borderRadius: isMobile ? 8 : 10,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(220,53,69,0.4)',
          transition: 'all 0.3s ease',
          flex: isMobile ? '1' : 'none'
        }}
      >
        🗑️ {isMobile ? 'Vaciar' : 'Vaciar Equipo'}
      </button>
    </div>

    {/* Modal de selección de jugador */}
    {showModal && selectedSlot !== null && (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '10px' : '20px' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: isMobile ? 16 : 24, width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
          <button
            onClick={() => setShowModal(false)}
            style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#333' }}
          >
            ×
          </button>
          <h2 style={{ fontSize: isMobile ? 18 : 24, margin: '0 0 16px', color: '#1e3c72' }}>
            Seleccionar Jugador para <span style={{ color: '#667eea', fontWeight: 'bold' }}>{positions[selectedSlot].label}</span>
          </h2>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: '100%', padding: isMobile ? 10 : 12, fontSize: isMobile ? 14 : 16, border: '2px solid #ccc', borderRadius: 8 }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? 20 : 40, color: '#999', fontSize: isMobile ? 12 : 14 }}>
              No se encontraron jugadores que coincidan con el tipo de posición **{positions[selectedSlot].type}** o la búsqueda.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(90px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))', gap: isMobile ? 10 : 16 }}>
              {filtered.map((player) => (
                <div
                  key={player.id}
                  onClick={() => addPlayerToSlot(player, selectedSlot)}
                  style={{
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    borderRadius: isMobile ? 8 : 10,
                    padding: isMobile ? 6 : 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    transform: 'translateY(0)',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = '#ffd700';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(255,215,0,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <img 
                    src={player.image_path} 
                    alt={player.name}
                    style={{
                      width: '100%',
                      height: isMobile ? 80 : 140,
                      objectFit: 'cover',
                      borderRadius: isMobile ? 6 : 8,
                      marginBottom: isMobile ? 4 : 8
                    }}
                  />
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: isMobile ? 9 : 13, textAlign: 'center', marginBottom: isMobile ? 2 : 4, lineHeight: 1.2 }}>
                    {player.name}
                  </div>
                  <div style={{ 
                    background: 'rgba(255,215,0,0.9)', 
                    color: '#1e3c72', 
                    fontSize: isMobile ? 8 : 11, 
                    fontWeight: 'bold', 
                    padding: isMobile ? '2px 4px' : '4px 6px', 
                    borderRadius: isMobile ? 4 : 6, 
                    textAlign: 'center' 
                  }}>
                    {player.position}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
      </div>
    </div>
  );
}

export default MiOnceIdeal;