import { getEstado } from "../../utils/helpers"; // 👈 Importar tu helper

export function Badge({ id_estado }) {
  const estado = getEstado(id_estado); // 👈 Usando tu helper

  return (
    <span style={{
      background: estado.prioColor + "20", // 20% de opacidad
      color: estado.prioColor,
      padding: "4px 8px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600
    }}>
      {estado.label}
    </span>
  );
}