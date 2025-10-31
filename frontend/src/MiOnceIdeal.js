import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://futtribe-production.up.railway.app";
const API_URL = `${API_BASE}/api/v1/jugadores-historicos`;

export default function MiOnceIdeal() {
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [miEquipoIdeal, setMiEquipoIdeal] = useState([]); // max 11
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

  function esDefensa(pos) {
    const p = posicion(pos);
    return ["LI", "LD", "CB", "DFC", "LIBERO"].includes(p);
  }
  function esCentral(pos) {
    const p = posicion(pos);
    return ["CB", "DFC"].includes(p);
  }
  function esPortero(pos) {
    return posicion(pos) === "GK" || posicion(pos) === "PORTERO";
  }

  function contarDefensas(equipo) {
    return equipo.filter((j) => esDefensa(j.position)).length;
  }
  function contarCentrales(equipo) {
    return equipo.filter((j) => esCentral(j.position)).length;
  }
  function contarPorteros(equipo) {
    return equipo.filter((j) => esPortero(j.position)).length;
  }

  function puedeAñadir(jugador) {
    if (!jugador) return false;
    if (miEquipoIdeal.find((j) => j.id === jugador.id)) return false;
    if (miEquipoIdeal.length >= 11) return false;
    if (esPortero(jugador.position) && contarPorteros(miEquipoIdeal) >= 1) return false;
    if (esDefensa(jugador.position) && contarDefensas(miEquipoIdeal) >= 5) return false;
    if (esCentral(jugador.position) && contarCentrales(miEquipoIdeal) >= 4) return false;
    return true;
  }

  function añadirJugador(jugador) {
    if (!puedeAñadir(jugador)) return;
    setMiEquipoIdeal((prev) => [...prev, jugador]);
    setJugadoresDisponibles((prev) => prev.filter((p) => p.id !== jugador.id));
  }

  function quitarJugador(jugador) {
    setMiEquipoIdeal((prev) => prev.filter((p) => p.id !== jugador.id));
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
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 6, borderBottom: "1px solid #eee" }}>
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
          {miEquipoIdeal.map((j) => (
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 6, borderBottom: "1px solid #eee" }}>
              <img src={j.image_path} alt={j.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{j.name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{j.position}</div>
              </div>
              <button onClick={() => quitarJugador(j)}>Quitar</button>
            </div>
          ))}
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
