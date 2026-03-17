import { useState, useRef } from "react";
import { enviarAutoRespuesta } from "../../lib/autoRespuesta";
import { StatCard } from "../common/StatCard";
import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { Ic } from "../common/Ic";
import { getPrioridad, fmtDate } from "../../utils/helpers";
import { supabase } from "../../lib/supabase";

export function UserPanel({ user, tickets, setTickets, areas, usuarios, toast }) {
  const mis = tickets.filter(t => t.id_usuario === user.id_usuario);
  const [form, setForm] = useState({ titulo: "", descripcion: "", id_prioridad: "" });
  const [err, setErr] = useState({});
  const [tab, setTab] = useState("lista");

  // Image upload state
  const [imagenes, setImagenes] = useState([]); // Array of { file, preview, name }
  const [uploadingImgs, setUploadingImgs] = useState(false);
  const fileInputRef = useRef(null);

  const getArea = (id) => areas.find(a => a.id_area === id) || null;
  const getTecnico = (id) => usuarios.find(u => u.id_usuario === id) || null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const valid = [];
    const newErrs = [];

    files.forEach(file => {
      if (!allowed.includes(file.type)) {
        newErrs.push(`"${file.name}" no es una imagen válida (jpg, png, webp, gif).`);
      } else if (file.size > maxSize) {
        newErrs.push(`"${file.name}" supera el límite de 5MB.`);
      } else if (imagenes.length + valid.length >= 5) {
        newErrs.push("Máximo 5 imágenes por ticket.");
      } else {
        valid.push({
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        });
      }
    });

    if (newErrs.length) {
      setErr(prev => ({ ...prev, imagenes: newErrs.join(" ") }));
    } else {
      setErr(prev => { const e = { ...prev }; delete e.imagenes; return e; });
    }

    setImagenes(prev => [...prev, ...valid].slice(0, 5));
    // Reset input so same file can be re-added after removal
    e.target.value = "";
  };

  const removeImagen = (idx) => {
    setImagenes(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  const uploadImages = async (ticketId) => {
    if (imagenes.length === 0) return [];
    const urls = [];
    for (const img of imagenes) {
      const ext = img.file.name.split(".").pop();
      const path = `tickets/${ticketId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("adjuntos")
        .upload(path, img.file, { contentType: img.file.type, upsert: true });
      if (error) console.warn("Storage warning:", error.message);
      const { data: urlData } = supabase.storage
        .from("adjuntos")
        .getPublicUrl(path);
      urls.push(path);
    }
    return urls;
  };

  const crear = async () => {
    const e = {};
    if (form.titulo.trim().length < 5) e.titulo = "Mínimo 5 caracteres";
    if (form.descripcion.trim().length < 10) e.descripcion = "Mínimo 10 caracteres";
    if (!form.id_prioridad) e.id_prioridad = "Seleccione una prioridad";
    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    setUploadingImgs(true);
    try {
      // 1. Insert ticket first to get the ID
      const { data, error } = await supabase
        .from("tickets")
        .insert([
          {
            titulo: form.titulo,
            descripcion: form.descripcion,
            id_usuario: user.id_usuario,
            id_area: user.id_area,
            id_prioridad: Number(form.id_prioridad),
            id_estado: 1,
            fecha_creacion: new Date().toISOString(),
          },
        ])
        .select();
      if (error) console.warn("Storage warning:", error.message);

      const ticket = data[0];

      // 2. Upload images and save URLs
      const imageUrls = await uploadImages(ticket.id_ticket);

      // 3. If images exist, save URLs to adjuntos table (optional, adjust to your schema)
      if (imageUrls.length > 0) {
        const inserts = imageUrls.map(url => ({
          id_ticket: ticket.id_ticket,
          archivo: url,
        }));
        const { error: imgError } = await supabase
          .from("adjuntos")
          .insert(inserts);
        if (imgError) throw imgError;
      }

      setTickets(prev => [{ ...ticket, imagenes: imageUrls }, ...prev]);
      setForm({ titulo: "", descripcion: "", id_prioridad: "" });
      setImagenes([]);
      setErr({});
      toast("Ticket creado correctamente ✓", "success");
      setTab("lista");

      // Enviar respuesta automática en segundo plano
      const areaNombre = getArea(user.id_area)?.nombre_area || "General";
      enviarAutoRespuesta(ticket, areaNombre, (idTicket, nuevoEntry) => {
        setTickets(prev => prev.map(t =>
          t.id_ticket === idTicket
            ? { ...t, historial: [...(t.historial ?? []), nuevoEntry] }
            : t
        ));
      });
    } catch (error) {
      toast("Error al crear ticket: " + error.message, "error");
    } finally {
      setUploadingImgs(false);
    }
  };

  return (
    <div>
      <div className="hd-user-header">
        <div>
          <h2 className="hd-page-title">
            Hola, {user.nombre.split(" ")[0]} 👋
          </h2>
          <p className="hd-page-sub">
            Área: {getArea(user.id_area)?.nombre_area} · Rol: {user.rol}
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
        <StatCard emoji="📋" label="Total" value={mis.length} bg="#e8effe" />
        <StatCard emoji="🔴" label="Abiertos" value={mis.filter(t => t.id_estado === 1).length} bg="#fee2e2" />
        <StatCard emoji="✅" label="Cerrados" value={mis.filter(t => t.id_estado === 3).length} bg="#dcfce7" />
      </div>

      {tab === "nuevo" && (
        <div className="hd-card hd-ticket-form">
          <h3>Crear Nuevo Ticket</h3>
          <div className="hd-form-group">

            {/* Título */}
            <div>
              <label className="hd-label">Título</label>
              <input
                className={`hd-input${err.titulo ? " error" : ""}`}
                placeholder="Ej. Fallo en equipo de laboratorio"
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              />
              {err.titulo && <div className="hd-err">{err.titulo}</div>}
            </div>

            {/* Descripción */}
            <div>
              <label className="hd-label">Descripción</label>
              <textarea
                className={`hd-textarea${err.descripcion ? " error" : ""}`}
                rows={4}
                placeholder="Describe el problema con detalle..."
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              />
              {err.descripcion && <div className="hd-err">{err.descripcion}</div>}
            </div>

            {/* Prioridad */}
            <div>
              <label className="hd-label">Prioridad</label>
              <select
                className={`hd-select${err.id_prioridad ? " error" : ""}`}
                value={form.id_prioridad}
                onChange={e => setForm(p => ({ ...p, id_prioridad: e.target.value }))}
              >
                <option value="">Seleccione prioridad</option>
                <option value="1">Crítica</option>
                <option value="2">Alta</option>
                <option value="3">Media</option>
                <option value="4">Baja</option>
              </select>
              {err.id_prioridad && <div className="hd-err">{err.id_prioridad}</div>}
            </div>

            {/* ── Subir Imágenes ── */}
            <div>
              <label className="hd-label">
                Imágenes adjuntas{" "}
                <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
                  (opcional · máx. 5 · jpg/png/webp/gif · 5MB c/u)
                </span>
              </label>

              {/* Drop zone / click to upload */}
              <div
                className="hd-upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("hd-upload-zone--drag"); }}
                onDragLeave={e => e.currentTarget.classList.remove("hd-upload-zone--drag")}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("hd-upload-zone--drag");
                  const dt = { target: { files: e.dataTransfer.files, value: "" } };
                  handleFileChange(dt);
                }}
                style={{
                  border: "2px dashed #c7d2fe",
                  borderRadius: 10,
                  padding: "18px 24px",
                  textAlign: "center",
                  cursor: imagenes.length >= 5 ? "not-allowed" : "pointer",
                  background: "#f8f9ff",
                  color: "#6b7fa3",
                  fontSize: 13,
                  transition: "border-color 0.2s, background 0.2s",
                  opacity: imagenes.length >= 5 ? 0.5 : 1,
                  userSelect: "none",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🖼️</div>
                {imagenes.length >= 5
                  ? "Límite de 5 imágenes alcanzado"
                  : "Haz clic o arrastra imágenes aquí"}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
                disabled={imagenes.length >= 5}
              />

              {err.imagenes && <div className="hd-err">{err.imagenes}</div>}

              {/* Previews */}
              {imagenes.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                  {imagenes.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid #e0e7ff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={img.preview}
                        alt={img.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImagen(idx); }}
                        title="Quitar imagen"
                        style={{
                          position: "absolute",
                          top: 3,
                          right: 3,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                      {/* Filename tooltip */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "rgba(0,0,0,0.45)",
                          color: "#fff",
                          fontSize: 9,
                          padding: "2px 4px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                        title={img.name}
                      >
                        {img.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* ── Fin Imágenes ── */}

            <button
              className="hd-btn-primary"
              style={{ alignSelf: "flex-start" }}
              onClick={crear}
              disabled={uploadingImgs}
            >
              {uploadingImgs ? "Enviando…" : "Enviar Ticket →"}
            </button>
          </div>
        </div>
      )}

      {tab === "lista" && (
        <div className="hd-card">
          <div className="hd-card__header">
            <h3>Mis Tickets ({mis.length})</h3>
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
              {mis.length === 0 && (
                <tr>
                  <td colSpan={6} className="hd-empty-row">
                    No tienes tickets aún. ¡Crea uno nuevo!
                  </td>
                </tr>
              )}
              {mis.map(t => {
                const p = getPrioridad(t.id_prioridad);
                const tecnico = getTecnico(t.id_tecnico);
                return (
                  <TRow key={t.id_ticket}>
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
      )}
    </div>
  );
}