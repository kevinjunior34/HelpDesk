import { useState, useEffect } from "react";
import { Badge } from "../common/Badge";
import { Ic } from "../common/Ic";
import { getPrioridad, fmtDate } from "../../utils/helpers";
import { supabase } from "../../lib/supabase";

export function TicketDetail({ ticket, onClose, usuarios, getTecnico }) {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [historial, setHistorial] = useState(ticket.historial || []);
  const [adjuntos, setAdjuntos] = useState([]);

  useEffect(() => {
    cargarAdjuntos();
    cargarHistorial();
  }, [ticket.id_ticket]);

  const cargarAdjuntos = async () => {
    const { data } = await supabase
      .from("adjuntos")
      .select("archivo")
      .eq("id_ticket", ticket.id_ticket);
    
    if (data) {
      const urls = data.map(a => {
        const { data: urlData } = supabase.storage
          .from("adjuntos")
          .getPublicUrl(a.archivo);
        return urlData.publicUrl;
      });
      setAdjuntos(urls);
    }
  };

  const cargarHistorial = async () => {
    const { data } = await supabase
      .from("historial_tickets")
      .select(`
        *,
        usuarios: id_usuario (nombre, rol)
      `)
      .eq("id_ticket", ticket.id_ticket)
      .order("fecha_cambio", { ascending: false });
    
    if (data) setHistorial(data);
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    
    setEnviando(true);
    try {
      const { data, error } = await supabase
        .from("historial_tickets")
        .insert([{
          id_ticket: ticket.id_ticket,
          id_usuario: ticket.id_usuario,
          accion: "comentario",
          detalle: mensaje,
          fecha_cambio: new Date().toISOString()
        }])
        .select(`
          *,
          usuarios: id_usuario (nombre, rol)
        `);

      if (error) throw error;
      
      setHistorial(prev => [data[0], ...prev]);
      setMensaje("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setEnviando(false);
    }
  };

  const p = getPrioridad(ticket.id_prioridad);
  const tecnico = getTecnico(ticket.id_tecnico);

  return (
    <div className="hd-modal-overlay" onClick={onClose}>
      <div className="hd-modal" onClick={e => e.stopPropagation()}>
        <div className="hd-modal-header">
          <h2>Ticket #{ticket.id_ticket}</h2>
          <button className="hd-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="hd-modal-body">
          {/* Información principal */}
          <div className="hd-ticket-info">
            <h3>{ticket.titulo}</h3>
            <div className="hd-ticket-meta">
              <Badge id_estado={ticket.id_estado} />
              <span className="hd-prioridad-badge" style={{ backgroundColor: p.bgColor, color: p.color }}>
                {p.icon} {p.label}
              </span>
            </div>
            
            <div className="hd-ticket-details">
              <p><strong>Descripción:</strong></p>
              <p className="hd-descripcion">{ticket.descripcion}</p>
              
              <p><strong>Técnico asignado:</strong> {tecnico?.nombre || "Sin asignar"}</p>
              <p><strong>Fecha creación:</strong> {fmtDate(ticket.fecha_creacion)}</p>
            </div>

            {/* Adjuntos */}
            {adjuntos.length > 0 && (
              <div className="hd-adjuntos">
                <p><strong>Adjuntos:</strong></p>
                <div className="hd-adjuntos-grid">
                  {adjuntos.map((url, idx) => (
                    <a 
                      key={idx} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hd-adjunto-item"
                    >
                      <Ic n="image" size={20} />
                      <span>Adjunto {idx + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historial / Chat */}
          <div className="hd-historial">
            <h4>Historial del ticket</h4>
            
            <div className="hd-mensajes">
              {historial.length === 0 ? (
                <p className="hd-no-mensajes">No hay mensajes aún</p>
              ) : (
                historial.map((item, idx) => (
                  <div key={idx} className={`hd-mensaje ${item.id_usuario === ticket.id_usuario ? 'propio' : 'sistema'}`}>
                    <div className="hd-mensaje-header">
                      <span className="hd-mensaje-autor">
                        {item.usuarios?.nombre || "Sistema"}
                      </span>
                      <span className="hd-mensaje-fecha">
                        {fmtDate(item.fecha_cambio)}
                      </span>
                    </div>
                    <p className="hd-mensaje-texto">
                      {item.accion === "comentario" ? item.detalle : 
                       `🔔 ${item.accion}: ${item.detalle}`}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input para nuevo mensaje (solo si el ticket está abierto) */}
            {ticket.id_estado !== 3 && (
              <div className="hd-nuevo-mensaje">
                <textarea
                  placeholder="Escribe un mensaje..."
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  rows={2}
                />
                <button 
                  onClick={enviarMensaje}
                  disabled={enviando || !mensaje.trim()}
                  className="hd-btn-primary"
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}