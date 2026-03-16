export function TRow({ children, onClick, selected }) {
  return (
    <tr onClick={onClick} className={`hd-tr ${onClick ? "clickable" : ""} ${selected ? "selected" : ""}`}>
      {children}
    </tr>
  );
}