import { supabase } from "./supabase";

export async function asignarTecnicoAuto(idTicket, idArea = null) {
  try {
    // 1. Obtener todos los técnicos
    const { data: tecnicos, error: errorTecnicos } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, tickets_activos")
      .eq("rol", "TECNICO");

    if (errorTecnicos) throw errorTecnicos;
    if (!tecnicos || tecnicos.length === 0) {
      console.log("No hay técnicos disponibles");
      return null;
    }

    // 2. Contar tickets activos de cada técnico
    const conteos = await Promise.all(
      tecnicos.map(async (tecnico) => {
        const { count, error } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("id_tecnico", tecnico.id_usuario)
          .in("id_estado", [1, 2]);

        if (error) throw error;
        return {
          ...tecnico,
          ticketsActivos: count || 0
        };
      })
    );

    // 3. Ordenar por menor cantidad de tickets
    conteos.sort((a, b) => a.ticketsActivos - b.ticketsActivos);
    const tecnicoSeleccionado = conteos[0];

    // 4. Asignar el técnico al ticket
    const { error: errorAsignacion } = await supabase
      .from("tickets")
      .update({ 
        id_tecnico: tecnicoSeleccionado.id_usuario,
        id_estado: 2
      })
      .eq("id_ticket", idTicket);

    if (errorAsignacion) throw errorAsignacion;

    // 5. Registrar en el historial
    await supabase
      .from("historial_ticket")
      .insert([{
        id_ticket: idTicket,
        id_usuario: null,
        comentario: `✅ Ticket asignado automáticamente a ${tecnicoSeleccionado.nombre}`,
        fecha: new Date().toISOString()
      }]);

    return tecnicoSeleccionado;
  } catch (error) {
    console.error("Error en asignación:", error);
    return null;
  }
}