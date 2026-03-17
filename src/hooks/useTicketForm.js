import { useState } from "react";
import { supabase } from "../lib/supabase";
import { enviarAutoRespuesta } from "../lib/autoRespuesta"; // 👈 Solo importar lo que existe
import { asignarTecnicoAuto } from "../lib/Tecnico"; // 👈 Importar desde el archivo correcto

export function useTicketForm({ user, setTickets, getArea, toast, setTab }) {
  const [form, setForm] = useState({ titulo: "", descripcion: "", id_prioridad: "" });
  const [err, setErr] = useState({});
  const [imagenes, setImagenes] = useState([]);
  const [uploadingImgs, setUploadingImgs] = useState(false);

  const validateForm = () => {
    const e = {};
    if (form.titulo.trim().length < 5) e.titulo = "Mínimo 5 caracteres";
    if (form.descripcion.trim().length < 10) e.descripcion = "Mínimo 10 caracteres";
    if (!form.id_prioridad) e.id_prioridad = "Seleccione una prioridad";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const uploadImages = async (ticketId) => {
    if (imagenes.length === 0) return [];
    const urls = [];
    for (const img of imagenes) {
      const ext = img.file.name.split(".").pop();
      const path = `tickets/${ticketId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("adjuntos")
        .upload(path, img.file, { contentType: img.file.type, upsert: true });
      if (error) console.warn("Storage warning:", error.message);
      urls.push(path);
    }
    return urls;
  };

  const crearTicket = async () => {
    if (!validateForm()) return;

    setUploadingImgs(true);
    try {
      // 1. Insertar ticket
      const { data, error } = await supabase
        .from("tickets")
        .insert([
          {
            titulo: form.titulo,
            descripcion: form.descripcion,
            id_usuario: user.id_usuario,
            id_area: user.id_area,
            id_prioridad: Number(form.id_prioridad),
            id_estado: 1,
            fecha_creacion: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      const ticket = data[0];

      // 2. Subir imágenes
      const imageUrls = await uploadImages(ticket.id_ticket);
      if (imageUrls.length > 0) {
        const inserts = imageUrls.map(url => ({
          id_ticket: ticket.id_ticket,
          archivo: url,
        }));
        const { error: imgError } = await supabase
          .from("adjuntos")
          .insert(inserts);
        if (imgError) throw imgError;
      }

      // 3. ASIGNAR TÉCNICO AUTOMÁTICAMENTE
      const tecnicoAsignado = await asignarTecnicoAuto(ticket.id_ticket, user.id_area);
      
      // 4. Obtener el ticket actualizado
      const { data: ticketActualizado } = await supabase
        .from("tickets")
        .select("*")
        .eq("id_ticket", ticket.id_ticket)
        .single();

      const ticketFinal = ticketActualizado || { ...ticket, id_tecnico: tecnicoAsignado?.id_usuario };

      // 5. Actualizar estado local
      setTickets(prev => [{ ...ticketFinal, imagenes: imageUrls }, ...prev]);
      
      resetForm();
      toast("Ticket creado y asignado correctamente ✓", "success");
      setTab("lista");

      // 6. Enviar respuesta automática
      const areaNombre = getArea(user.id_area)?.nombre_area || "General";
      await enviarAutoRespuesta(ticketFinal, areaNombre, (idTicket, nuevoEntry) => {
        setTickets(prev => prev.map(t =>
          t.id_ticket === idTicket
            ? { ...t, historial: [...(t.historial ?? []), nuevoEntry] }
            : t
        ));
      });

    } catch (error) {
      toast("Error al crear ticket: " + error.message, "error");
    } finally {
      setUploadingImgs(false);
    }
  };

  const resetForm = () => {
    setForm({ titulo: "", descripcion: "", id_prioridad: "" });
    setImagenes([]);
    setErr({});
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setImageError = (field, message) => {
    setErr(prev => ({ ...prev, [field]: message }));
  };

  return {
    form,
    err,
    imagenes,
    uploadingImgs,
    setImagenes,
    handleInputChange,
    crearTicket,
    resetForm,
    setImageError
  };
}