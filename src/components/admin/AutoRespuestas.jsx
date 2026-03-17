import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Ic } from "../common/Ic";

// ─── Modal: Crear / Editar ────────────────────────────────────────────────────
function RespuestaModal({ respuesta, areas, onClose, onSave }) {
  const esNueva = !respuesta;
  const [form, setForm] = useState({
    id_area:  respuesta?.id_area  ?? "",
    titulo:   respuesta?.titulo   ?? "",
    mensaje:  respuesta?.mensaje  ?? "",
    activa:   respuesta?.activa   ?? true,
  });
  const [err, setErr]     = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErr(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validar = () => {
    const e = {};
    if (!form.id_area)          e.id_area  = "Selecciona un área";
    if (!form.titulo.trim())    e.titulo   = "El título es obligatorio";
    if (!form.mensaje.trim())   e.mensaje  = "El mensaje es obligatorio";
    return e;
  };

  const guardar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErr(e); return; }
    setSaving(true);
    try {
      const payload = {
        id_area: Number(form.id_area),
        titulo:  form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        activa:  form.activa,
      };
      let data, error;
      if (esNueva) {
        ({ data, error } = await supabase.from("auto_respuestas").insert([payload]).select().single());
      } else {
        ({ data, error } = await supabase.from("auto_respuestas").update(payload).eq("id", respuesta.id).select().single());
      }
      if (error) throw error;
      onSave(data, esNueva);
    } catch (ex) {
      setErr({ global: ex.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hd-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="hd-modal" style={{ maxWidth: 560 }}>

        {/* Header */}
        <div className="hd-modal__header">
          <div>
            <div className="hd-modal__id">
              <Ic n="message-square" size={14} color="rgba(255,255,255,.7)" />
            </div>
            <h3 className="hd-modal__title">
              {esNueva ? "Nueva respuesta automática" : "Editar respuesta"}
            </h3>
          </div>
          <button className="hd-modal__close" onClick={onClose}>
            <Ic n="close" size={15} color="white" />
          </button>
        </div>

        {/* Body */}
        <div className="hd-modal__body" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

          {err.global && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#b91c1c" }}>
              {err.global}
            </div>
          )}

          {/* Área */}
          <div>
            <label className="hd-label">Área del ticket *</label>
            <select
              className={`hd-select${err.id_area ? " error" : ""}`}
              value={form.id_area}
              onChange={e => set("id_area", e.target.value)}
            >
              <option value="">— Seleccionar área —</option>
              {areas.map(a => (
                <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>
              ))}
            </select>
            {err.id_area && <p className="hd-err">{err.id_area}</p>}
            <p style={{ fontSize: 12, color: "#6b7fa3", marginTop: 5 }}>
              Esta respuesta se enviará automáticamente cuando se cree un ticket en esta área.
            </p>
          </div>

          {/* Título */}
          <div>
            <label className="hd-label">Título interno *</label>
            <input
              className={`hd-input${err.titulo ? " error" : ""}`}
              placeholder="Ej: Bienvenida — Área de Redes"
              value={form.titulo}
              onChange={e => set("titulo", e.target.value)}
              maxLength={120}
            />
            {err.titulo && <p className="hd-err">{err.titulo}</p>}
            <p style={{ fontSize: 12, color: "#6b7fa3", marginTop: 5 }}>
              Solo visible para el admin, ayuda a identificar la plantilla.
            </p>
          </div>

          {/* Mensaje */}
          <div>
            <label className="hd-label">Mensaje que verá el usuario *</label>
            <textarea
              className={`hd-textarea${err.mensaje ? " error" : ""}`}
              rows={6}
              placeholder="Ej: Hemos recibido tu ticket. Nuestro equipo de redes revisará el problema en un máximo de 4 horas hábiles..."
              value={form.mensaje}
              onChange={e => set("mensaje", e.target.value)}
              style={{ resize: "vertical", minHeight: 120 }}
            />
            {err.mensaje && <p className="hd-err">{err.mensaje}</p>}
            <p style={{ fontSize: 12, color: "#6b7fa3", marginTop: 5 }}>
              {form.mensaje.length} / 1000 caracteres
            </p>
          </div>

          {/* Activa */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#f8f9fd", borderRadius: 10, padding: "12px 16px",
            border: "1px solid #eef0f6",
          }}>
            <div
              onClick={() => set("activa", !form.activa)}
              style={{
                width: 42, height: 24, borderRadius: 12, cursor: "pointer",
                background: form.activa ? "#10b981" : "#d1d5db",
                position: "relative", transition: "background .2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: form.activa ? 20 : 3,
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0a0f1e" }}>
                {form.activa ? "Respuesta activa" : "Respuesta desactivada"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7fa3" }}>
                {form.activa
                  ? "Se enviará automáticamente al crear tickets en esta área"
                  : "No se enviará ninguna respuesta automática"}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
            <button className="hd-btn-outline" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="hd-btn-primary" onClick={guardar} disabled={saving}>
              {saving ? "Guardando…" : esNueva ? "Crear respuesta" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vista previa ─────────────────────────────────────────────────────────────
function PreviewModal({ respuesta, areas, onClose }) {
  const area = areas.find(a => a.id_area === respuesta.id_area);
  return (
    <div className="hd-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="hd-modal" style={{ maxWidth: 500 }}>
        <div className="hd-modal__header">
          <div>
            <div className="hd-modal__id"><Ic n="eye" size={14} color="rgba(255,255,255,.7)" /></div>
            <h3 className="hd-modal__title">Vista previa del mensaje</h3>
          </div>
          <button className="hd-modal__close" onClick={onClose}>
            <Ic n="close" size={15} color="white" />
          </button>
        </div>
        <div style={{ padding: "24px 28px" }}>
          <p style={{ fontSize: 12, color: "#6b7fa3", marginBottom: 12 }}>
            Así verá el usuario la respuesta en el historial del ticket:
          </p>
          <div style={{
            background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12,
            padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Ic n="zap" size={14} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1" }}>Respuesta automática</div>
                <div style={{ fontSize: 11, color: "#6b7fa3" }}>Área: {area?.nombre_area ?? "—"}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#0c4a6e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {respuesta.mensaje}
            </p>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button className="hd-btn-outline" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel Principal ──────────────────────────────────────────────────────────
export function AutoRespuestas({ areas, toast }) {
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | { tipo: "form"|"preview", data }
  const [buscador, setBuscador]     = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Cargar respuestas
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("auto_respuestas")
        .select("*")
        .order("id", { ascending: false });
      if (error) toast("Error al cargar respuestas: " + error.message, "error");
      else setRespuestas(data || []);
      setLoading(false);
    };
    cargar();
  }, []);

  const getArea = id => areas.find(a => a.id_area === id);

  // Guardar (crear o editar)
  const handleSave = (datos, esNueva) => {
    if (esNueva) {
      setRespuestas(prev => [datos, ...prev]);
      toast("Respuesta creada correctamente ✓", "success");
    } else {
      setRespuestas(prev => prev.map(r => r.id === datos.id ? datos : r));
      toast("Respuesta actualizada ✓", "success");
    }
    setModal(null);
  };

  // Cambiar estado activa/inactiva
  const toggleActiva = async (r) => {
    const { error } = await supabase
      .from("auto_respuestas")
      .update({ activa: !r.activa })
      .eq("id", r.id);
    if (error) { toast("Error al cambiar estado", "error"); return; }
    setRespuestas(prev => prev.map(x => x.id === r.id ? { ...x, activa: !x.activa } : x));
    toast(r.activa ? "Respuesta desactivada" : "Respuesta activada ✓", r.activa ? "info" : "success");
  };

  // Eliminar
  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta respuesta automática? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("auto_respuestas").delete().eq("id", id);
    if (error) toast("Error al eliminar: " + error.message, "error");
    else {
      setRespuestas(prev => prev.filter(r => r.id !== id));
      toast("Respuesta eliminada", "info");
    }
    setDeletingId(null);
  };

  // Filtro
  const filtradas = respuestas.filter(r => {
    const matchArea    = !filtroArea || r.id_area === Number(filtroArea);
    const matchBuscador = !buscador || r.titulo.toLowerCase().includes(buscador.toLowerCase());
    return matchArea && matchBuscador;
  });

  const activas   = respuestas.filter(r => r.activa).length;
  const inactivas = respuestas.length - activas;

  return (
    <div>
      {/* Título */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 className="hd-page-title">Respuestas Automáticas</h2>
          <p className="hd-page-sub">
            Gestiona las respuestas que se envían automáticamente al crear un ticket según el área
          </p>
        </div>
        <button className="hd-btn-primary" onClick={() => setModal({ tipo: "form", data: null })}>
          <Ic n="plus" size={14} color="white" /> Nueva respuesta
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Total",      value: respuestas.length, color: "#5b8dee", bg: "#eff6ff",  emoji: "📋" },
          { label: "Activas",    value: activas,            color: "#10b981", bg: "#ecfdf5",  emoji: "✅" },
          { label: "Inactivas",  value: inactivas,          color: "#f59e0b", bg: "#fffbeb",  emoji: "⏸️"  },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.color}22`,
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{ fontSize: 24 }}>{s.emoji}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7fa3", fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Ic n="search" size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7fa3" }} />
          <input
            className="hd-input"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por título…"
            value={buscador}
            onChange={e => setBuscador(e.target.value)}
          />
        </div>
        <select
          className="hd-select"
          style={{ width: 200 }}
          value={filtroArea}
          onChange={e => setFiltroArea(e.target.value)}
        >
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="hd-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7fa3" }}>Cargando respuestas…</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: 52, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 700, color: "#0a0f1e", marginBottom: 6 }}>
              {respuestas.length === 0 ? "No hay respuestas aún" : "Sin resultados"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7fa3", marginBottom: 18 }}>
              {respuestas.length === 0
                ? "Crea tu primera respuesta automática para comenzar"
                : "Prueba con otros filtros"}
            </div>
            {respuestas.length === 0 && (
              <button className="hd-btn-primary" onClick={() => setModal({ tipo: "form", data: null })}>
                <Ic n="plus" size={14} color="white" /> Crear primera respuesta
              </button>
            )}
          </div>
        ) : (
          <table className="hd-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                {["Área", "Título", "Vista previa", "Estado", "Acciones"].map(h => (
                  <th key={h} className="hd-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(r => {
                const area = getArea(r.id_area);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #eef0f6" }}>
                    {/* Área */}
                    <td className="hd-td">
                      <span style={{
                        background: "#eff6ff", color: "#1e4d8c",
                        border: "1px solid #bfdbfe", borderRadius: 6,
                        padding: "3px 10px", fontSize: 12, fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}>
                        {area?.nombre_area ?? `Área #${r.id_area}`}
                      </span>
                    </td>

                    {/* Título */}
                    <td className="hd-td" style={{ maxWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0a0f1e" }}>{r.titulo}</div>
                    </td>

                    {/* Vista previa del mensaje */}
                    <td className="hd-td" style={{ maxWidth: 280 }}>
                      <p style={{
                        fontSize: 12, color: "#6b7fa3", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>
                        {r.mensaje}
                      </p>
                    </td>

                    {/* Estado toggle */}
                    <td className="hd-td">
                      <div
                        onClick={() => toggleActiva(r)}
                        style={{
                          width: 42, height: 24, borderRadius: 12, cursor: "pointer",
                          background: r.activa ? "#10b981" : "#d1d5db",
                          position: "relative", transition: "background .2s", display: "inline-block",
                        }}
                        title={r.activa ? "Clic para desactivar" : "Clic para activar"}
                      >
                        <div style={{
                          position: "absolute", top: 3, left: r.activa ? 20 : 3,
                          width: 18, height: 18, borderRadius: "50%", background: "#fff",
                          transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                        }} />
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="hd-td">
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="hd-btn-ghost"
                          style={{ padding: "5px 10px", fontSize: 12 }}
                          onClick={() => setModal({ tipo: "preview", data: r })}
                          title="Ver mensaje completo"
                        >
                          <Ic n="eye" size={13} /> Ver
                        </button>
                        <button
                          className="hd-btn-ghost"
                          style={{ padding: "5px 10px", fontSize: 12 }}
                          onClick={() => setModal({ tipo: "form", data: r })}
                          title="Editar"
                        >
                          <Ic n="edit" size={13} /> Editar
                        </button>
                        <button
                          className="hd-btn-outline red"
                          style={{ padding: "5px 10px", fontSize: 12 }}
                          onClick={() => eliminar(r.id)}
                          disabled={deletingId === r.id}
                          title="Eliminar"
                        >
                          <Ic n="trash" size={13} /> {deletingId === r.id ? "…" : ""}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Aviso informativo */}
      {respuestas.length > 0 && (
        <div style={{
          marginTop: 16, background: "#f0f9ff", border: "1px solid #bae6fd",
          borderRadius: 10, padding: "12px 16px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Ic n="alert" size={15} style={{ color: "#0369a1", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#0369a1", margin: 0 }}>
            <strong>¿Cómo funciona?</strong> Cuando un usuario crea un ticket, el sistema busca la respuesta activa
            del área del ticket y la envía automáticamente al historial del ticket (visible para todos) y como mensaje
            directo al usuario. Si el área tiene más de una respuesta activa, se usa la más reciente.
          </p>
        </div>
      )}

      {/* Modales */}
      {modal?.tipo === "form" && (
        <RespuestaModal
          respuesta={modal.data}
          areas={areas}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.tipo === "preview" && (
        <PreviewModal
          respuesta={modal.data}
          areas={areas}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}