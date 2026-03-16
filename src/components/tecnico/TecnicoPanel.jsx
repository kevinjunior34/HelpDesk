import { useState, useEffect } from "react";
import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { Ic } from "../common/Ic";
import { getPrioridad, fmtDate } from "../../utils/helpers";
import { supabase } from "../../lib/supabase";

// ─── Tab: Adjuntos ────────────────────────────────────────────────────────────
function TabAdjuntos({ ticket }) {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [preview,  setPreview]  = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("adjuntos")
          .select("id_adjunto, archivo")
          .eq("id_ticket", ticket.id_ticket);
        if (error) throw error;
        if (!data?.length) { setAdjuntos([]); return; }
        const conUrls = data.map(adj => {
          const { data: urlData } = supabase.storage.from("adjuntos").getPublicUrl(adj.archivo);
          return { ...adj, url: urlData.publicUrl };
        });
        setAdjuntos(conUrls);
      } catch (err) {
        console.error("Error cargando adjuntos:", err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [ticket.id_ticket]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <span style={{ fontSize: 13, color: "#6b7fa3" }}>Cargando imágenes…</span>
    </div>
  );

  if (adjuntos.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10, color: "#6b7fa3" }}>
      <Ic n="image" size={32} style={{ opacity: .25 }} />
      <span style={{ fontSize: 13 }}>Sin imágenes adjuntas</span>
    </div>
  );

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
        {adjuntos.map(adj => (
          <div key={adj.id_adjunto} onClick={() => setPreview(adj)} style={{
            cursor: "pointer", borderRadius: 10, overflow: "hidden",
            border: "1px solid #eef0f6", background: "#f8f9fd",
            transition: "transform .15s, box-shadow .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(10,15,30,.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <img src={adj.url} alt={adj.archivo}
              style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
              onError={e => { e.target.style.display = "none"; }} />
            <div style={{ padding: "6px 8px", fontSize: 10, color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adj.archivo}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)} style={{
          position: "fixed", inset: 0, zIndex: 1200,
          background: "rgba(10,15,30,.88)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
            <img src={preview.url} alt={preview.archivo}
              style={{ maxWidth: "88vw", maxHeight: "80vh", borderRadius: 12, display: "block" }} />
            <div style={{ position: "absolute", bottom: -26, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.5)" }}>
              {preview.archivo}
            </div>
            <button onClick={() => setPreview(null)} style={{
              position: "absolute", top: -12, right: -12, width: 28, height: 28,
              borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.25)",
            }}>
              <Ic n="x" size={13} style={{ color: "#0a0f1e" }} />
            </button>
            <a href={preview.url} download={preview.archivo} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()} style={{
                position: "absolute", top: -12, left: -12, width: 28, height: 28,
                borderRadius: "50%", background: "#5b8dee", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,.25)", textDecoration: "none",
              }}>
              <Ic n="download" size={13} style={{ color: "#fff" }} />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab: Historial ───────────────────────────────────────────────────────────
function TabHistorial({ ticket, user, onComentarioEnviado }) {
  const historial  = ticket.historial ?? [];
  const [texto,    setTexto]    = useState("");
  const [enviando, setEnviando] = useState(false);
  const esEstadoAuto = (c = "") => c.toLowerCase().startsWith("estado cambiado");

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase
        .from("historial_ticket")
        .insert([{
          id_ticket:  ticket.id_ticket,
          id_usuario: user.id_usuario,
          comentario: texto.trim(),
        }])
        .select();
      if (error) throw error;
      onComentarioEnviado(data[0]);
      setTexto("");
    } catch (err) {
      console.error("Error al enviar comentario:", err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Timeline */}
      {historial.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", gap: 8, color: "#6b7fa3" }}>
          <Ic n="clock" size={28} style={{ opacity: .25 }} />
          <span style={{ fontSize: 13 }}>Sin entradas aún</span>
        </div>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: "4px 0 0", position: "relative" }}>
          <div style={{ position: "absolute", left: 15, top: 12, bottom: 4, width: 2, background: "#eef0f6", borderRadius: 2 }} />
          {historial.map((entry, i) => {
            const esAuto  = esEstadoAuto(entry.comentario);
            const icColor = esAuto ? "#f0a500" : "#5b8dee";
            const icName  = esAuto ? "refresh-cw" : "message-circle";
            return (
              <li key={entry.id_historial} style={{ display: "flex", gap: 12, marginBottom: i < historial.length - 1 ? 16 : 0, position: "relative" }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: `2px solid ${icColor}33`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                  <Ic n={icName} size={13} style={{ color: icColor }} />
                </div>
                <div style={{ flex: 1, background: esAuto ? "#fffbf0" : "#f8f9fd", border: `1px solid ${esAuto ? "#f0e8c8" : "#eef0f6"}`, borderRadius: 10, padding: "9px 13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#0a0f1e", lineHeight: 1.45 }}>{entry.comentario}</span>
                    <span style={{ fontSize: 11, color: "#6b7fa3", whiteSpace: "nowrap", flexShrink: 0 }}>{fmtDate(entry.fecha)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Caja de comentario — solo si NO está archivado */}
      {ticket.id_estado !== 4 && (
        <div style={{ borderTop: "1px solid #eef0f6", paddingTop: 14 }}>
          <div className="hd-section-lbl">Agregar comentario</div>
          <textarea
            className="hd-textarea"
            rows={3}
            placeholder="Escribe una nota o actualización…"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) enviar(); }}
            style={{ resize: "vertical", minHeight: 72 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#b0bbd4" }}>Ctrl + Enter para enviar</span>
            <button
              className="hd-btn-primary"
              onClick={enviar}
              disabled={!texto.trim() || enviando}
              style={{ opacity: !texto.trim() || enviando ? .6 : 1, padding: "7px 16px" }}
            >
              {enviando ? "Enviando…" : <><Ic n="send" size={12} color="white" /> Enviar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal del técnico ────────────────────────────────────────────────────────
function TicketDetalleModal({ ticket: initialTicket, user, areas, onClose, onCambiarEstado }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [tab,    setTab]    = useState("detalles");

  const p           = getPrioridad(ticket.id_prioridad);
  const getArea     = (id) => areas.find(a => a.id_area === id) || null;
  const esArchivado = ticket.id_estado === 4;
  const esCerrado   = ticket.id_estado === 3;
  const nHistorial  = ticket.historial?.length ?? 0;

  const handleComentario = (nuevaEntrada) => {
    setTicket(prev => ({ ...prev, historial: [...(prev.historial ?? []), nuevaEntrada] }));
  };

  const TABS = [
    { id: "detalles",  label: "Detalles",  icon: "file-text"  },
    { id: "adjuntos",  label: "Adjuntos",  icon: "image"      },
    { id: "historial", label: "Historial", icon: "clock", badge: nHistorial },
  ];

  return (
    <div className="hd-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="hd-modal">

        {/* Header */}
        <div className="hd-modal__header">
          <div>
            <div className="hd-modal__id">TICKET #{ticket.id_ticket}</div>
            <h3 className="hd-modal__title">{ticket.titulo}</h3>
            <div className="hd-modal__meta">
              <Badge id_estado={ticket.id_estado} />
              <span style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>● {p.label}</span>
              {esArchivado && (
                <span style={{ fontSize: 11, background: "#f3f4f6", color: "#6b7280", borderRadius: 6, padding: "2px 8px" }}>
                  Solo lectura
                </span>
              )}
            </div>
          </div>
          <button className="hd-modal__close" onClick={onClose}>
            <Ic n="close" size={15} color="white" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #eef0f6", padding: "0 20px", background: "#fff" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "12px 14px 10px", fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? "#5b8dee" : "#6b7fa3",
              borderBottom: tab === t.id ? "2px solid #5b8dee" : "2px solid transparent",
              marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
              transition: "color .15s",
            }}>
              <Ic n={t.icon} size={13} />
              {t.label}
              {t.badge > 0 && (
                <span style={{ fontSize: 10, background: tab === t.id ? "#5b8dee" : "#eef0f6", color: tab === t.id ? "#fff" : "#6b7fa3", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="hd-modal__body">

          {tab === "detalles" && (
            <>
              <div className="hd-info-grid">
                <div className="hd-field-row"><span className="hd-label">Área</span><span>{getArea(ticket.id_area)?.nombre_area || "—"}</span></div>
                <div className="hd-field-row"><span className="hd-label">Creado</span><span>{fmtDate(ticket.fecha_creacion)}</span></div>
                {(esCerrado || esArchivado) && (
                  <div className="hd-field-row"><span className="hd-label">Cerrado</span><span>{fmtDate(ticket.fecha_cierre)}</span></div>
                )}
              </div>

              <div className="hd-desc-box">
                <div className="hd-label" style={{ marginBottom: 8 }}>Descripción</div>
                <p>{ticket.descripcion}</p>
              </div>

              {/* Acciones — bloqueadas si está archivado */}
              {esArchivado ? (
                <div className="hd-closed-box" style={{ background: "#f3f4f6", borderColor: "#d1d5db", color: "#6b7280" }}>
                  🗄️ Ticket archivado — no se pueden realizar cambios
                </div>
              ) : (
                <div>
                  <div className="hd-section-lbl">Actualizar Estado</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ticket.id_estado !== 2 && (
                      <button className="hd-btn-outline amber" onClick={() => onCambiarEstado(ticket, 2, setTicket)}>
                        ⚙️ Marcar En Proceso
                      </button>
                    )}
                    {ticket.id_estado !== 3 && (
                      <button className="hd-btn-outline green" onClick={() => onCambiarEstado(ticket, 3, setTicket)}>
                        ✅ Cerrar Ticket
                      </button>
                    )}
                    {esCerrado && (
                      <div className="hd-closed-box">✅ Cerrado el {fmtDate(ticket.fecha_cierre)}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "adjuntos" && <TabAdjuntos ticket={ticket} />}

          {tab === "historial" && (
            <TabHistorial
              ticket={ticket}
              user={user}
              onComentarioEnviado={handleComentario}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// ─── TecnicoPanel ─────────────────────────────────────────────────────────────
export function TecnicoPanel({ user, tickets, setTickets, areas, toast }) {
  const mis = tickets.filter(t => t.id_tecnico === user.id_usuario);
  const [sel, setSel] = useState(null);
  const [filtro, setFiltro] = useState("activos"); // "activos" | "archivados"

  const getArea = (id) => areas.find(a => a.id_area === id) || null;

  const listaMostrada = mis.filter(t =>
    filtro === "archivados" ? t.id_estado === 4 : t.id_estado !== 4
  );

  const cambiar = async (t, estado, setTicketLocal) => {
    try {
      const upd = { ...t, id_estado: estado, fecha_cierre: estado === 3 ? new Date().toISOString() : null };

      const { error } = await supabase
        .from("tickets")
        .update({ id_estado: estado, fecha_cierre: upd.fecha_cierre })
        .eq("id_ticket", t.id_ticket);

      if (error) throw error;

      // Registrar en historial
      const label = estado === 2 ? "En Proceso" : estado === 3 ? "Cerrado" : "Abierto";
      await supabase.from("historial_ticket").insert([{
        id_ticket:  t.id_ticket,
        id_usuario: user.id_usuario,
        comentario: `Estado cambiado a: ${label}`,
      }]);

      setTickets(prev => prev.map(x => x.id_ticket === upd.id_ticket ? upd : x));
      if (setTicketLocal) setTicketLocal(upd);
      setSel(prev => prev?.id_ticket === upd.id_ticket ? upd : prev);
      toast("Estado actualizado", "success");
    } catch (error) {
      toast("Error al actualizar estado", "error");
    }
  };

  return (
    <div>
      <h2 className="hd-page-title">Panel Técnico</h2>
      <p className="hd-page-sub">Hola {user.nombre} — {mis.filter(t => t.id_estado !== 4).length} ticket(s) activo(s)</p>

      {/* Tabs activos / archivados */}
      <div className="hd-tabs" style={{ marginBottom: 14 }}>
        <button onClick={() => setFiltro("activos")} className={`hd-tab ${filtro === "activos" ? "active" : ""}`}>
          Activos ({mis.filter(t => t.id_estado !== 4).length})
        </button>
        <button onClick={() => setFiltro("archivados")} className={`hd-tab ${filtro === "archivados" ? "active" : ""}`}>
          Archivados ({mis.filter(t => t.id_estado === 4).length})
        </button>
      </div>

      <div className="hd-card">
        <table className="hd-table">
          <thead>
            <tr>{["#", "Título", "Área", "Prioridad", "Estado", "Fecha", ""].map(h => <th key={h} className="hd-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {listaMostrada.length === 0 && (
              <tr><td colSpan={7} className="hd-empty-row">
                {filtro === "archivados" ? "No tienes tickets archivados" : "No tienes tickets activos"}
              </td></tr>
            )}
            {listaMostrada.map(t => {
              const p = getPrioridad(t.id_prioridad);
              return (
                <TRow key={t.id_ticket} onClick={() => setSel(t)} selected={sel?.id_ticket === t.id_ticket}>
                  <td className="hd-td" style={{ color: "#6b7fa3", fontSize: 12 }}>#{t.id_ticket}</td>
                  <td className="hd-td" style={{ fontWeight: 500 }}>{t.titulo}</td>
                  <td className="hd-td" style={{ fontSize: 12 }}>{getArea(t.id_area)?.nombre_area}</td>
                  <td className="hd-td" style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>{p.label}</td>
                  <td className="hd-td"><Badge id_estado={t.id_estado} /></td>
                  <td className="hd-td" style={{ fontSize: 11, color: "#6b7fa3" }}>{fmtDate(t.fecha_creacion)}</td>
                  <td className="hd-td">
                    <button className="hd-btn-ghost" onClick={ev => { ev.stopPropagation(); setSel(t); }}>
                      <Ic n="eye" size={12} /> Ver
                    </button>
                  </td>
                </TRow>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {sel && (
        <TicketDetalleModal
          ticket={sel}
          user={user}
          areas={areas}
          onClose={() => setSel(null)}
          onCambiarEstado={cambiar}
        />
      )}
    </div>
  );
}