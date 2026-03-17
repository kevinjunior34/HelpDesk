export function ImageUploadZone({ fileInputRef, imagenes, handleFileChange, error }) {
  return (
    <div>
      <label className="hd-label">
        Imágenes adjuntas{" "}
        <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
          (opcional · máx. 5 · jpg/png/webp/gif · 5MB c/u)
        </span>
      </label>

      <div
        className="hd-upload-zone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("hd-upload-zone--drag"); }}
        onDragLeave={e => e.currentTarget.classList.remove("hd-upload-zone--drag")}
        onDrop={e => {
          e.preventDefault();
          e.currentTarget.classList.remove("hd-upload-zone--drag");
          const dt = { target: { files: e.dataTransfer.files, value: "" } };
          handleFileChange(dt);
        }}
        style={{
          border: "2px dashed #c7d2fe",
          borderRadius: 10,
          padding: "18px 24px",
          textAlign: "center",
          cursor: imagenes.length >= 5 ? "not-allowed" : "pointer",
          background: "#f8f9ff",
          color: "#6b7fa3",
          fontSize: 13,
          transition: "border-color 0.2s, background 0.2s",
          opacity: imagenes.length >= 5 ? 0.5 : 1,
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 4 }}>🖼️</div>
        {imagenes.length >= 5
          ? "Límite de 5 imágenes alcanzado"
          : "Haz clic o arrastra imágenes aquí"}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={imagenes.length >= 5}
      />

      {error && <div className="hd-err">{error}</div>}
    </div>
  );
}