import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { StatCard } from "../common/StatCard";
import { TRow } from "../common/TRow";
import { Badge } from "../common/Badge";
import { Ic } from "../common/Ic";
import { getPrioridad, fmtDate } from "../../utils/helpers";
import { enviarCorreoTicket } from "../../lib/email";

export function UserPanel({ user, tickets, setTickets, areas, usuarios, toast }) {
  const mis = tickets.filter(t => t.id_usuario === user.id_usuario);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    id_prioridad: ""
  });
  const [imagen, setImagen] = useState(null);
  const [err, setErr] = useState({});
  const [tab, setTab] = useState("lista");
  const getArea = (id) => areas.find(a => a.id_area === id) || null;
  const getTecnico = (id) => usuarios.find(u => u.id_usuario === id) || null;
  const handleImagen = (e) => {
    if (e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
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
    try {
      let imagenUrl = null;
      // 📷 subir imagen si existe
      if (imagen) {
        const fileName = Date.now() + "_" + imagen.name;
        const { error: uploadError } = await supabase.storage
          .from("adjuntos")
          .upload(fileName, imagen);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage
          .from("adjuntos")
          .getPublicUrl(fileName);
        imagenUrl = data.publicUrl;
      }
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
            imagen_url: imagenUrl,
            fecha_creacion: new Date().toISOString()
          }
        ])
        .select();
      if (error) throw error;
      const nuevoTicket = data[0];
      setTickets(prev => [nuevoTicket, ...prev]);
      // 📧 enviar correo
      await enviarCorreoTicket({
        usuario: user.nombre,
        titulo: form.titulo,
        descripcion: form.descripcion,
        prioridad: getPrioridad(form.id_prioridad).label,
        imagen: imagenUrl
      });
      setForm({
        titulo: "",
        descripcion: "",
        id_prioridad: ""
      });
      setImagen(null);
      setErr({});
      toast("Ticket creado correctamente ✓", "success");
      setTab("lista");
    } catch (error) {
      toast("Error al crear ticket: " + error.message, "error");
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
          {tab === "nuevo"
            ? "← Mis Tickets"
            : <>
                <Ic n="plus" size={15} color="white" /> Nuevo Ticket
              </>
          }
        </button>
      </div>
      <div className="hd-user-stats">
        <StatCard emoji="📋" label="Total" value={mis.length} bg="#e8effe" />
        <StatCard
          emoji="🔴"
          label="Abiertos"
          value={mis.filter(t => t.id_estado === 1).length}
          bg="#fee2e2"
        />
        <StatCard
          emoji="✅"
          label="Cerrados"
          value={mis.filter(t => t.id_estado === 3).length}
          bg="#dcfce7"
        />
      </div>
      {tab === "nuevo" && (
        <div className="hd-card hd-ticket-form">
          <h3>Crear Nuevo Ticket</h3>
          <div className="hd-form-group">
            <div>
              <label className="hd-label">Título</label>
              <input
                className={`hd-input${err.titulo ? " error" : ""}`}
                value={form.titulo}
                onChange={e =>
                  setForm(p => ({ ...p, titulo: e.target.value }))
                }
              />
              {err.titulo && <div className="hd-err">{err.titulo}</div>}
            </div>
            <div>
              <label className="hd-label">Descripción</label>
              <textarea
                className={`hd-textarea${err.descripcion ? " error" : ""}`}
                rows={4}
                value={form.descripcion}
                onChange={e =>
                  setForm(p => ({ ...p, descripcion: e.target.value }))
                }
              />
              {err.descripcion && <div className="hd-err">{err.descripcion}</div>}
            </div>
            <div>
              <label className="hd-label">Prioridad</label>
              <select
                className={`hd-select${err.id_prioridad ? " error" : ""}`}
                value={form.id_prioridad}
                onChange={e =>
                  setForm(p => ({ ...p, id_prioridad: e.target.value }))
                }
              >
                <option value="">Seleccione prioridad</option>
                <option value="1">Crítica</option>
                <option value="2">Alta</option>
                <option value="3">Media</option>
                <option value="4">Baja</option>
              </select>
              {err.id_prioridad && <div className="hd-err">{err.id_prioridad}</div>}
            </div>
            {/* 📷 subir imagen */}
            <div>
              <label className="hd-label">Adjuntar imagen (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
              />
            </div>
            <button
              className="hd-btn-primary"
              style={{ alignSelf: "flex-start" }}
              onClick={crear}
            >
              Enviar Ticket →
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
                {["#", "Título", "Prioridad", "Estado", "Técnico", "Fecha"].map(h =>
                  <th key={h} className="hd-th">{h}</th>
                )}
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
                    <td className="hd-td">#{t.id_ticket}</td>
                    <td className="hd-td">
                      {t.titulo}
                      {t.imagen_url && (
                        <div style={{ marginTop: 6 }}>
                          <img
                            src={t.imagen_url}
                            alt="ticket"
                            style={{ width: 60, borderRadius: 6 }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="hd-td" style={{ color: p.color }}>
                      {p.label}
                    </td>
                    <td className="hd-td">
                      <Badge id_estado={t.id_estado} />
                    </td>
                    <td className="hd-td">
                      {tecnico ? tecnico.nombre : "Sin asignar"}
                    </td>
                    <td className="hd-td">
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