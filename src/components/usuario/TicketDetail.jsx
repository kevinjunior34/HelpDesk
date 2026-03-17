import { useState, useEffect } from "react";
import { Ic } from "../common/Ic";
import { Badge } from "../common/Badge";
import { getPrioridad, fmtDate } from "../../utils/helpers";
import { supabase } from "../../lib/supabase";

// ─── Tab: Historial ───────────────────────────────────────────────────────────
function TabHistorial({ ticket, users = [] }) {  // 👈 Valor por defecto
  const historial = ticket?.historial ?? [];
  const getUser = (id) => users?.find(u => u?.id_usuario === id) || null;

  const esEstadoAuto = (c = "") => c?.toLowerCase().startsWith("estado cambiado");

  if (!historial || historial.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "40px 0", gap: 10, color: "#6b7fa3",
      }}>
        <Ic n="clock" size={32} style={{ opacity: .25 }} />
        <span style={{ fontSize: 13 }}>Sin entradas en el historial</span>
      </div>
    );
  }

  return (
    <ol style={{ listStyle: "none", margin: 0, padding: "4px 0 0", position: "relative" }}>
      <div style={{
        position: "absolute", left: 15, top: 12, bottom: 4,
        width: 2, background: "#eef0f6", borderRadius: 2,
      }} />
      {historial.map((entry, i) => {
        const esAuto  = esEstadoAuto(entry?.comentario);
        const icColor = esAuto ? "#f0a500" : "#5b8dee";
        const icName  = esAuto ? "refresh-cw" : "message-circle";
        const autor   = getUser(entry?.id_usuario);
        return (
          <li key={entry?.id_historial || i} style={{
            display: "flex", gap: 12,
            marginBottom: i < historial.length - 1 ? 18 : 0,
            position: "relative",
          }}>
            <div style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
              background: "#fff", border: `2px solid ${icColor}33`,
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
            }}>
              <Ic n={icName} size={13} style={{ color: icColor }} />
            </div>
            <div style={{
              flex: 1,
              background: esAuto ? "#fffbf0" : "#f8f9fd",
              border: `1px solid ${esAuto ? "#f0e8c8" : "#eef0f6"}`,
              borderRadius: 10, padding: "9px 13px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, color: "#0a0f1e", lineHeight: 1.45 }}>{entry?.comentario}</span>
                <span style={{ fontSize: 11, color: "#6b7fa3", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {fmtDate(entry?.fecha)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#6b7fa3", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                <Ic n="user" size={10} />
                {autor?.nombre ?? `Usuario #${entry?.id_usuario}`}
                {autor?.rol && autor.rol !== "USUARIO" && (
                  <span style={{ fontSize: 10, background: "#eef0f6", borderRadius: 4, padding: "1px 6px", color: "#5b8dee" }}>
                    {autor.rol === "TECNICO" ? "Técnico" : "Admin"}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Tab: Adjuntos ────────────────────────────────────────────────────────────
function TabAdjuntos({ ticket }) {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [preview,  setPreview]  = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (!ticket?.id_ticket) return;
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
          return { ...adj, url: urlData?.publicUrl };
        });
        setAdjuntos(conUrls);
      } catch (err) {
        console.error("Error cargando adjuntos:", err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [ticket?.id_ticket]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 13, color: "#6b7fa3" }}>Cargando imágenes…</div>
    </div>
  );

  if (!adjuntos || adjuntos.length === 0) return (
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
            <img src={adj.url} alt={adj.archivo} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
            <div style={{ padding: "6px 8px", fontSize: 10, color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adj.archivo?.split('/').pop() || "imagen"}
            </div>
          </div>
        ))}
      </div>
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(10,15,30,.88)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
            <img src={preview.url} alt={preview.archivo} style={{ maxWidth: "88vw", maxHeight: "80vh", borderRadius: 12, display: "block" }} />
            <div style={{ position: "absolute", bottom: -26, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{preview.archivo?.split('/').pop() || "imagen"}</div>
            <button onClick={() => setPreview(null)} style={{ position: "absolute", top: -12, right: -12, width: 28, height: 28, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}>
              <Ic n="x" size={13} style={{ color: "#0a0f1e" }} />
            </button>
            <a href={preview.url} download={preview.archivo} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ position: "absolute", top: -12, left: -12, width: 28, height: 28, borderRadius: "50%", background: "#5b8dee", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.25)", textDecoration: "none" }}>
              <Ic n="download" size={13} style={{ color: "#fff" }} />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// ─── TicketDetail (Versión Usuario) ──────────────────────────────────────────
export function TicketDetail({ ticket, onClose, users = [], areas = [], currentUser, onUpdate }) {
  const [tab, setTab] = useState("detalles");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!ticket) return null;  // 👈 Si no hay ticket, no renderizar

  const p = getPrioridad(ticket.id_prioridad);
  const getUser = (id) => users?.find(u => u?.id_usuario === id) || null;
  const getArea = (id) => areas?.find(a => a?.id_area === id) || null;
  const nHistorial = ticket.historial?.length ?? 0;
  const tecnicoAsignado = getUser(ticket.id_tecnico);

  const esCerrado = ticket.id_estado === 3;
  const esAbierto = ticket.id_estado === 1;

  // ── Enviar comentario ──────────────────────────────────────────────────────
  const enviarComentario = async () => {
    if (!comentario.trim() || esCerrado || !currentUser?.id_usuario) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase
        .from("historial_ticket")
        .insert([{
          id_ticket: ticket.id_ticket,
          id_usuario: currentUser.id_usuario,
          comentario: comentario.trim(),
        }])
        .select();

      if (error) throw error;

      // Actualizar historial local
      const nuevoHistorial = [...(ticket.historial ?? []), data[0]];
      onUpdate?.({ ...ticket, historial: nuevoHistorial });
      setComentario("");
    } catch (err) {
      console.error("Error al enviar comentario:", err.message);
    } finally {
      setEnviando(false);
    }
  };

  const TABS = [
    { id: "detalles", label: "Detalles", icon: "file-text" },
    { id: "adjuntos", label: "Adjuntos", icon: "image" },
    { id: "historial", label: "Historial", icon: "clock", badge: nHistorial },
  ];

  return (
    <div className="hd-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="hd-modal" style={{ maxWidth: 700 }}>

        {/* ── Header ── */}
        <div className="hd-modal__header">
          <div>
            <div className="hd-modal__id">TICKET #{ticket.id_ticket}</div>
            <h3 className="hd-modal__title">{ticket.titulo}</h3>
            <div className="hd-modal__meta" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge id_estado={ticket.id_estado} />
              <span style={{ fontSize: 12, color: p?.color, fontWeight: 700 }}>● {p?.label}</span>
            </div>
          </div>
          <button className="hd-modal__close" onClick={onClose}>
            <Ic n="x" size={18} color="white" />
          </button>
        </div>

        {/* ── Tabs ── */}
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
                <span style={{
                  fontSize: 10, background: tab === t.id ? "#5b8dee" : "#eef0f6",
                  color: tab === t.id ? "#fff" : "#6b7fa3",
                  borderRadius: 10, padding: "1px 6px", fontWeight: 700,
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="hd-modal__body" style={{ padding: 24 }}>

          {tab === "detalles" && (
            <>
              {/* Información básica */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(2, 1fr)", 
                gap: 16,
                background: "#f8f9fd",
                padding: 16,
                borderRadius: 12,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3", marginBottom: 4 }}>Usuario</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{getUser(ticket.id_usuario)?.nombre || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3", marginBottom: 4 }}>Área</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{getArea(ticket.id_area)?.nombre_area || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3", marginBottom: 4 }}>Fecha creación</div>
                  <div style={{ fontSize: 14 }}>{fmtDate(ticket.fecha_creacion)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3", marginBottom: 4 }}>Técnico asignado</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {tecnicoAsignado ? tecnicoAsignado.nombre : (
                      <span style={{ color: "#f97316" }}>Pendiente de asignación</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2a41", marginBottom: 8 }}>
                  Descripción
                </div>
                <div style={{ 
                  background: "#f8f9fd", 
                  padding: 16, 
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#374151"
                }}>
                  {ticket.descripcion}
                </div>
              </div>

              {/* Estado del ticket */}
              {esCerrado ? (
                <div style={{ 
                  background: "#f0fdf4", 
                  border: "1px solid #bbf7d0",
                  borderRadius: 8, 
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#166534"
                }}>
                  <Ic n="check-circle" size={18} style={{ color: "#22c55e" }} />
                  <span>Este ticket está cerrado. No se pueden agregar más comentarios.</span>
                </div>
              ) : (
                <>
                  {/* Estado actual */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: 8, 
                    padding: "8px 12px",
                    marginBottom: 20,
                    color: "#9a3412"
                  }}>
                    <Ic n="info" size={16} style={{ color: "#f97316" }} />
                    <span style={{ fontSize: 13 }}>
                      Estado actual: <strong>{esAbierto ? "Esperando asignación" : "En proceso"}</strong>
                    </span>
                  </div>

                  {/* Agregar comentario */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2a41", marginBottom: 12 }}>
                      Agregar Comentario
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        className="hd-textarea"
                        rows={3}
                        placeholder="Escribe un comentario sobre este ticket…"
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && e.ctrlKey) enviarComentario();
                        }}
                        style={{ 
                          resize: "vertical", 
                          minHeight: 72,
                          border: "1px solid #d1d5db",
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 13
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#b0bbd4" }}>Ctrl + Enter para enviar</span>
                        <button
                          className="hd-btn-primary"
                          onClick={enviarComentario}
                          disabled={!comentario.trim() || enviando}
                          style={{ 
                            opacity: !comentario.trim() || enviando ? .6 : 1, 
                            padding: "8px 20px",
                            background: "#5b8dee",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {enviando ? (
                            "Enviando…"
                          ) : (
                            <>
                              <Ic n="send" size={12} color="white" />
                              Enviar Comentario
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "adjuntos" && <TabAdjuntos ticket={ticket} />}
          {tab === "historial" && <TabHistorial ticket={ticket} users={users} />}

        </div>
      </div>
    </div>
  );
}