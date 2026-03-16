import { useState } from "react";
import { Ic } from "../common/Ic";
import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { getPrioridad, fmtDate } from "../../utils/helpers";

export function TicketList({ tickets, areas, usuarios, setSelectedTicket }) {
  const [filtro, setFiltro] = useState("todos");
  const [search, setSearch] = useState("");

  const getUser = (id) => usuarios.find(u => u.id_usuario === id) || null;
  const getArea = (id) => areas.find(a => a.id_area === id) || null;

  const filtered = tickets
    .filter(t => filtro === "todos" || t.id_estado === Number(filtro))
    .filter(t => !search || t.titulo.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: "todos", label: "Todos", n: tickets.length },
    { id: "1", label: "Abiertos", n: tickets.filter(t => t.id_estado === 1).length },
    { id: "2", label: "En proceso", n: tickets.filter(t => t.id_estado === 2).length },
    { id: "3", label: "Cerrados", n: tickets.filter(t => t.id_estado === 3).length },
  ];

  return (
    <div>
      <h2 className="hd-page-title">Gestión de Tickets</h2>
      <p className="hd-page-sub">Todos los tickets del sistema</p>

      <div className="hd-filter-bar">
        <div className="hd-tabs">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setFiltro(tab.id)}
              className={`hd-tab ${filtro === tab.id ? "active" : ""}`}>
              {tab.label} ({tab.n})
            </button>
          ))}
        </div>
        <div className="hd-search-wrap">
          <div className="hd-search-icon"><Ic n="search" size={14} /></div>
          <input className="hd-input hd-search-wrap" placeholder="Buscar tickets..."
            style={{ paddingLeft: 34, height: 38 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="hd-card">
        <table className="hd-table">
          <thead>
            <tr>{["#", "Título", "Usuario", "Área", "Prioridad", "Estado", "Técnico", "Fecha", ""].map(h => <th key={h} className="hd-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="hd-empty-row">No hay tickets</td></tr>}
            {filtered.map(t => {
              const p = getPrioridad(t.id_prioridad), tec = getUser(t.id_tecnico);
              return (
                <TRow key={t.id_ticket} onClick={() => setSelectedTicket(t)}>
                  <td className="hd-td" style={{ color: "#6b7fa3", fontSize: 12 }}>#{t.id_ticket}</td>
                  <td className="hd-td" style={{ fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.titulo}</td>
                  <td className="hd-td">{getUser(t.id_usuario)?.nombre || "—"}</td>
                  <td className="hd-td" style={{ fontSize: 12 }}>{getArea(t.id_area)?.nombre_area || "—"}</td>
                  <td className="hd-td" style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>{p.label}</td>
                  <td className="hd-td"><Badge id_estado={t.id_estado} /></td>
                  <td className="hd-td" style={{ fontSize: 12, fontStyle: tec ? "normal" : "italic", color: tec ? "#0a0f1e" : "#6b7fa3" }}>{tec?.nombre || "Sin asignar"}</td>
                  <td className="hd-td" style={{ fontSize: 11, color: "#6b7fa3", whiteSpace: "nowrap" }}>{fmtDate(t.fecha_creacion)}</td>
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