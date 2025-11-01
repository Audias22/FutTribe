import React, { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://futtribe-production.up.railway.app";
const API_URL = `${API_BASE}/api/v1/jugadores-historicos`;

const GK_SLOT_INDEX = 0;

function uid(x) {
  return String(x);
}

export default function MiOnceIdeal() {
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [alineacion, setAlineacion] = useState(Array(11).fill(null));
  const miEquipoIdeal = alineacion.filter(Boolean);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // {type:'error'|'info', text}
  const [formation, setFormation] = useState("4-4-2");

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

  function puedeAñadir(jugador, equipoArr = miEquipoIdeal) {
    if (!jugador) return false;
    if (equipoArr.find((j) => j.id === jugador.id)) return false;
    if (equipoArr.length >= 11) return false;
    if (esPortero(jugador.position) && contarPorteros(equipoArr) >= 1) return false;
    if (esDefensa(jugador.position) && contarDefensas(equipoArr) >= 5) return false;
    if (esCentral(jugador.position) && contarCentrales(equipoArr) >= 4) return false;
    return true;
  }

  // Presets de formaciones (coordenadas relativas)
  const formationPositions = useMemo(() => ({
    "4-4-2": [
      { top: '88%', left: '50%' }, // GK
      { top: '72%', left: '20%' }, { top: '72%', left: '36%' }, { top: '72%', left: '64%' }, { top: '72%', left: '80%' },
      { top: '52%', left: '18%' }, { top: '52%', left: '36%' }, { top: '52%', left: '64%' }, { top: '52%', left: '82%' },
      { top: '28%', left: '40%' }, { top: '28%', left: '60%' }
    ],
    "3-5-2": [
      { top: '88%', left: '50%' },
      { top: '70%', left: '30%' }, { top: '70%', left: '50%' }, { top: '70%', left: '70%' },
      { top: '52%', left: '12%' }, { top: '52%', left: '34%' }, { top: '52%', left: '50%' }, { top: '52%', left: '66%' }, { top: '52%', left: '88%' },
      { top: '28%', left: '42%' }, { top: '28%', left: '58%' }
    ],
    "4-3-3": [
      { top: '88%', left: '50%' },
      { top: '72%', left: '18%' }, { top: '72%', left: '36%' }, { top: '72%', left: '64%' }, { top: '72%', left: '82%' },
      { top: '52%', left: '34%' }, { top: '52%', left: '50%' }, { top: '52%', left: '66%' },
      { top: '30%', left: '18%' }, { top: '24%', left: '50%' }, { top: '30%', left: '82%' }
    ],
    "5-3-2": [
      { top: '88%', left: '50%' },
      { top: '72%', left: '12%' }, { top: '72%', left: '30%' }, { top: '72%', left: '50%' }, { top: '72%', left: '70%' }, { top: '72%', left: '88%' },
      { top: '52%', left: '34%' }, { top: '52%', left: '50%' }, { top: '52%', left: '66%' },
      { top: '30%', left: '40%' }, { top: '30%', left: '60%' }
    ]
  }), []);

  const slotsPos = formationPositions[formation] || formationPositions['4-4-2'];

  const filtered = jugadoresDisponibles.filter((j) => (j.name || "").toLowerCase().includes(q.trim().toLowerCase()));

  function addPlayerToSlot(player, slotIdx) {
    // auto-place GK to GK slot if possible
    if (esPortero(player.position)) {
      // if GK slot empty, force into GK slot
      if (!alineacion[GK_SLOT_INDEX]) {
        slotIdx = GK_SLOT_INDEX;
      } else if (slotIdx !== GK_SLOT_INDEX) {
        setMessage({ type: 'error', text: 'Ya hay un portero en el equipo.' });
        return false;
      }
    }

    // create candidate team
    const nueva = [...alineacion];
    const existente = nueva[slotIdx];
    let equipoCandidate = miEquipoIdeal.filter((j) => !existente || j.id !== existente.id);
    equipoCandidate = equipoCandidate.filter((j) => j.id !== player.id);
    equipoCandidate.push(player);

    if (!puedeAñadir(player, equipoCandidate.filter(Boolean))) {
      setMessage({ type: 'error', text: 'Restricción: no puedes añadir este jugador.' });
      return false;
    }

    // if existe devolverlo a disponibles
    if (existente && existente.id !== player.id) {
      setJugadoresDisponibles((prev) => [...prev, existente].sort((a,b)=>a.id-b.id));
    }

    setJugadoresDisponibles((prev) => prev.filter((p) => p.id !== player.id));
    // limpiar origen si venía de otro slot
    const fromIdx = nueva.findIndex((s, i) => s && s.id === player.id && i !== slotIdx);
    if (fromIdx !== -1) nueva[fromIdx] = null;
    nueva[slotIdx] = player;
    setAlineacion(nueva);
    setMessage({ type: 'info', text: `${player.name} colocado en slot ${slotIdx + 1}.` });
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

  function onDragEnd(result) {
    setMessage(null);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const playerId = Number(draggableId.replace('player-', ''));
    const player = jugadoresDisponibles.find((p) => p.id === playerId) || miEquipoIdeal.find((p) => p.id === playerId);
    if (!player) return;

    // dragging from players list to a slot
    if (source.droppableId === 'players' && destination.droppableId.startsWith('slot-')) {
      const slotIdx = Number(destination.droppableId.replace('slot-', ''));
      addPlayerToSlot(player, slotIdx);
      return;
    }

    // dragging from slot to players
    if (source.droppableId.startsWith('slot-') && destination.droppableId === 'players') {
      const fromIdx = Number(source.droppableId.replace('slot-', ''));
      removeFromSlot(fromIdx);
      return;
    }

    // slot to slot (move or swap)
    if (source.droppableId.startsWith('slot-') && destination.droppableId.startsWith('slot-')) {
      const fromIdx = Number(source.droppableId.replace('slot-', ''));
      const toIdx = Number(destination.droppableId.replace('slot-', ''));
      if (fromIdx === toIdx) return;
      const nueva = [...alineacion];
      const playerMoving = nueva[fromIdx];
      const destExisting = nueva[toIdx];

      // candidate after move
      let equipoCandidate = miEquipoIdeal.filter((j) => j.id !== (playerMoving ? playerMoving.id : null) && (!destExisting || j.id !== destExisting.id));
      equipoCandidate.push(playerMoving);
      if (!puedeAñadir(playerMoving, equipoCandidate)) {
        setMessage({ type: 'error', text: 'No se puede mover: restricciones.' });
        return;
      }

      nueva[fromIdx] = destExisting || null;
      nueva[toIdx] = playerMoving;
      setAlineacion(nueva);
      setMessage({ type: 'info', text: 'Movimiento completado.' });
      return;
    }
  }

  // Add by button: auto place GK into GK slot
  function handleAddButton(player) {
    if (esPortero(player.position) && !alineacion[GK_SLOT_INDEX]) {
      return addPlayerToSlot(player, GK_SLOT_INDEX);
    }
    // otherwise try first empty slot
    const idx = alineacion.findIndex((s) => s === null);
    if (idx === -1) {
      setMessage({ type: 'error', text: 'El equipo ya tiene 11 jugadores.' });
      return;
    }
    return addPlayerToSlot(player, idx);
  }

  if (loading) return <div>Cargando jugadores...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Mi Once Ideal ({miEquipoIdeal.length}/11)</h2>
        <div>
          <label style={{ marginRight: 8 }}>Formación:</label>
          <select value={formation} onChange={(e) => setFormation(e.target.value)}>
            <option>4-4-2</option>
            <option>3-5-2</option>
            <option>4-3-3</option>
            <option>5-3-2</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Defensas:</strong> {contarDefensas(miEquipoIdeal)} / 5 &nbsp;|&nbsp;
        <strong>Porteros:</strong> {contarPorteros(miEquipoIdeal)} / 1
      </div>

      {message && (
        <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: message.type === 'error' ? '#ffd6d6' : '#e6ffea', color: message.type === 'error' ? '#900' : '#063' }}>
          {message.text}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Players list narrow and horizontal carousel below field */}
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: 560, position: 'relative', background: 'linear-gradient(#4caf50, #3a9b3a)', borderRadius: 8 }}>
              {/* Field slots */}
              {slotsPos.map((pos, idx) => (
                <Droppable droppableId={`slot-${idx}`} key={`slot-${idx}`} direction="vertical">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      style={{ position: 'absolute', width: 160, height: 64, left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {alineacion[idx] ? (
                        <Draggable draggableId={`player-${alineacion[idx].id}`} index={0} key={`p-${alineacion[idx].id}`}>
                          {(drv) => (
                            <div ref={drv.innerRef} {...drv.draggableProps} {...drv.dragHandleProps} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', ...drv.draggableProps.style }}>
                              <img src={alineacion[idx].image_path} alt={alineacion[idx].name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: 12 }}>{alineacion[idx].name}</div>
                                <div style={{ fontSize: 11, color: '#444' }}>{alineacion[idx].position}</div>
                              </div>
                              <button onClick={() => removeFromSlot(idx)}>Quitar</button>
                            </div>
                          )}
                        </Draggable>
                      ) : (
                        <div style={{ width: '100%', textAlign: 'center', color: '#666' }}>Slot vacío</div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>

          {/* Right panel: controls and search */}
          <div style={{ width: 360 }}>
            <h3>Jugadores Disponibles ({filtered.length})</h3>
            <input placeholder="Buscar por nombre..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <Droppable droppableId="players" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: 6, height: 200 }}>
                  {filtered.map((p, index) => (
                    <Draggable key={uid(p.id)} draggableId={`player-${p.id}`} index={index}>
                      {(prov) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={{ minWidth: 120, background: '#fff', borderRadius: 8, padding: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', ...prov.draggableProps.style }}>
                          <img src={p.image_path} alt={p.name} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                          <div style={{ fontWeight: 700, marginTop: 6 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{p.position}</div>
                          <div style={{ marginTop: 6 }}>
                            <button onClick={() => handleAddButton(p)} disabled={!puedeAñadir(p)}>{esPortero(p.position) ? 'Añadir (GK)' : 'Añadir'}</button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div style={{ marginTop: 12 }}>
              <button disabled={miEquipoIdeal.length !== 11} onClick={()=>setMessage({type:'info', text:'Guardado (simulado)'} )}>Guardar Once Ideal</button>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
