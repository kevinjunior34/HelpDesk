export function ImagePreviews({ imagenes, onRemove }) {
  if (imagenes.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
      {imagenes.map((img, idx) => (
        <div
          key={idx}
          style={{
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #e0e7ff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        >
          <img
            src={img.preview}
            alt={img.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
            title="Quitar imagen"
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              fontSize: 9,
              padding: "2px 4px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
            title={img.name}
          >
            {img.name}
          </div>
        </div>
      ))}
    </div>
  );
}