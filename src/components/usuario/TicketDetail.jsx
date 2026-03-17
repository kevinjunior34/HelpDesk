import { useState, useEffect } from "react";
import { Ic } from "../common/Ic";
import { Badge } from "../common/Badge";
import { getEstado, getPrioridad, fmtDate } from "../../utils/helpers";
import { supabase } from "../../lib/supabase";
import { botHospital } from "../../lib/botHospital";

function TabHistorial({ ticket, users = [] }) {
  const historial = ticket?.historial ?? [];
  const getUser = (id) => users?.find(u => u?.id_usuario === id) || null;

  if (!historial || historial.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#6b7fa3" }}>
        <Ic n="clock" size={32} style={{ opacity: 0.25 }} />
        <p>Sin entradas en el historial</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {historial.map((entry, idx) => {
        const autor = getUser(entry.id_usuario);
        const esBot = entry.id_usuario === null;
        
        return (
          <div key={entry.id_historial || idx} style={{
            padding: 12,
            background: esBot ? "#f0f7ff" : "#f8f9fd",
            borderRadius: 8,
            borderLeft: esBot ? "4px solid #5b8dee" : "4px solid #e5e7eb"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: esBot ? "#5b8dee" : "#374151" }}>
                {esBot ? "🤖 Asistente Virtual" : autor?.nombre || "Usuario"}
              </span>
              <span style={{ fontSize: 11, color: "#6b7fa3" }}>
                {fmtDate(entry.fecha)}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {entry.comentario}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function TabAdjuntos({ ticket }) {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (!ticket?.id_ticket) return;
      
      try {
        const { data, error } = await supabase
          .from("adjuntos")
          .select("id_adjunto, archivo")
          .eq("id_ticket", ticket.id_ticket);

        if (error) throw error;
        
        const conUrls = (data || []).map(adj => ({
          ...adj,
          url: supabase.storage.from("adjuntos").getPublicUrl(adj.archivo).data.publicUrl
        }));
        
        setAdjuntos(conUrls);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    cargar();
  }, [ticket?.id_ticket]);

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Cargando...</div>;
  
  if (adjuntos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#6b7fa3" }}>
        <Ic n="image" size={32} style={{ opacity: 0.25 }} />
        <p>Sin imágenes adjuntas</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {adjuntos.map(adj => (
          <div key={adj.id_adjunto} onClick={() => setPreview(adj)} style={{
            cursor: "pointer",
            border: "1px solid #eef0f6",
            borderRadius: 8,
            overflow: "hidden"
          }}>
            <img src={adj.url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
            <div style={{ padding: 6, fontSize: 11, color: "#6b7fa3" }}>
              {adj.archivo.split('/').pop()}
            </div>
          </div>
        ))}
      </div>
      
      {preview && (
        <div onClick={() => setPreview(null)} style={{
          position: "fixed", inset: 0, zIndex: 1200,
          background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <img src={preview.url} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh" }} />
        </div>
      )}
    </>
  );
}

export function TicketDetail({ ticket, onClose, users = [], areas = [], currentUser, onUpdate, toast }) {
  const [tab, setTab] = useState("detalles");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [botSession, setBotSession] = useState(null);
  const [esperandoBot, setEsperandoBot] = useState(false);

  if (!ticket) return null;

  const prioridad = getPrioridad(ticket.id_prioridad);
  const getUser = (id) => users?.find(u => u?.id_usuario === id) || null;
  const getArea = (id) => areas?.find(a => a?.id_area === id) || null;
  const nHistorial = ticket.historial?.length ?? 0;
  const tecnicoAsignado = getUser(ticket.id_tecnico);
  const esCerrado = ticket.id_estado === 3;

  const iniciarBot = async () => {
    setEsperandoBot(true);
    try {
      const session = botHospital.getSesion(
        ticket.id_ticket,
        ticket.titulo,
        currentUser?.id_usuario
      );
      setBotSession(session);
      
      const mensajeInicial = await session.iniciar();
      
      const nuevoHistorial = [...(ticket.historial ?? []), {
        id_historial: Date.now(),
        id_usuario: null,
        comentario: mensajeInicial,
        fecha: new Date().toISOString()
      }];
      
      onUpdate?.({ ...ticket, historial: nuevoHistorial });
    } catch (error) {
      console.error("Error:", error);
      toast?.("Error al iniciar el asistente", "error");
    } finally {
      setEsperandoBot(false);
    }
  };

  const enviarComentario = async () => {
    if (!comentario.trim() || esCerrado || !currentUser?.id_usuario) return;
    
    // Guardar mensaje del usuario temporalmente
    const mensajeUsuario = comentario.trim();
    setComentario(""); // Limpiar inmediatamente
    
    setEnviando(true);
    
    try {
      // Si el bot está activo, procesar con él
      if (botSession?.estaActivo()) {
        // 1. Guardar mensaje del usuario en el historial
        const mensajeUsuarioObj = {
          id_historial: Date.now(),
          id_usuario: currentUser.id_usuario,
          comentario: mensajeUsuario,
          fecha: new Date().toISOString()
        };
        
        const historialConUsuario = [...(ticket.historial ?? []), mensajeUsuarioObj];
        onUpdate?.({ ...ticket, historial: historialConUsuario });
        
        // 2. Procesar con el bot (esto puede tomar tiempo)
        setEsperandoBot(true);
        const respuestaBot = await botSession.procesarMensaje(mensajeUsuario);
        
        // 3. Guardar respuesta del bot
        const respuestaBotObj = {
          id_historial: Date.now() + 1,
          id_usuario: null,
          comentario: respuestaBot,
          fecha: new Date().toISOString()
        };
        
        const historialFinal = [...historialConUsuario, respuestaBotObj];
        onUpdate?.({ ...ticket, historial: historialFinal });
        
        // 4. Verificar si el bot se desactivó (resuelto o escalado)
        const estadoBot = botSession.getEstado();
        if (!estadoBot.activo) {
          if (estadoBot.resuelto) {
            toast?.("✅ Problema resuelto por el asistente", "success");
          } else if (estadoBot.escalado) {
            toast?.("👨‍🔧 Se ha asignado un técnico", "info");
          }
        }
      } else {
        // Si no hay bot activo, solo guardar el mensaje normal
        const { data, error } = await supabase
          .from("historial_ticket")
          .insert([{
            id_ticket: ticket.id_ticket,
            id_usuario: currentUser.id_usuario,
            comentario: mensajeUsuario,
            fecha: new Date().toISOString()
          }])
          .select();

        if (error) throw error;

        const nuevoHistorial = [...(ticket.historial ?? []), data[0]];
        onUpdate?.({ ...ticket, historial: nuevoHistorial });
      }
    } catch (err) {
      console.error("Error:", err);
      toast?.("Error al enviar mensaje", "error");
      // Restaurar el mensaje en caso de error
      setComentario(mensajeUsuario);
    } finally {
      setEnviando(false);
      setEsperandoBot(false);
    }
  };

  const tabs = [
    { id: "detalles", label: "Detalles", icon: "file-text" },
    { id: "adjuntos", label: "Adjuntos", icon: "image" },
    { id: "historial", label: "Historial", icon: "clock", badge: nHistorial }
  ];

  return (
    <div className="hd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hd-modal" style={{ maxWidth: 700, maxHeight: "90vh", overflow: "auto" }}>
        
        <div className="hd-modal__header" style={{
          padding: 20,
          borderBottom: "1px solid #eef0f6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7fa3", marginBottom: 4 }}>
              TICKET #{ticket.id_ticket}
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>{ticket.titulo}</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <Badge id_estado={ticket.id_estado} />
              <span style={{ fontSize: 12, color: prioridad?.color, fontWeight: 600 }}>
                ● {prioridad?.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "#f3f4f6",
            border: "none",
            width: 32,
            height: 32,
            borderRadius: 16,
            cursor: "pointer",
            fontSize: 16
          }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #eef0f6", padding: "0 20px" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #5b8dee" : "none",
                color: tab === t.id ? "#5b8dee" : "#6b7fa3",
                fontWeight: tab === t.id ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Ic n={t.icon} size={14} />
              {t.label}
              {t.badge > 0 && (
                <span style={{
                  background: tab === t.id ? "#5b8dee" : "#eef0f6",
                  color: tab === t.id ? "#fff" : "#6b7fa3",
                  padding: "2px 6px",
                  borderRadius: 10,
                  fontSize: 10
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === "detalles" && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
                background: "#f8f9fd",
                padding: 16,
                borderRadius: 8,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3" }}>Usuario</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {getUser(ticket.id_usuario)?.nombre || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3" }}>Área</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {getArea(ticket.id_area)?.nombre_area || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3" }}>Fecha creación</div>
                  <div style={{ fontSize: 14 }}>{fmtDate(ticket.fecha_creacion)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7fa3" }}>Técnico asignado</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {tecnicoAsignado ? tecnicoAsignado.nombre : (
                      <span style={{ color: "#f97316" }}>Pendiente</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Descripción</div>
                <div style={{
                  background: "#f8f9fd",
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6
                }}>
                  {ticket.descripcion}
                </div>
              </div>

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
                  <span>✅ Ticket cerrado</span>
                </div>
              ) : (
                <>
                  {(!botSession || !botSession.estaActivo()) && (
                    <div style={{
                      marginTop: 20,
                      padding: 16,
                      background: "#e8f0fe",
                      borderRadius: 8,
                      border: "1px solid #5b8dee33"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <Ic n="bot" size={24} style={{ color: "#5b8dee" }} />
                        <div>
                          <strong>¿Necesitas ayuda con este problema?</strong>
                          <p style={{ fontSize: 12, color: "#6b7fa3", margin: "4px 0 0" }}>
                            El asistente virtual te guiará para resolverlo
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={iniciarBot}
                        disabled={esperandoBot}
                        style={{
                          background: "#5b8dee",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: esperandoBot ? 0.6 : 1
                        }}
                      >
                        {esperandoBot ? "Iniciando..." : "Iniciar asistente virtual"}
                      </button>
                    </div>
                  )}

                  {botSession?.estaActivo() && (
                    <div style={{
                      marginTop: 16,
                      padding: 12,
                      background: "#f0f7ff",
                      borderRadius: 8,
                      borderLeft: "4px solid #5b8dee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Ic n="message-circle" size={16} style={{ color: "#5b8dee" }} />
                        <span style={{ fontSize: 13 }}>
                          Asistente activo - Intento {botSession.intentos + 1}/3
                        </span>
                      </div>
                      {esperandoBot && <span style={{ fontSize: 11, color: "#6b7fa3" }}>Escribiendo...</span>}
                    </div>
                  )}

                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                      Agregar comentario
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        rows={3}
                        placeholder="Escribe tu mensaje..."
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            e.preventDefault();
                            enviarComentario();
                          }
                        }}
                        disabled={enviando || esperandoBot}
                        style={{
                          width: "100%",
                          padding: 10,
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          resize: "vertical",
                          opacity: enviando || esperandoBot ? 0.6 : 1
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#b0bbd4" }}>
                          Ctrl + Enter para enviar
                        </span>
                        <button
                          onClick={enviarComentario}
                          disabled={!comentario.trim() || enviando || esperandoBot}
                          style={{
                            background: "#5b8dee",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 16px",
                            fontSize: 13,
                            cursor: "pointer",
                            opacity: !comentario.trim() || enviando || esperandoBot ? 0.6 : 1
                          }}
                        >
                          {enviando ? "Enviando..." : "Enviar"}
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