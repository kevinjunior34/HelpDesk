import { supabase } from "./supabase";
import training from "./training.json";

/**
 * Calcula un puntaje de similitud entre el ticket y un ejemplo del JSON.
 * Compara palabras clave del título, descripción y área.
 * Devuelve un número: a mayor puntaje, mejor coincidencia.
 */
function calcularPuntaje(ticket, areaNombre, ejemplo) {
  const textoTicket = `${ticket.titulo} ${ticket.descripcion}`.toLowerCase();
  const areaTicket  = (areaNombre || "").toLowerCase();
  const areaEjemplo = (ejemplo.entrada.area || "").toLowerCase();
  const textoEjemplo = `${ejemplo.entrada.titulo} ${ejemplo.entrada.descripcion}`.toLowerCase();

  let puntaje = 0;

  // Bonus alto si el área coincide exactamente
  if (areaTicket && areaEjemplo && areaTicket === areaEjemplo) puntaje += 10;

  // Bonus si el área del ticket contiene palabras del área del ejemplo
  const palabrasArea = areaEjemplo.split(/\s+/);
  palabrasArea.forEach(p => {
    if (p.length > 3 && areaTicket.includes(p)) puntaje += 3;
  });

  // Contar palabras del ejemplo que aparecen en el ticket (mínimo 4 letras)
  const palabrasEjemplo = textoEjemplo
    .split(/\s+/)
    .filter(p => p.length >= 4);

  palabrasEjemplo.forEach(palabra => {
    if (textoTicket.includes(palabra)) puntaje += 1;
  });

  // Bonus extra si el título del ticket contiene palabras del título del ejemplo
  const tituloTicket  = ticket.titulo.toLowerCase();
  const tituloEjemplo = ejemplo.entrada.titulo.toLowerCase().split(/\s+/);
  tituloEjemplo.forEach(p => {
    if (p.length >= 4 && tituloTicket.includes(p)) puntaje += 2;
  });

  return puntaje;
}

/**
 * Busca en el JSON de entrenamiento el ejemplo más parecido al ticket
 * usando similitud por palabras clave y área. Sin API externa.
 *
 * @param {object}   ticket             - Ticket recién creado
 * @param {string}   areaNombre         - Nombre del área del ticket
 * @param {Function} onHistorialUpdate  - Callback para actualizar estado local
 */
export async function enviarAutoRespuesta(ticket, areaNombre, onHistorialUpdate) {
  try {
    const { ejemplos } = training;
    if (!ejemplos || ejemplos.length === 0) return;

    // Calcular puntaje para cada ejemplo y ordenar de mayor a menor
    const ranking = ejemplos
      .map(ej => ({ ej, puntaje: calcularPuntaje(ticket, areaNombre, ej) }))
      .sort((a, b) => b.puntaje - a.puntaje);

    // Tomar el ejemplo con mayor puntaje
    const mejor = ranking[0];

    // Si el puntaje es 0 no hay ninguna relación, no enviar nada
    if (mejor.puntaje === 0) {
      console.log("[AutoRespuesta] Sin coincidencia suficiente para este ticket.");
      return;
    }

    const mensaje = mejor.ej.salida;

    // Guardar en historial_ticket (id_usuario null = sistema)
    const { data: entry, error: errInsert } = await supabase
      .from("historial_ticket")
      .insert([{
        id_ticket:  ticket.id_ticket,
        id_usuario: null,
        comentario: `🤖 Respuesta automática:\n\n${mensaje}`,
      }])
      .select()
      .single();

    if (errInsert) throw errInsert;

    // Notificar para refrescar el historial en pantalla
    if (onHistorialUpdate && entry) {
      onHistorialUpdate(ticket.id_ticket, entry);
    }

  } catch (err) {
    console.error("[AutoRespuesta] Error:", err.message);
  }
}