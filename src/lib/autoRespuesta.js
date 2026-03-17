import { supabase } from "./supabase";
import training from "./training.json";

// 1. ASIGNACION AUTOMATICA DE TECNICO

export async function asignarTecnicoAutomatico(ticket, onTecnicoAsignado) {
  try {
    const { data: tecnicos, error: errTec } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre")
      .eq("rol", "TECNICO")
      .eq("estado", "ACTIVO");

    if (errTec) throw errTec;
    if (!tecnicos || tecnicos.length === 0) {
      console.warn("[AutoAsignar] No hay tecnicos activos.");
      return;
    }

    const { data: ticketsActivos, error: errTkts } = await supabase
      .from("tickets")
      .select("id_tecnico")
      .in("id_estado", [1, 2])
      .not("id_tecnico", "is", null);

    if (errTkts) throw errTkts;

    const carga = {};
    tecnicos.forEach(t => { carga[t.id_usuario] = 0; });
    (ticketsActivos || []).forEach(t => {
      if (carga[t.id_tecnico] !== undefined) carga[t.id_tecnico]++;
    });

    const elegido = tecnicos.reduce((min, t) =>
      carga[t.id_usuario] < carga[min.id_usuario] ? t : min
    );

    const { error: errUpd } = await supabase
      .from("tickets")
      .update({ id_tecnico: elegido.id_usuario, id_estado: 2 })
      .eq("id_ticket", ticket.id_ticket);

    if (errUpd) throw errUpd;

    await supabase.from("historial_ticket").insert([{
      id_ticket:  ticket.id_ticket,
      id_usuario: null,
      comentario: `🤖 Ticket asignado automaticamente a ${elegido.nombre} (carga actual: ${carga[elegido.id_usuario]} tickets activos).`,
    }]);

    if (onTecnicoAsignado) {
      onTecnicoAsignado({ ...ticket, id_tecnico: elegido.id_usuario, id_estado: 2 });
    }

  } catch (err) {
    console.error("[AutoAsignar] Error:", err.message);
  }
}

// 2. RESPUESTA AUTOMATICA POR SIMILITUD

function calcularPuntaje(ticket, areaNombre, ejemplo) {
  const textoTicket  = (ticket.titulo + " " + ticket.descripcion).toLowerCase();
  const areaTicket   = (areaNombre || "").toLowerCase();
  const areaEjemplo  = (ejemplo.entrada.area || "").toLowerCase();
  const textoEjemplo = (ejemplo.entrada.titulo + " " + ejemplo.entrada.descripcion).toLowerCase();

  let puntaje = 0;

  if (areaTicket && areaEjemplo && areaTicket === areaEjemplo) puntaje += 10;

  areaEjemplo.split(/\s+/).forEach(p => {
    if (p.length > 3 && areaTicket.includes(p)) puntaje += 3;
  });

  textoEjemplo.split(/\s+/).filter(p => p.length >= 4).forEach(palabra => {
    if (textoTicket.includes(palabra)) puntaje += 1;
  });

  const tituloTicket = ticket.titulo.toLowerCase();
  ejemplo.entrada.titulo.toLowerCase().split(/\s+/).forEach(p => {
    if (p.length >= 4 && tituloTicket.includes(p)) puntaje += 2;
  });

  return puntaje;
}

export async function enviarAutoRespuesta(ticket, areaNombre, onHistorialUpdate) {
  try {
    const { ejemplos } = training;
    if (!ejemplos || ejemplos.length === 0) return;

    const ranking = ejemplos
      .map(ej => ({ ej, puntaje: calcularPuntaje(ticket, areaNombre, ej) }))
      .sort((a, b) => b.puntaje - a.puntaje);

    const mejor = ranking[0];
    if (mejor.puntaje === 0) return;

    const { data: entry, error: errInsert } = await supabase
      .from("historial_ticket")
      .insert([{
        id_ticket:  ticket.id_ticket,
        id_usuario: null,
        comentario: "🤖 Respuesta automatica:\n\n" + mejor.ej.salida,
      }])
      .select()
      .single();

    if (errInsert) throw errInsert;
    if (onHistorialUpdate && entry) onHistorialUpdate(ticket.id_ticket, entry);

  } catch (err) {
    console.error("[AutoRespuesta] Error:", err.message);
  }
}