import { useState } from "react";
import { Ic } from "../common/Ic";
import { TRow } from "../common/TRow";
import { supabase } from "../../lib/supabase";

// ─── Modal de edición ─────────────────────────────────────────────────────────
function EditModal({ user, areas, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre:   user.nombre   || "",
    correo:   user.correo   || "",
    telefono: user.telefono || "",
    rol:      user.rol      || "",
    id_area:  user.id_area  || "",
  });
  const [err,     setErr]     = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.correo.includes("@")) e.correo = "Correo inválido";
    if (!/^9[0-9]{8}$/.test(form.telefono)) e.telefono = "Debe empezar con 9, 9 dígitos";
    if (!form.rol) e.rol = "Requerido";
    if (!form.id_area) e.id_area = "Requerido";
    return e;
  };

  const guardar = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErr(e); return; }
    setLoading(true);
    await onSave(user.id_usuario, {
      nombre:   form.nombre,
      correo:   form.correo,
      telefono: form.telefono,
      rol:      form.rol,
      id_area:  Number(form.id_area),
    });
    setLoading(false);
  };

  const Field = ({ k, label, type = "text", ph, max }) => (
    <div>
      <label className="hd-label">{label}</label>
      <input
        className={`hd-input${err[k] ? " error" : ""}`}
        type={type} placeholder={ph} maxLength={max}
        value={form[k]} onChange={e => set(k, e.target.value)}
      />
      {err[k] && <div className="hd-err">{err[k]}</div>}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(10,15,30,.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 64px rgba(10,15,30,.18)", overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid #eef0f6",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic n="edit-2" size={15} style={{ color: "#5b8dee" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0a0f1e" }}>Editar usuario</div>
            <div style={{ fontSize: 12, color: "#6b7fa3" }}>#{user.id_usuario} · {user.nombre}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, borderRadius: 8, color: "#6b7fa3", display: "flex",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Ic n="x" size={15} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field k="nombre"   label="Nombre completo" ph="Ana Torres" />
          <Field k="correo"   label="Correo"          ph="ana@hospital.com" type="email" />
          <Field k="telefono" label="Teléfono"        ph="9XXXXXXXX" max={9} />

          <div>
            <label className="hd-label">Rol</label>
            <select
              className={`hd-select${err.rol ? " error" : ""}`}
              value={form.rol} onChange={e => set("rol", e.target.value)}
            >
              <option value="">Seleccionar rol</option>
              {["ADMIN","TECNICO","MEDICO","ENFERMERO","ADMINISTRATIVO",
                "RADIOLOGO","LABORATORISTA","FARMACEUTICO","NUTRICIONISTA",
                "PSICOLOGO","FISIOTERAPEUTA","ODONTOLOGO","CIRUJANO",
                "ANESTESIOLOGO","GINECOLOGO","PEDIATRA","CARDIOLOGO",
                "TRABAJADOR_SOCIAL","SEGURIDAD","LIMPIEZA","COCINA","RECEPCIONISTA",
              ].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {err.rol && <div className="hd-err">{err.rol}</div>}
          </div>

          <div>
            <label className="hd-label">Área</label>
            <select
              className={`hd-select${err.id_area ? " error" : ""}`}
              value={form.id_area} onChange={e => set("id_area", e.target.value)}
            >
              <option value="">Seleccionar área</option>
              {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>)}
            </select>
            {err.id_area && <div className="hd-err">{err.id_area}</div>}
          </div>
        </div>

        {/* footer */}
        <div style={{
          padding: "14px 22px", borderTop: "1px solid #eef0f6",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button
            className="hd-btn-ghost"
            onClick={onClose}
            style={{ padding: "8px 16px" }}
          >
            Cancelar
          </button>
          <button
            className="hd-btn-primary"
            onClick={guardar}
            disabled={loading}
            style={{ padding: "8px 18px", opacity: loading ? .7 : 1 }}
          >
            {loading ? "Guardando…" : <><Ic n="check" size={13} color="white" /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GestionUsuarios ──────────────────────────────────────────────────────────
export function GestionUsuarios({ users, setUsers, areas, toast }) {
  const [form, setForm] = useState({
    nombre: "", correo: "", telefono: "", rol: "", id_area: "", password: "",
  });
  const [err,        setErr]        = useState({});
  const [editUser,   setEditUser]   = useState(null); // usuario que se está editando

  const getArea = (id) => areas.find(a => a.id_area === id) || null;

  // ── Validación formulario crear ──
  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.correo.includes("@")) e.correo = "Correo inválido";
    if (!/^9[0-9]{8}$/.test(form.telefono)) e.telefono = "Debe empezar con 9, 9 dígitos";
    if (!form.rol) e.rol = "Requerido";
    if (!form.id_area) e.id_area = "Requerido";
    if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    return e;
  };

  // ── Crear ──
  const crear = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErr(e); return; }
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .insert([{
          nombre:   form.nombre,
          correo:   form.correo,
          telefono: form.telefono,
          rol:      form.rol,
          id_area:  Number(form.id_area),
          password: form.password,
          estado:   "ACTIVO",
        }])
        .select();
      if (error) throw error;
      setUsers(prev => [...prev, data[0]]);
      setForm({ nombre: "", correo: "", telefono: "", rol: "", id_area: "", password: "" });
      setErr({});
      toast("Usuario creado correctamente", "success");
    } catch (error) {
      toast("Error al crear usuario: " + error.message, "error");
    }
  };

  // ── Editar (llamado desde EditModal) ──
  const guardarEdicion = async (id, campos) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update(campos)
        .eq("id_usuario", id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id_usuario === id ? { ...u, ...campos } : u));
      setEditUser(null);
      toast("Usuario actualizado correctamente", "success");
    } catch (error) {
      toast("Error al actualizar usuario: " + error.message, "error");
    }
  };

  // ── Toggle estado ──
  const toggleEstado = async (userId, currentEstado) => {
    const nuevoEstado = currentEstado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ estado: nuevoEstado })
        .eq("id_usuario", userId);
      if (error) throw error;
      setUsers(prev => prev.map(x =>
        x.id_usuario === userId ? { ...x, estado: nuevoEstado } : x
      ));
      toast(`Usuario ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"}`, "success");
    } catch (error) {
      toast("Error al actualizar estado", "error");
    }
  };

  const rolCls = (r) => r === "ADMIN" ? "admin" : r === "TECNICO" ? "tecnico" : "other";

  return (
    <div>
      <h2 className="hd-page-title">Gestión de Usuarios</h2>
      <p className="hd-page-sub">{users.length} usuarios en el sistema</p>

      <div className="hd-users-grid">
        {/* ── Tabla ── */}
        <div className="hd-card">
          <table className="hd-table">
            <thead>
              <tr>
                {["#", "Nombre", "Correo", "Rol", "Área", "Estado", "Acciones"].map(h => (
                  <th key={h} className="hd-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <TRow key={u.id_usuario}>
                  <td className="hd-td" style={{ color: "#6b7fa3", fontSize: 12 }}>{u.id_usuario}</td>
                  <td className="hd-td" style={{ fontWeight: 500 }}>{u.nombre}</td>
                  <td className="hd-td" style={{ fontSize: 12, color: "#6b7fa3" }}>{u.correo}</td>
                  <td className="hd-td">
                    <span className={`hd-role-badge ${rolCls(u.rol)}`}>{u.rol}</span>
                  </td>
                  <td className="hd-td" style={{ fontSize: 12 }}>
                    {getArea(u.id_area)?.nombre_area || "—"}
                  </td>
                  <td className="hd-td">
                    <span className={`hd-status-badge ${u.estado !== "INACTIVO" ? "activo" : "inactivo"}`}>
                      {u.estado !== "INACTIVO" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="hd-td">
                    <div style={{ display: "flex", gap: 4 }}>
                      {/* Editar ← nuevo */}
                      <button
                        className="hd-btn-ghost"
                        onClick={() => setEditUser(u)}
                        title="Editar usuario"
                      >
                        <Ic n="edit-2" size={12} /> Editar
                      </button>
                      {/* Toggle estado */}
                      <button
                        className="hd-btn-ghost"
                        onClick={() => toggleEstado(u.id_usuario, u.estado)}
                      >
                        {u.estado !== "INACTIVO" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Formulario crear ── */}
        <div className="hd-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Crear Nuevo Usuario</h3>
          <div className="hd-flex-col">
            {[
              { k: "nombre",   l: "Nombre completo", t: "text",     ph: "Ana Torres" },
              { k: "correo",   l: "Correo",          t: "email",    ph: "ana@hospital.com" },
              { k: "telefono", l: "Teléfono",        t: "text",     ph: "9XXXXXXXX", max: 9 },
              { k: "password", l: "Contraseña",      t: "password", ph: "Mínimo 8 caracteres" },
            ].map(f => (
              <div key={f.k}>
                <label className="hd-label">{f.l}</label>
                <input
                  className={`hd-input${err[f.k] ? " error" : ""}`}
                  type={f.t} placeholder={f.ph} maxLength={f.max}
                  value={form[f.k]}
                  onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                />
                {err[f.k] && <div className="hd-err">{err[f.k]}</div>}
              </div>
            ))}
            <div>
              <label className="hd-label">Rol</label>
              <select
                className={`hd-select${err.rol ? " error" : ""}`}
                value={form.rol}
                onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
              >
                <option value="">Seleccionar rol</option>
                {["ADMIN","TECNICO","MEDICO","ENFERMERO","ADMINISTRATIVO"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {err.rol && <div className="hd-err">{err.rol}</div>}
            </div>
            <div>
              <label className="hd-label">Área</label>
              <select
                className={`hd-select${err.id_area ? " error" : ""}`}
                value={form.id_area}
                onChange={e => setForm(p => ({ ...p, id_area: e.target.value }))}
              >
                <option value="">Seleccionar área</option>
                {areas.map(a => (
                  <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>
                ))}
              </select>
              {err.id_area && <div className="hd-err">{err.id_area}</div>}
            </div>
            <button className="hd-btn-primary" style={{ marginTop: 4 }} onClick={crear}>
              <Ic n="plus" size={15} color="white" /> Crear Usuario
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal de edición ── */}
      {editUser && (
        <EditModal
          user={editUser}
          areas={areas}
          onClose={() => setEditUser(null)}
          onSave={guardarEdicion}
        />
      )}
    </div>
  );
}