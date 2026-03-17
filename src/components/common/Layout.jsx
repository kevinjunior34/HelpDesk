import { Ic } from "./Ic";

export function Layout({ user, children, activePage, setPage, onLogout }) {
  const isAdmin = user.rol === "ADMIN";
  const isTec = user.rol === "TECNICO";
  
  const links = isAdmin
    ? [
        { id: "dashboard",       label: "Dashboard",        icon: "dashboard"       },
        { id: "tickets",         label: "Tickets",           icon: "ticket"          },
        { id: "usuarios",        label: "Usuarios",          icon: "users"           },
        { id: "archivados",      label: "Archivados",        icon: "archivados"      },
      ]
    : isTec
      ? [{ id: "asignados", label: "Mis Asignaciones", icon: "tool" }]
      : [
          { id: "mistickets", label: "Mis Tickets", icon: "ticket" },
          { id: "nuevo", label: "Nuevo Ticket", icon: "plus" }
        ];

  return (
    <div className="hd-layout">
      <aside className="hd-sidebar">
        <div className="hd-sidebar__logo">
          <div className="hd-sidebar__logo-icon">
            <Ic n="home" size={15} color="white" />
          </div>
          <span className="hd-sidebar__title">HELP DESK</span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <p className="hd-sidebar__section">
            {isAdmin ? "Administración" : isTec ? "Técnico" : "Usuario"}
          </p>
          {links.map(link => (
            <button key={link.id} onClick={() => setPage(link.id)}
              className={`hd-nav-btn ${activePage === link.id ? "active" : ""}`}>
              <Ic n={link.icon} size={15} color={activePage === link.id ? "#fff" : "rgba(255,255,255,.5)"} />
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hd-sidebar__footer">
          <div className="hd-sidebar__user">
            <div className="hd-sidebar__user-name">{user.nombre}</div>
            <div className="hd-sidebar__user-role">{user.rol}</div>
          </div>
          <button className="hd-logout-btn" onClick={onLogout}>
            <Ic n="logout" size={14} color="rgba(255,120,120,.7)" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="hd-main">{children}</main>
    </div>
  );
}