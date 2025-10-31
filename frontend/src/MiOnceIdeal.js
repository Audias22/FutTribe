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

  function puedeAñadir(jugador) {
    if (!jugador) return false;
    // no duplicados
    if (miEquipoIdeal.find((j) => j.id === jugador.id)) return false;
    // límite total 11
    if (miEquipoIdeal.length >= 11) return false;
    // portero único
    if (esPortero(jugador.position) && contarPorteros(miEquipoIdeal) >= 1) return false;
    // defensas máximo 5
    if (esDefensa(jugador.position) && contarDefensas(miEquipoIdeal) >= 5) return false;
    // centrales dentro de defensas: máximo 4
    if (esCentral(jugador.position) && contarCentrales(miEquipoIdeal) >= 4) return false;
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
          <strong>Centrales:</strong> {contarCentrales(miEquipoIdeal)} / 4 &nbsp;|&nbsp;
          <strong>Porteros:</strong> {contarPorteros(miEquipoIdeal)} / 1
        </div>

        <div style={{ minHeight: 200, border: "1px dashed #ccc", padding: 8 }}>
          {miEquipoIdeal.length === 0 && <div style={{ color: "#666" }}>Aún no has añadido jugadores.</div>}

          {/* Slots de alineación (drag & drop) */}
          <div style={{ display: "grid", gap: 6 }}>
            {alineacion.map((slot, idx) => (
              <div key={idx}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain');
                  const jugador = jugadoresDisponibles.find((p) => String(p.id) === id) || miEquipoIdeal.find((p) => String(p.id) === id);
                  if (!jugador) return;
                  const nueva = [...alineacion];
                  const existente = nueva[idx];
                  if (existente && jugador.id !== existente.id) {
                    // si el slot ya tenía uno y viene uno distinto, devolver existente a disponibles
                    setJugadoresDisponibles((prev) => [...prev, existente].sort((a,b)=>a.id-b.id));
                  }
                  // quitar jugador de disponibles
                  setJugadoresDisponibles((prev) => prev.filter((p) => p.id !== jugador.id));
                  // limpiar si el jugador estaba en otro slot
                  const fromIdx = nueva.findIndex((s, i) => s && s.id === jugador.id && i !== idx);
                  if (fromIdx !== -1) nueva[fromIdx] = null;
                  nueva[idx] = jugador;
                  setAlineacion(nueva);
                }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: 6, borderBottom: "1px solid #eee", minHeight: 56 }}>
                {slot ? (
                  <>
                    <img src={slot.image_path} alt={slot.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} draggable onDragStart={(e)=>e.dataTransfer.setData('text/plain', String(slot.id))} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold" }}>{slot.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{slot.position}</div>
                    </div>
                    <button onClick={() => quitarJugador(slot)}>Quitar</button>
                  </>
                ) : (
                  <div style={{ color: "#999" }}>Slot vacío (arrastra o pulsa Añadir)</div>
                )}
              </div>
            ))}
          </div>
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
