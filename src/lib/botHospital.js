import { supabase } from "./supabase";
import { asignarTecnicoAuto } from "./Tecnico";
import { getEstado, getPrioridad, fmtDate } from "../utils/helpers"; // 👈 Importar helpers

// Base de conocimientos (igual que antes)
const baseConocimientos = {
  equipos: {
    monitor: {
      palabras: ["monitor", "pantalla", "signos", "vitales", "ecg", "ritmo", "cardiaco"],
      soluciones: [
        "1. Verifica que el monitor esté conectado a la corriente eléctrica",
        "2. Revisa que los cables de los sensores estén bien conectados",
        "3. Comprueba que no haya alarmas silenciadas",
        "4. Reinicia el equipo manteniendo presionado el botón de encendido"
      ]
    },
    bomba_infusion: {
      palabras: ["bomba", "infusión", "medicamento", "goteo", "perfusora", "dosis"],
      soluciones: [
        "1. Revisa que la bomba esté correctamente programada con la dosis indicada",
        "2. Verifica que no haya obstrucciones en la línea de infusión",
        "3. Comprueba que la batería tenga carga suficiente",
        "4. Asegúrate de que el medicamento esté bien colocado y no haya burbujas"
      ]
    },
    ventilador: {
      palabras: ["ventilador", "respirador", "respiración", "oxígeno", "tubo", "intubado"],
      soluciones: [
        "1. Verifica las conexiones del circuito respiratorio",
        "2. Comprueba los niveles de oxígeno en la toma central",
        "3. Revisa que no haya alarmas de alta presión activas",
        "4. Asegúrate de que el tubo endotraqueal no esté acodado"
      ]
    },
    desfibrilador: {
      palabras: ["desfibrilador", "paro", "descarga", "cardíaco", "reanimación"],
      soluciones: [
        "1. Revisa que las palas estén bien conectadas y limpias",
        "2. Verifica que tenga batería suficiente",
        "3. Comprueba el gel conductor en las palas",
        "4. Asegúrate de que esté en modo correcto (manual/AED)"
      ]
    }
  },
  sistemas: {
    pacs: {
      palabras: ["pacs", "imágenes", "radiología", "rayos x", "tomografía", "resonancia"],
      soluciones: [
        "1. Verifica tu conexión a la red hospitalaria",
        "2. Reinicia la aplicación PACS",
        "3. Comprueba que tengas permisos de acceso al estudio",
        "4. Intenta acceder desde otro equipo de la misma área"
      ]
    },
    him: {
      palabras: ["him", "historia", "clínica", "expediente", "paciente", "registros"],
      soluciones: [
        "1. Cierra sesión y vuelve a ingresar al sistema",
        "2. Verifica que el paciente esté correctamente registrado",
        "3. Revisa los filtros de búsqueda aplicados",
        "4. Limpia la caché del navegador o prueba con otro navegador"
      ]
    },
    impresora: {
      palabras: ["impresora", "pulseras", "etiquetas", "brazaletes", "recetas", "hojas"],
      soluciones: [
        "1. Revisa que tenga papel suficiente",
        "2. Verifica que esté encendida y el cable USB/conectado",
        "3. Comprueba la cola de impresión (reiniciar servicio de impresión)",
        "4. Reinicia la impresora apagándola 30 segundos"
      ]
    }
  },
  generales: {
    internet: {
      palabras: ["internet", "red", "wifi", "conexión", "online", "navegador"],
      soluciones: [
        "1. Verifica que el cable de red esté correctamente conectado",
        "2. Comprueba que el wifi esté activado y seleccionado",
        "3. Reinicia tu equipo",
        "4. Prueba conectarte a otra red o punto de red"
      ]
    },
    energia: {
      palabras: ["energía", "corriente", "luz", "enchufe", "batería", "apagado"],
      soluciones: [
        "1. Revisa que el equipo esté enchufado a la toma corriente",
        "2. Verifica el interruptor de corriente del equipo",
        "3. Comprueba la batería del equipo (si es portátil)",
        "4. Prueba en otro enchufe o toma corriente"
      ]
    }
  }
};

// Detectar categoría (igual que antes)
function detectarCategoria(mensaje) {
  mensaje = mensaje.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [categoria, subcategorias] of Object.entries(baseConocimientos)) {
    for (const [subcategoria, data] of Object.entries(subcategorias)) {
      const palabrasEncontradas = data.palabras.filter(palabra => 
        mensaje.includes(palabra.toLowerCase())
      );
      
      if (palabrasEncontradas.length > 0) {
        return {
          categoria,
          subcategoria,
          soluciones: data.soluciones,
          confianza: palabrasEncontradas.length
        };
      }
    }
  }
  return null;
}

// Clase Bot (igual que antes, pero usando los helpers cuando sea necesario)
class SesionBot {
  constructor(ticketId, ticketTitulo, usuarioId) {
    this.ticketId = ticketId;
    this.ticketTitulo = ticketTitulo;
    this.usuarioId = usuarioId;
    this.intentos = 0;
    this.maxIntentos = 3;
    this.categoriaActual = null;
    this.soluciones = [];
    this.indiceSolucion = 0;
    this.conversacion = [];
    this.ultimoMensaje = null;
    this.resuelto = false;
    this.escalado = false;
    this.activo = true;
  }

  async iniciar() {
    const mensaje = `🏥 **Asistente Virtual del Hospital**

Hola, soy el asistente virtual. ¿Qué problema estás presentando?

Describe el equipo o situación y te ayudaré paso a paso.`;
    
    await this.guardarMensaje("bot", mensaje);
    return mensaje;
  }

  async procesarMensaje(mensajeUsuario) {
    if (!this.activo) {
      return "La conversación ha finalizado. Si tienes otro problema, crea un nuevo ticket.";
    }

    this.ultimoMensaje = mensajeUsuario;
    mensajeUsuario = mensajeUsuario.toLowerCase().trim();
    
    await this.guardarMensaje("usuario", mensajeUsuario);
    
    if (this.intentos >= this.maxIntentos) {
      return this.asignarTecnico();
    }

    if (this.esRespuestaSiNo(mensajeUsuario)) {
      return this.procesarRespuestaSiNo(mensajeUsuario);
    }

    const match = detectarCategoria(mensajeUsuario);
    
    if (match) {
      this.categoriaActual = match;
      this.soluciones = match.soluciones;
      this.indiceSolucion = 0;
      this.intentos = 0;
      
      const respuesta = this.formatearRespuesta(match);
      await this.guardarMensaje("bot", respuesta);
      return respuesta;
    } else {
      this.intentos++;
      
      if (this.intentos >= this.maxIntentos) {
        return this.asignarTecnico();
      }
      
      const respuesta = this.obtenerMensajeNoEntiendo();
      await this.guardarMensaje("bot", respuesta);
      return respuesta;
    }
  }

  formatearRespuesta(match) {
    const nombres = {
      monitor: "Monitor de Signos Vitales",
      bomba_infusion: "Bomba de Infusión",
      ventilador: "Ventilador Mecánico",
      desfibrilador: "Desfibrilador",
      pacs: "Sistema PACS",
      him: "Sistema HIM",
      impresora: "Impresora",
      internet: "Conexión de Red",
      energia: "Suministro Eléctrico"
    };

    return `🔍 **Problema identificado:** ${nombres[match.subcategoria] || match.subcategoria}

📋 **Solución sugerida (intento 1/${this.maxIntentos}):**
${match.soluciones[0]}

✅ ¿Funcionó? Responde SI o NO.`;
  }

  async procesarRespuestaSiNo(mensaje) {
    const esSi = mensaje.includes("si") || mensaje.includes("sí") || 
                 mensaje.includes("funciono") || mensaje.includes("ok");
    
    if (esSi) {
      this.resuelto = true;
      this.activo = false;
      
      await supabase
        .from("tickets")
        .update({ 
          resuelto_por_bot: true,
          fecha_resolucion_bot: new Date().toISOString()
        })
        .eq("id_ticket", this.ticketId);
      
      const respuesta = this.obtenerMensajeResuelto();
      await this.guardarMensaje("bot", respuesta);
      return respuesta;
    } else {
      this.intentos++;
      this.indiceSolucion++;
      
      if (this.intentos >= this.maxIntentos || this.indiceSolucion >= this.soluciones.length) {
        return this.asignarTecnico();
      }
      
      const respuesta = `🔄 **Intento ${this.intentos}/${this.maxIntentos}**

Prueba esta otra solución:
${this.soluciones[this.indiceSolucion]}

✅ ¿Funcionó esta vez? (SI/NO)`;
      
      await this.guardarMensaje("bot", respuesta);
      return respuesta;
    }
  }

  async asignarTecnico() {
    this.escalado = true;
    this.activo = false;
    
    const tecnico = await asignarTecnicoAuto(this.ticketId);
    
    let respuesta = `⚠️ **No he podido resolver tu problema automáticamente**

`;
    
    if (tecnico) {
      respuesta += `✅ He asignado a **${tecnico.nombre}** como técnico especializado.
      
Te contactará a la brevedad para ayudarte personalmente.`;

      await supabase
        .from("tickets")
        .update({ 
          diagnostico_bot: {
            intentos: this.intentos,
            categoria: this.categoriaActual,
            escalado: true
          }
        })
        .eq("id_ticket", this.ticketId);
    } else {
      respuesta += "⚠️ No hay técnicos disponibles. Un supervisor será notificado.";
    }
    
    await this.guardarMensaje("bot", respuesta);
    return respuesta;
  }

  obtenerMensajeResuelto() {
    const mensajes = [
      "✅ ¡Problema resuelto! Que tengas buen día.",
      "✅ Excelente, me alegra haber sido de ayuda. ¡Saludos!",
      "✅ Perfecto, problema solucionado. Buen día.",
      "✅ ¡Qué bien que funcionó! Que tengas una excelente jornada."
    ];
    return mensajes[Math.floor(Math.random() * mensajes.length)];
  }

  obtenerMensajeNoEntiendo() {
    const mensajes = [
      "🤔 No logro identificar el problema. ¿Podrías ser más específic@?",
      "Para ayudarte mejor, necesito más detalles. ¿Qué equipo presenta fallas?",
      "¿Podrías describir el problema de otra manera?",
      "Dime exactamente qué está pasando y con qué equipo."
    ];
    return mensajes[this.intentos - 1] || mensajes[mensajes.length - 1];
  }

  esRespuestaSiNo(mensaje) {
    const afirmaciones = ["si", "sí", "funciono", "ok", "dale"];
    const negaciones = ["no", "nope", "tampoco", "nada"];
    return afirmaciones.some(p => mensaje.includes(p)) || 
           negaciones.some(p => mensaje.includes(p));
  }

  estaActivo() {
    return this.activo;
  }

  getEstado() {
    return {
      activo: this.activo,
      resuelto: this.resuelto,
      escalado: this.escalado,
      intentos: this.intentos
    };
  }

  async guardarMensaje(tipo, contenido) {
    const mensaje = {
      id_ticket: this.ticketId,
      id_usuario: tipo === "bot" ? null : this.usuarioId,
      comentario: contenido,
      fecha: new Date().toISOString()
    };
    
    this.conversacion.push(mensaje);
    
    try {
      await supabase.from("historial_ticket").insert([mensaje]);
    } catch (error) {
      console.error("Error guardando mensaje:", error);
    }
  }
}

// Singleton (igual que antes)
class BotHospital {
  constructor() {
    this.sesiones = new Map();
  }

  getSesion(ticketId, ticketTitulo = "", usuarioId = null) {
    if (!this.sesiones.has(ticketId)) {
      this.sesiones.set(ticketId, new SesionBot(ticketId, ticketTitulo, usuarioId));
    }
    return this.sesiones.get(ticketId);
  }

  cerrarSesion(ticketId) {
    this.sesiones.delete(ticketId);
  }
}

export const botHospital = new BotHospital();