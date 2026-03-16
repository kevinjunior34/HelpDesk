import { useState, useMemo } from "react";
import { Ic } from "../common/Ic";
import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { getPrioridad, fmtDate } from "../../utils/helpers";

export function Archivados({ tickets, areas, usuarios, setSelectedTicket }) {
  const [search,      setSearch]      = useState("");
  const [filtroArea,  setFiltroArea]  = useState("");
  const [filtroTec,   setFiltroTec]   = useState("");
  const [filtroRol,   setFiltroRol]   = useState("");

  const getUser = (id) => usuarios.find(u => u.id_usuario === id) || null;
  const getArea = (id) => areas.find(a => a.id_area === id) || null;

  // Solo tickets archivados
  const archivados = tickets.filter(t => t.id_estado === 4);

  // Listas únicas para los selects
  const tecnicosUsados = useMemo(() => {
    const ids = [...new Set(archivados.map(t => t.id_tecnico).filter(Boolean))];
    return ids.map(id => getUser(id)).filter(Boolean);
  }, [archivados, usuarios]);

  const areasUsadas = useMemo(() => {
    const ids = [...new Set(archivados.map(t => t.id_area).filter(Boolean))];
    return ids.map(id => getArea(id)).filter(Boolean);
  }, [archivados, areas]);

  const rolesUsados = useMemo(() => {
    const roles = archivados.map(t => getUser(t.id_usuario)?.rol).filter(Boolean);
    return [...new Set(roles)];
  }, [archivados, usuarios]);

  const filtered = archivados.filter(t => {
    const usuario = getUser(t.id_usuario);
    if (filtroArea && t.id_area    !== Number(filtroArea)) return false;
    if (filtroTec  && t.id_tecnico !== Number(filtroTec))  return false;
    if (filtroRol  && usuario?.rol !== filtroRol)          return false;
    if (search && !t.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const limpiar = () => {
    setSearch(""); setFiltroArea(""); setFiltroTec(""); setFiltroRol("");
  };

  const hayFiltros = search || filtroArea || filtroTec || filtroRol;

  return (
    <div>
      <h2 className="hd-page-title">Tickets Archivados</h2>
      <p className="hd-page-sub">{archivados.length} tickets archivados en el sistema</p>

      {/* ── Barra de filtros ── */}
      <div style={{
        background: "#fff", borderRadius: 12, border: "1px solid #eef0f6",
        padding: "16px 18px", marginBottom: 18,
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end",
      }}>

        {/* Buscar */}
        <div style={{ flex: "1 1 180px", minWidth: 160 }}>
          <label className="hd-label">Buscar</label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Ic n="search" size={13} style={{ color: "#b0bbd4" }} />
            </div>
            <input
              className="hd-input"
              placeholder="Título del ticket…"
              style={{ paddingLeft: 32, height: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filtro Área */}
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <label className="hd-label">Área</label>
          <select className="hd-select" style={{ height: 36 }} value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areasUsadas.map(a => (
              <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>
            ))}
          </select>
        </div>

        {/* Filtro Técnico */}
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <label className="hd-label">Técnico</label>
          <select className="hd-select" style={{ height: 36 }} value={filtroTec} onChange={e => setFiltroTec(e.target.value)}>
            <option value="">Todos los técnicos</option>
            {tecnicosUsados.map(t => (
              <option key={t.id_usuario} value={t.id_usuario}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filtro Rol */}
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <label className="hd-label">Rol del usuario</label>
          <select className="hd-select" style={{ height: 36 }} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {rolesUsados.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Limpiar filtros */}
        {hayFiltros && (
          <button
            className="hd-btn-ghost"
            onClick={limpiar}
            style={{ height: 36, alignSelf: "flex-end", color: "#ef4444", borderColor: "#fecaca" }}
          >
            <Ic n="x" size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* ── Resultado ── */}
      <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7fa3" }}>
        {hayFiltros
          ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} con los filtros aplicados`
          : `Mostrando ${filtered.length} ticket${filtered.length !== 1 ? "s" : ""}`
        }
      </div>

      {/* ── Tabla ── */}
      <div className="hd-card">
        <table className="hd-table">
          <thead>
            <tr>
              {["#", "Título", "Usuario", "Rol", "Área", "Prioridad", "Técnico", "Cerrado", ""].map(h => (
                <th key={h} className="hd-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="hd-empty-row">
                  {hayFiltros ? "No hay tickets con esos filtros" : "No hay tickets archivados"}
                </td>
              </tr>
            )}
            {filtered.map(t => {
              const p      = getPrioridad(t.id_prioridad);
              const tec    = getUser(t.id_tecnico);
              const autor  = getUser(t.id_usuario);
              return (
                <TRow key={t.id_ticket} onClick={() => setSelectedTicket(t)}>
                  <td className="hd-td" style={{ color: "#6b7fa3", fontSize: 12 }}>#{t.id_ticket}</td>
                  <td className="hd-td" style={{ fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.titulo}
                  </td>
                  <td className="hd-td" style={{ fontSize: 12 }}>{autor?.nombre || "—"}</td>
                  <td className="hd-td">
                    {autor?.rol && (
                      <span style={{
                        fontSize: 10, background: "#eef0f6", borderRadius: 4,
                        padding: "2px 7px", color: "#5b8dee", fontWeight: 600,
                      }}>
                        {autor.rol}
                      </span>
                    )}
                  </td>
                  <td className="hd-td" style={{ fontSize: 12 }}>{getArea(t.id_area)?.nombre_area || "—"}</td>
                  <td className="hd-td" style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>{p.label}</td>
                  <td className="hd-td" style={{ fontSize: 12, fontStyle: tec ? "normal" : "italic", color: tec ? "#0a0f1e" : "#6b7fa3" }}>
                    {tec?.nombre || "Sin asignar"}
                  </td>
                  <td className="hd-td" style={{ fontSize: 11, color: "#6b7fa3", whiteSpace: "nowrap" }}>
                    {fmtDate(t.fecha_cierre)}
                  </td>
                  <td className="hd-td">
                    <button className="hd-btn-ghost" onClick={ev => { ev.stopPropagation(); setSelectedTicket(t); }}>
                      <Ic n="eye" size={12} /> Ver
                    </button>
                  </td>
                </TRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}