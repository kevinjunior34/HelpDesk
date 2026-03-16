// Mapeos de estados y prioridades
export const ESTADO_MAP = {
  1: { label: "Abierto",    cls: "abierto",    prioColor: "#b91c1c" },
  2: { label: "En proceso", cls: "en-proceso", prioColor: "#92400e" },
  3: { label: "Cerrado",    cls: "cerrado",    prioColor: "#166534" },
  4: { label: "Archivado",  cls: "archivado",  prioColor: "#6b7fa3" },
};

export const PRIO_MAP = {
  1: { label: "Crítica", color: "#7f1d1d" },
  2: { label: "Alta",    color: "#dc2626" },
  3: { label: "Media",   color: "#d97706" },
  4: { label: "Baja",    color: "#16a34a" },
};

export const getEstado    = (id) => ESTADO_MAP[id] || { label: "—", cls: "", prioColor: "#6b7fa3" };
export const getPrioridad = (id) => PRIO_MAP[id]   || { label: "—", color: "#6b7fa3" };

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-PE", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
}) : "—";