import { useState } from "react";
import { StatCard } from "../common/StatCard";
import { Ic } from "../common/Ic";
import { TicketForm } from "./TicketForm";
import { TicketList } from "./TicketList";
import { TicketDetail } from "./TicketDetail";

export function UserPanel({ user, tickets, setTickets, areas, usuarios, toast }) {
  const [tab, setTab] = useState("lista");
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  const getArea = (id) => areas?.find(a => a?.id_area === id) || null;
  const getTecnico = (id) => usuarios?.find(u => u?.id_usuario === id) || null;

  const misTickets = tickets?.filter(t => t?.id_usuario === user?.id_usuario) || [];

  const handleTicketClick = (ticket) => {
    setTicketSeleccionado(ticket);
  };

  const handleCloseDetail = () => {
    setTicketSeleccionado(null);
  };

  const handleUpdateTicket = (ticketActualizado) => {
    setTickets(prev => prev.map(t => 
      t.id_ticket === ticketActualizado.id_ticket ? ticketActualizado : t
    ));
    setTicketSeleccionado(ticketActualizado);
  };

  return (
    <div>
      <div className="hd-user-header">
        <div>
          <h2 className="hd-page-title">
            Hola, {user?.nombre?.split(" ")[0] || "Usuario"} 👋
          </h2>
          <p className="hd-page-sub">
            Área: {getArea(user?.id_area)?.nombre_area || "Sin área"} · Rol: {user?.rol || "Usuario"}
          </p>
        </div>
        <button
          className="hd-btn-primary"
          onClick={() => setTab(tab === "nuevo" ? "lista" : "nuevo")}
        >
          {tab === "nuevo" ? (
            "← Mis Tickets"
          ) : (
            <>
              <Ic n="plus" size={15} color="white" /> Nuevo Ticket
            </>
          )}
        </button>
      </div>

      <div className="hd-user-stats">
        <StatCard emoji="📋" label="Total" value={misTickets.length} bg="#e8effe" />
        <StatCard emoji="🔴" label="Abiertos" value={misTickets.filter(t => t?.id_estado === 1).length} bg="#fee2e2" />
        <StatCard emoji="✅" label="Cerrados" value={misTickets.filter(t => t?.id_estado === 3).length} bg="#dcfce7" />
      </div>

      {tab === "nuevo" ? (
        <TicketForm
          user={user}
          setTickets={setTickets}
          getArea={getArea}
          toast={toast}
          setTab={setTab}
        />
      ) : (
        <TicketList
          tickets={misTickets}
          getTecnico={getTecnico}
          onTicketClick={handleTicketClick}
        />
      )}

      {/* Modal de detalle del ticket */}
      {ticketSeleccionado && (
        <TicketDetail
          ticket={ticketSeleccionado}
          onClose={handleCloseDetail}
          users={usuarios}
          areas={areas}
          currentUser={user}
          onUpdate={handleUpdateTicket}
        />
      )}
    </div>
  );
}