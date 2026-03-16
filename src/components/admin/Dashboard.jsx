import { StatCard } from "../common/StatCard";
import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { getPrioridad, fmtDate } from "../../utils/helpers";

export function Dashboard({ tickets, areas, usuarios, setPage }) {
  const recientes = [...tickets]
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .slice(0, 5);

  const getUser = (id) => usuarios.find(u => u.id_usuario === id) || null;
  const getArea = (id) => areas.find(a => a.id_area === id) || null;

  return (
    <div>
      <h2 className="hd-page-title">Dashboard</h2>
      <p className="hd-page-sub">Resumen del sistema de tickets</p>

      <div className="hd-stats-grid">
        <StatCard emoji="🔴" label="Tickets Abiertos" value={tickets.filter(t => t.id_estado === 1).length} bg="#fee2e2" />
        <StatCard emoji="🟡" label="En Proceso" value={tickets.filter(t => t.id_estado === 2).length} bg="#fef3c7" />
        <StatCard emoji="🟢" label="Cerrados" value={tickets.filter(t => t.id_estado === 3).length} bg="#dcfce7" />
        <StatCard emoji="📋" label="Sin Asignar" value={tickets.filter(t => !t.id_tecnico && t.id_estado !== 3).length} bg="#e8effe" />
      </div>

      <div className="hd-card">
        <div className="hd-card__header">
          <h3>Tickets Recientes</h3>
          <button className="hd-btn-outline" onClick={() => setPage("tickets")}>Ver todos →</button>
        </div>
        <table className="hd-table">
          <thead>
            <tr>{["#", "Título", "Usuario", "Área", "Prioridad", "Estado"].map(h => <th key={h} className="hd-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recientes.map(t => {
              const p = getPrioridad(t.id_prioridad);
              return (
                <TRow key={t.id_ticket}>
                  <td className="hd-td" style={{ color: "#6b7fa3", fontSize: 12 }}>#{t.id_ticket}</td>
                  <td className="hd-td" style={{ fontWeight: 500 }}>{t.titulo}</td>
                  <td className="hd-td">{getUser(t.id_usuario)?.nombre || "—"}</td>
                  <td className="hd-td">{getArea(t.id_area)?.nombre_area || "—"}</td>
                  <td className="hd-td" style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>{p.label}</td>
                  <td className="hd-td"><Badge id_estado={t.id_estado} /></td>
                </TRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}