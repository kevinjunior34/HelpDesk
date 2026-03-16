import emailjs from "@emailjs/browser";

// función para enviar correo cuando se crea un ticket
export const enviarCorreoTicket = async (ticket) => {
  try {

    const response = await emailjs.send(
      "SERVICE_ID",      // reemplazar
      "TEMPLATE_ID",     // reemplazar
      {
        usuario: ticket.usuario,
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
        prioridad: ticket.prioridad,
        fecha: new Date().toLocaleString()
      },
      "PUBLIC_KEY"       // reemplazar
    );

    console.log("Correo enviado:", response);

  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};