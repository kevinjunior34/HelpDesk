import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { getPrioridad, fmtDate } from "../../utils/helpers";

export function TicketList({ tickets, getTecnico, onTicketClick }) {  // 👈 Agregar onTicketClick
  return (
    <div className="hd-card">
      <div className="hd-card__header">
        <h3>Mis Tickets ({tickets.length})</h3>
      </div>
      <table className="hd-table">
        <thead>
          <tr>
            {["#", "Título", "Prioridad", "Estado", "Técnico", "Fecha"].map(h => (
              <th key={h} className="hd-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && (
            <tr>
              <td colSpan={6} className="hd-empty-row">
                No tienes tickets aún. ¡Crea uno nuevo!
              </td>
            </tr>
          )}
          {tickets.map(t => {
            const p = getPrioridad(t.id_prioridad);
            const tecnico = getTecnico(t.id_tecnico);
            return (
              <TRow 
                key={t.id_ticket} 
                onClick={() => onTicketClick(t)}  // 👈 Hacer clic en la fila
                style={{ cursor: "pointer" }}
              >
                <td className="hd-td" style={{ color: "#6b7fa3", fontSize: 12 }}>
                  #{t.id_ticket}
                </td>
                <td className="hd-td" style={{ fontWeight: 500 }}>
                  {t.titulo}
                </td>
                <td className="hd-td" style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>
                  {p.label}
                </td>
                <td className="hd-td">
                  <Badge id_estado={t.id_estado} />
                </td>
                <td className="hd-td" style={{ fontSize: 12 }}>
                  {tecnico ? tecnico.nombre : "Sin asignar"}
                </td>
                <td className="hd-td" style={{ fontSize: 11, color: "#6b7fa3" }}>
                  {fmtDate(t.fecha_creacion)}
                </td>
              </TRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}