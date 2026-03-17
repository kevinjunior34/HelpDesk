import { useState, useEffect } from "react";
import { supabase } from './lib/supabase';
import { Login } from './components/auth/Login';
import { Layout } from './components/common/Layout';
import { Toast } from './components/common/Toast';
import { Dashboard } from './components/admin/Dashboard';
import { TicketList } from './components/admin/TicketList';
import { GestionUsuarios } from './components/admin/GestionUsuarios';
import { Archivados } from './components/admin/Archivados';
import { TecnicoPanel } from './components/tecnico/TecnicoPanel';
import { UserPanel } from './components/usuario/UserPanel';
import { TicketModal } from './components/admin/TicketModal';
import "./App.css";

export default function App() {
  const [user, setUser]       = useState(null);
  const [page, setPage]       = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [areas, setAreas]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [selTkt, setSelTkt]   = useState(null);
  const [toast, setToast]     = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [ticketsRes, areasRes, usuariosRes] = await Promise.all([
          supabase
            .from('tickets')
            .select(`
              *,
              historial: historial_ticket (
                id_historial,
                id_usuario,
                comentario,
                fecha
              )
            `)
            .order('fecha', { referencedTable: 'historial_ticket', ascending: true }),
          supabase.from('areas').select('*'),
          supabase.from('usuarios').select('*'),
        ]);

        if (ticketsRes.error)  throw ticketsRes.error;
        if (areasRes.error)    throw areasRes.error;
        if (usuariosRes.error) throw usuariosRes.error;

        setTickets(ticketsRes.data || []);
        setAreas(areasRes.data    || []);
        setUsers(usuariosRes.data || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const login = (u) => {
    setUser(u);
    setPage(u.rol === "ADMIN" ? "dashboard" : u.rol === "TECNICO" ? "asignados" : "mistickets");
  };

  const updateTicket = async (upd) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          id_estado:    upd.id_estado,
          id_tecnico:   upd.id_tecnico,
          fecha_cierre: upd.fecha_cierre,
        })
        .eq('id_ticket', upd.id_ticket);

      if (error) throw error;

      const { data: historialData, error: hErr } = await supabase
        .from('historial_ticket')
        .select('id_historial, id_usuario, comentario, fecha')
        .eq('id_ticket', upd.id_ticket)
        .order('fecha', { ascending: true });

      if (hErr) throw hErr;

      const ticketActualizado = { ...upd, historial: historialData || [] };

      setTickets(prev =>
        prev.map(t => t.id_ticket === upd.id_ticket ? ticketActualizado : t)
      );
      setSelTkt(ticketActualizado);
      showToast("Ticket actualizado", "success");
    } catch (error) {
      showToast("Error al actualizar ticket", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Cargando sistema...</div>
      </div>
    );
  }

  if (!user) return (
    <>
      <Login onLogin={login} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );

  const renderPage = () => {
    if (user.rol === "ADMIN") {
      if (page === "dashboard")  return <Dashboard tickets={tickets} areas={areas} usuarios={users} setPage={setPage} />;
      if (page === "tickets")    return <TicketList tickets={tickets} areas={areas} usuarios={users} setSelectedTicket={setSelTkt} />;
      if (page === "usuarios")   return <GestionUsuarios users={users} setUsers={setUsers} areas={areas} toast={showToast} />;
      if (page === "archivados") return <Archivados tickets={tickets} areas={areas} usuarios={users} setSelectedTicket={setSelTkt} />;
    }
    if (user.rol === "TECNICO") return <TecnicoPanel user={user} tickets={tickets} setTickets={setTickets} areas={areas} toast={showToast} />;
    return <UserPanel user={user} tickets={tickets} setTickets={setTickets} areas={areas} usuarios={users} toast={showToast} />;
};

  return (
    <>
      <Layout user={user} activePage={page} setPage={setPage} onLogout={() => { setUser(null); setPage("dashboard"); }}>
        {renderPage()}
      </Layout>
      {selTkt && (
        <TicketModal
          ticket={selTkt}
          onClose={() => setSelTkt(null)}
          onUpdate={updateTicket}
          users={users}
          areas={areas}
          currentUser={user}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}