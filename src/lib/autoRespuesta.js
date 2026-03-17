import { supabase } from "./supabase.js";

// Respuestas predefinidas
const respuestasAuto = {
  bienvenida: "Hola, hemos recibido tu ticket. Un técnico te atenderá a la brevedad.",
  asignado: (nombre) => `Tu ticket ha sido asignado a ${nombre}.`,
  cerrado: "Tu ticket ha sido cerrado. Gracias por usar nuestro sistema."
};

export async function enviarAutoRespuesta(ticket, areaNombre, onHistorialUpdate) {
  try {
    // 1. Registrar en el historial
    const { data, error } = await supabase
      .from("historial_ticket")
      .insert([{
        id_ticket: ticket.id_ticket,
        id_usuario: null, // null = sistema
        comentario: respuestasAuto.bienvenida,
        fecha: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // 2. Actualizar el historial local si hay callback
    if (onHistorialUpdate && data) {
      onHistorialUpdate(ticket.id_ticket, data[0]);
    }

    return data[0];
  } catch (error) {
    console.error("Error enviando auto-respuesta:", error);
    return null;
  }
}

export async function enviarNotificacionAsignacion(ticketId, tecnicoNombre) {
  try {
    const { error } = await supabase
      .from("historial_ticket")
      .insert([{
        id_ticket: ticketId,
        id_usuario: null,
        comentario: respuestasAuto.asignado(tecnicoNombre),
        fecha: new Date().toISOString()
      }]);

    if (error) throw error;
  } catch (error) {
    console.error("Error enviando notificación:", error);
  }
}

export async function enviarNotificacionCierre(ticketId) {
  try {
    const { error } = await supabase
      .from("historial_ticket")
      .insert([{
        id_ticket: ticketId,
        id_usuario: null,
        comentario: respuestasAuto.cerrado,
        fecha: new Date().toISOString()
      }]);

    if (error) throw error;
  } catch (error) {
    console.error("Error enviando notificación:", error);
  }
}