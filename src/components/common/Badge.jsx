import { getEstado } from "../../utils/helpers";

export function Badge({ id_estado }) {
  const e = getEstado(id_estado);
  return <span className={`hd-badge ${e.cls}`}>{e.label}</span>;
}