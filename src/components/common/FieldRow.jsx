export function FieldRow({ label, value }) {
  return (
    <div className="hd-field-row">
      <div className="hd-field-row__label">{label}</div>
      <div className="hd-field-row__value">{value || "—"}</div>
    </div>
  );
}