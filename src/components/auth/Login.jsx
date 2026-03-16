import { useState } from "react";
import { Ic } from "../common/Ic";
import { supabase } from "../../lib/supabase";

export function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', form.email)
        .eq('password', form.password)
        .single();

      if (userError) throw new Error("Credenciales incorrectas");
      if (userData) onLogin(userData);
    } catch (err) {
      setError(err.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hd-login">
      <div className="hd-login__left">
        <div className="hd-login__orb1" />
        <div className="hd-login__orb2" />
        <div className="hd-login__content">
          <div className="hd-login__icon-box">
            <Ic n="home" size={30} color="white" />
          </div>
          <h1 className="hd-login__title">SISTEMA<br />HELP DESK</h1>
          <p className="hd-login__subtitle">Gestión de tickets de soporte técnico hospitalario</p>

          <div className="hd-login__stats">
            {[["24/5", "Soporte"], ["11", "Áreas"], ["4", "Prioridades"]].map(([n, l], i) => (
              <div key={i} className="hd-login__stat">
                <div className="hd-login__stat-n">{n}</div>
                <div className="hd-login__stat-l">{l}</div>
              </div>
            ))}
          </div>

          <div className="hd-login__demo">
            <p className="hd-login__demo-title">CUENTAS DEMO</p>
            <p>jose@gmail.com / admin123</p>
            <p>jhandel@gmail.com / tec123</p>
            <p>junior@gmail.com / usr123</p>
          </div>
        </div>
      </div>

      <div className="hd-login__right">
        <div className="hd-card hd-login__card">
          <div className="hd-login__card-header">
            <div className="hd-login__avatar">
              <Ic n="user" size={24} color="#1757c2" />
            </div>
            <h2>Bienvenido</h2>
            <p className="subtitle">Ingrese sus credenciales para acceder</p>
          </div>

          {error && (
            <div className="hd-login__error">
              <Ic n="alert" size={15} color="#b91c1c" /> {error}
            </div>
          )}

          <form className="hd-login__form" onSubmit={submit}>
            <div>
              <label className="hd-label">Correo electrónico</label>
              <input className="hd-input" type="email" placeholder="usuario@helpdesk.com" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="hd-label">Contraseña</label>
              <div className="hd-login__pwd-wrap">
                <input className="hd-input" style={{ paddingRight: 44 }} type={show ? "text" : "password"}
                  placeholder="••••••••" required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" className="hd-login__pwd-toggle" onClick={() => setShow(!show)}>
                  <Ic n="eye" size={15} />
                </button>
              </div>
            </div>
            <button type="submit" className="hd-btn-primary" disabled={loading}
              style={{ marginTop: 4, opacity: loading ? .7 : 1 }}>
              {loading ? "Verificando..." : "Iniciar Sesión →"}
            </button>
          </form>

          <p className="hd-login__footer">Sistema de Help Desk — Soporte Técnico</p>
        </div>
      </div>
    </div>
  );
}