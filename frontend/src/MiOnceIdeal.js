import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://futtribe-production.up.railway.app";
const API_URL = `${API_BASE}/api/v1/jugadores-historicos`;

export default function MiOnceIdeal() {
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  // alineacion: 11 slots (null o jugador). Usamos esto como fuente de la verdad.
  const [alineacion, setAlineacion] = useState(Array(11).fill(null));
  const miEquipoIdeal = alineacion.filter(Boolean);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Tokeniza la posición (p. ej. "LD / DFC") en piezas: ["LD","DFC"].
  function tokensPos(pos) {
    return posicion(pos)
      .split(/[^A-Z0-9]+/) // separadores: espacios, '/', etc.
      .map((t) => t.trim())
      .filter(Boolean);
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

  // puedeAñadir ahora acepta un equipo candidato (por si estamos moviendo desde otro slot)
  function puedeAñadir(jugador, equipoArr = miEquipoIdeal) {
    if (!jugador) return false;
    // no duplicados (si ya está en el equipo candidato)
    if (equipoArr.find((j) => j.id === jugador.id)) return false;
    // límite total 11
    if (equipoArr.length >= 11) return false;
    // portero único
    if (esPortero(jugador.position) && contarPorteros(equipoArr) >= 1) return false;
    // defensas máximo 5
    if (esDefensa(jugador.position) && contarDefensas(equipoArr) >= 5) return false;
    // centrales dentro de defensas: máximo 4
    if (esCentral(jugador.position) && contarCentrales(equipoArr) >= 4) return false;
    return true;
  }

  function añadirJugador(jugador) {
    if (!puedeAñadir(jugador)) return;
    // colocar en el primer slot vacío
    const idx = alineacion.findIndex((s) => s === null);
    if (idx === -1) return;
    const nueva = [...alineacion];
    nueva[idx] = jugador;
    setAlineacion(nueva);
    setJugadoresDisponibles((prev) => prev.filter((p) => p.id !== jugador.id));
  }

  function quitarJugador(jugador) {
    const nueva = alineacion.map((s) => (s && s.id === jugador.id ? null : s));
    setAlineacion(nueva);
    setJugadoresDisponibles((prev) => [...prev, jugador].sort((a, b) => a.id - b.id));
  }

  const filtered = jugadoresDisponibles.filter((j) =>
    (j.name || "").toLowerCase().includes(q.trim().toLowerCase())
  );

  if (loading) return <div>Cargando jugadores...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <h2>Jugadores Disponibles ({filtered.length})</h2>

        <input
          placeholder="Buscar por nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: 12 }}
        />

        <div style={{ maxHeight: 560, overflow: "auto", border: "1px solid #ddd", padding: 8 }}>
          {filtered.map((j) => (
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 6, borderBottom: "1px solid #eee" }} draggable onDragStart={(e)=>e.dataTransfer.setData('text/plain', String(j.id))}>
              <img src={j.image_path} alt={j.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{j.name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{j.position}</div>
              </div>
              <button
                onClick={() => añadirJugador(j)}
                disabled={!puedeAñadir(j)}
                title={!puedeAñadir(j) ? "No se puede añadir por restricciones o ya está seleccionado" : "Añadir al equipo"}
              >
                Añadir
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 420 }}>
        <h2>Mi Once Ideal ({miEquipoIdeal.length}/11)</h2>

        <div style={{ marginBottom: 12 }}>
          <strong>Defensas:</strong> {contarDefensas(miEquipoIdeal)} / 5 &nbsp;|&nbsp;
          <strong>Porteros:</strong> {contarPorteros(miEquipoIdeal)} / 1
        </div>

        {/* Campo con 11 slots posicionados */}
        <div style={{ width: 420, height: 560, position: 'relative', background: 'linear-gradient(#4caf50, #3a9b3a)', borderRadius: 8, padding: 8 }}>
          {miEquipoIdeal.length === 0 && <div style={{ color: "#666", position: 'absolute', left: 10, top: 10 }}>Aún no has añadido jugadores.</div>}

          {/* Coordenadas de los 11 slots (índice 0..10) */}
          {(() => {
            const slotsPos = [
              { top: '85%', left: '50%', transform: 'translate(-50%, -50%)' }, // 0 - portero (abajo centro)
              { top: '70%', left: '18%', transform: 'translate(-50%, -50%)' }, // 1 - defensa izq
              { top: '70%', left: '36%', transform: 'translate(-50%, -50%)' }, // 2 - defensa
              { top: '70%', left: '64%', transform: 'translate(-50%, -50%)' }, // 3 - defensa
              { top: '70%', left: '82%', transform: 'translate(-50%, -50%)' }, // 4 - defensa der
              { top: '50%', left: '14%', transform: 'translate(-50%, -50%)' }, // 5 - centro izq
              { top: '50%', left: '36%', transform: 'translate(-50%, -50%)' }, // 6 - centro
              { top: '50%', left: '64%', transform: 'translate(-50%, -50%)' }, // 7 - centro
              { top: '50%', left: '86%', transform: 'translate(-50%, -50%)' }, // 8 - centro der
              { top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }, // 9 - mediapunta
              { top: '10%', left: '50%', transform: 'translate(-50%, -50%)' }, // 10 - delantero
            ];

            return slotsPos.map((pos, idx) => {
              const slot = alineacion[idx];
              return (
                <div key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData('text/plain');
                    const jugador = jugadoresDisponibles.find((p) => String(p.id) === id) || miEquipoIdeal.find((p) => String(p.id) === id);
                    if (!jugador) return;

                    // calcular equipo candidato: quitamos al jugador si venía de otro slot
                    const nueva = [...alineacion];
                    const existente = nueva[idx];

                    // construir equipoSinExisting (quitamos el existente del equipo si hay swap)
                    let equipoSinExisting = miEquipoIdeal.filter((j) => !existente || j.id !== existente.id);
                    // si el jugador venía del equipo, quitarlo (porque lo estamos moviendo)
                    equipoSinExisting = equipoSinExisting.filter((j) => j.id !== jugador.id);

                    const equipoCandidate = [...equipoSinExisting, jugador];

                    // validar restricciones sobre el equipoCandidate
                    if (equipoCandidate.length > 11) return alert('No se pueden tener más de 11 jugadores.');
                    if (contarPorteros(equipoCandidate) > 1) return alert('Ya hay un portero en el equipo.');
                    if (contarDefensas(equipoCandidate) > 5) return alert('Límite de defensas alcanzado (5).');
                    if (contarCentrales(equipoCandidate) > 4) return alert('Límite de centrales alcanzado (4).');

                    // OK: efectuar swap/move
                    // si existente distinto, devolver existente a disponibles
                    if (existente && existente.id !== jugador.id) {
                      setJugadoresDisponibles((prev) => [...prev, existente].sort((a,b)=>a.id-b.id));
                    }

                    // si el jugador venía de disponibles, quitarlo
                    setJugadoresDisponibles((prev) => prev.filter((p) => p.id !== jugador.id));

                    // limpiar origen si venía de otro slot
                    const fromIdx = nueva.findIndex((s, i) => s && s.id === jugador.id && i !== idx);
                    if (fromIdx !== -1) nueva[fromIdx] = null;

                    nueva[idx] = jugador;
                    setAlineacion(nueva);
                  }}
                  style={{ position: 'absolute', width: 160, height: 56, padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', transform: pos.transform, left: pos.left, top: pos.top }}>
                  {slot ? (
                    <>
                      <img src={slot.image_path} alt={slot.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} draggable onDragStart={(e)=>e.dataTransfer.setData('text/plain', String(slot.id))} />
                      <div style={{ flex: 1, marginLeft: 6 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 12 }}>{slot.name}</div>
                        <div style={{ fontSize: 11, color: '#444' }}>{slot.position}</div>
                      </div>
                      <button onClick={() => quitarJugador(slot)} style={{ marginLeft: 8 }}>Quitar</button>
                    </>
                  ) : (
                    <div style={{ width: '100%', textAlign: 'center', color: '#666' }}>Slot vacío</div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            disabled={miEquipoIdeal.length !== 11}
            onClick={() => alert("Equipo guardado (simulado).")}
          >
            Guardar Once Ideal
          </button>
        </div>
      </div>
    </div>
  );
}
