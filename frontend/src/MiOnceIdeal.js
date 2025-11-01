import React, { useEffect, useState, useMemo } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://futtribe-production.up.railway.app";
const API_URL = `${API_BASE}/api/v1/jugadores-historicos`;

export default function MiOnceIdeal() {
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [alineacion, setAlineacion] = useState(Array(11).fill(null));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [formation, setFormation] = useState("4-4-2");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

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
  
  function esDefensa(pos) {
    const toks = tokensPos(pos);
    const defs = ["LI", "LD", "CB", "DFC", "LIBERO", "DF", "LB", "RB"];
    return toks.some((t) => defs.includes(t));
  }
  
  function esCentral(pos) {
    const toks = tokensPos(pos);
    return toks.some((t) => ["CB", "DFC"].includes(t));
  }
  
  function esPortero(pos) {
    const toks = tokensPos(pos);
    return toks.some((t) => ["GK", "POR", "PORTERO", "POR."].includes(t));
  }

  function contarDefensas(equipoArr) {
    return equipoArr.filter((j) => esDefensa(j.position)).length;
  }
  
  function contarCentrales(equipoArr) {
    return equipoArr.filter((j) => esCentral(j.position)).length;
  }
  
  function contarPorteros(equipoArr) {
    return equipoArr.filter((j) => esPortero(j.position)).length;
  }

  const formationPositions = useMemo(() => ({
    "4-4-2": [
      { top: '85%', left: '50%', label: 'POR' },
      { top: '68%', left: '18%', label: 'LI' }, 
      { top: '68%', left: '38%', label: 'DFC' }, 
      { top: '68%', left: '62%', label: 'DFC' }, 
      { top: '68%', left: '82%', label: 'LD' },
      { top: '48%', left: '16%', label: 'MI' }, 
      { top: '48%', left: '38%', label: 'MC' }, 
      { top: '48%', left: '62%', label: 'MC' }, 
      { top: '48%', left: '84%', label: 'MD' },
      { top: '25%', left: '40%', label: 'DC' }, 
      { top: '25%', left: '60%', label: 'DC' }
    ],
    "4-3-3": [
      { top: '85%', left: '50%', label: 'POR' },
      { top: '68%', left: '18%', label: 'LI' }, 
      { top: '68%', left: '38%', label: 'DFC' }, 
      { top: '68%', left: '62%', label: 'DFC' }, 
      { top: '68%', left: '82%', label: 'LD' },
      { top: '48%', left: '32%', label: 'MC' }, 
      { top: '48%', left: '50%', label: 'MC' }, 
      { top: '48%', left: '68%', label: 'MC' },
      { top: '22%', left: '18%', label: 'EI' }, 
      { top: '18%', left: '50%', label: 'DC' }, 
      { top: '22%', left: '82%', label: 'ED' }
    ],
    "3-5-2": [
      { top: '85%', left: '50%', label: 'POR' },
      { top: '68%', left: '28%', label: 'DFC' }, 
      { top: '68%', left: '50%', label: 'DFC' }, 
      { top: '68%', left: '72%', label: 'DFC' },
      { top: '48%', left: '12%', label: 'MI' }, 
      { top: '48%', left: '32%', label: 'MC' }, 
      { top: '48%', left: '50%', label: 'MC' }, 
      { top: '48%', left: '68%', label: 'MC' }, 
      { top: '48%', left: '88%', label: 'MD' },
      { top: '25%', left: '40%', label: 'DC' }, 
      { top: '25%', left: '60%', label: 'DC' }
    ],
    "5-3-2": [
      { top: '85%', left: '50%', label: 'POR' },
      { top: '68%', left: '12%', label: 'LI' }, 
      { top: '68%', left: '30%', label: 'DFC' }, 
      { top: '68%', left: '50%', label: 'DFC' }, 
      { top: '68%', left: '70%', label: 'DFC' }, 
      { top: '68%', left: '88%', label: 'LD' },
      { top: '48%', left: '32%', label: 'MC' }, 
      { top: '48%', left: '50%', label: 'MC' }, 
      { top: '48%', left: '68%', label: 'MC' },
      { top: '25%', left: '40%', label: 'DC' }, 
      { top: '25%', left: '60%', label: 'DC' }
    ]
  }), []);

  const positions = formationPositions[formation] || formationPositions['4-4-2'];

  const filtered = jugadoresDisponibles.filter((j) => 
    (j.name || "").toLowerCase().includes(q.trim().toLowerCase())
  );

  function addPlayerToSlot(player, slotIdx) {
    if (!player) return false;
    
    if (alineacion.find((j) => j && j.id === player.id)) {
      setMessage({ type: 'error', text: 'Este jugador ya está en el equipo.' });
      return false;
    }
    
    if (miEquipoIdeal.length >= 11) {
      setMessage({ type: 'error', text: 'El equipo ya tiene 11 jugadores.' });
      return false;
    }

    const nueva = [...alineacion];
    const existente = nueva[slotIdx];
    let equipoCandidate = miEquipoIdeal.filter((j) => !existente || j.id !== existente.id);
    equipoCandidate = equipoCandidate.filter((j) => j.id !== player.id);
    equipoCandidate.push(player);

    if (esDefensa(player.position) && contarDefensas(equipoCandidate) > 5) {
      setMessage({ type: 'error', text: 'Límite: máximo 5 defensas.' });
      return false;
    }
    
    if (esCentral(player.position) && contarCentrales(equipoCandidate) > 4) {
      setMessage({ type: 'error', text: 'Límite: máximo 4 centrales.' });
      return false;
    }

    if (esPortero(player.position) && slotIdx !== 0) {
      setMessage({ type: 'error', text: 'El portero debe ir en la posición de portero.' });
      return false;
    }

    if (existente && existente.id !== player.id) {
      setJugadoresDisponibles((prev) => [...prev, existente].sort((a,b)=>a.id-b.id));
    }

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
    setMessage({ type: 'info', text: `${jugador.name} eliminado del equipo.` });
  }

  function openModal(slotIdx) {
    setSelectedSlot(slotIdx);
    setShowModal(true);
    setQ("");
  }

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
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ⚽ Mi Once Ideal
              </h1>
              <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>
                Jugadores: {miEquipoIdeal.length}/11 | Defensas: {contarDefensas(miEquipoIdeal)}/5 | Porteros: {contarPorteros(miEquipoIdeal)}/1
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontWeight: 600, color: '#333' }}>Formación:</label>
              <select 
                value={formation} 
                onChange={(e) => setFormation(e.target.value)}
                style={{ padding: '10px 16px', fontSize: 16, border: '2px solid #667eea', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', background: 'white' }}
              >
                <option>4-4-2</option>
                <option>4-3-3</option>
                <option>3-5-2</option>
                <option>5-3-2</option>
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
        <div style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: '140%',
          maxWidth: 900,
          margin: '0 auto',
          background: 'linear-gradient(180deg, #4a9d4f 0%, #3d8b41 50%, #4a9d4f 100%)',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          {/* Patrón de césped */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.03) 50px, rgba(0,0,0,0.03) 100px)',
            opacity: 0.6
          }} />
          
          {/* Líneas del campo */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 140" preserveAspectRatio="none">
            <rect x="2" y="2" width="96" height="136" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="70" r="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="70" r="0.5" fill="rgba(255,255,255,0.6)" />
            <rect x="25" y="2" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <rect x="35" y="2" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="12" r="0.5" fill="rgba(255,255,255,0.6)" />
            <rect x="25" y="122" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <rect x="35" y="130" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
            <circle cx="50" cy="126" r="0.5" fill="rgba(255,255,255,0.6)" />
          </svg>

          {/* Slots de jugadores */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {positions.map((pos, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.3s ease'
                }}
              >
                {alineacion[idx] ? (
                  <div 
                    onClick={() => openModal(idx)}
                    style={{
                      width: 90,
                      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                      borderRadius: 12,
                      padding: 8,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '3px solid #ffd700',
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSlot(idx);
                      }}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#dc3545',
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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
                        height: 85,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 6
                      }}
                    />
                    <div style={{ color: 'white', fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>
                      {alineacion[idx].name.split(' ').slice(-1)[0].toUpperCase()}
                    </div>
                    <div style={{ 
                      background: 'rgba(255,215,0,0.9)', 
                      color: '#1e3c72', 
                      fontSize: 8, 
                      fontWeight: 'bold', 
                      padding: '2px 4px', 
                      borderRadius: 4, 
                      textAlign: 'center' 
                    }}>
                      {pos.label}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => openModal(idx)}
                    style={{
                      width: 90,
                      height: 120,
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '3px dashed rgba(255,255,255,0.5)',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      gap: 8
                    }}
                  >
                    <div style={{ fontSize: 32 }}>➕</div>
                    <div style={{ 
                      color: 'white', 
                      fontSize: 11, 
                      fontWeight: 'bold',
                      background: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: 6
                    }}>
                      {pos.label}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botón guardar */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            disabled={miEquipoIdeal.length !== 11}
            onClick={() => setMessage({ type: 'success', text: '¡Once ideal guardado correctamente! 🎉' })}
            style={{
              padding: '16px 48px',
              fontSize: 18,
              fontWeight: 'bold',
              background: miEquipoIdeal.length === 11 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              cursor: miEquipoIdeal.length === 11 ? 'pointer' : 'not-allowed',
              boxShadow: miEquipoIdeal.length === 11 ? '0 8px 24px rgba(102,126,234,0.4)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {miEquipoIdeal.length === 11 ? '💾 Guardar Once Ideal' : `Faltan ${11 - miEquipoIdeal.length} jugadores`}
          </button>
        </div>
      </div>

      {/* Modal de selección */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: 1000,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ padding: 24, borderBottom: '2px solid #eee', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: 'white', fontSize: 28, fontWeight: 'bold' }}>
                  ⚽ Selecciona un Jugador
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: 24,
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 16,
                  border: 'none',
                  borderRadius: 8,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: 16 
              }}>
                {filtered.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => addPlayerToSlot(player, selectedSlot)}
                    style={{
                      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                      borderRadius: 12,
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '3px solid transparent'
                    }}
                  >
                    <img 
                      src={player.image_path} 
                      alt={player.name}
                      style={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 8
                      }}
                    />
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
                      {player.name}
                    </div>
                    <div style={{ 
                      background: 'rgba(255,215,0,0.9)', 
                      color: '#1e3c72', 
                      fontSize: 12, 
                      fontWeight: 'bold', 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      textAlign: 'center' 
                    }}>
                      {player.position}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}