import { useTicketForm } from "../../hooks/useTicketForm";
import { useImageUpload } from "../../hooks/useImageUpload";
import { ImageUploadZone } from "./ImageUploadZone";
import { ImagePreviews } from "./ImagePreviews";

export function TicketForm({ user, setTickets, getArea, toast, setTab, onCancel }) {
  const {
    form,
    err,
    imagenes,
    uploadingImgs,
    setImagenes,
    handleInputChange,
    crearTicket,
    setImageError
  } = useTicketForm({ user, setTickets, getArea, toast, setTab });

  const { fileInputRef, handleFileChange, removeImagen } = useImageUpload({
    imagenes,
    setImagenes,
    onError: setImageError
  });

  return (
    <div className="hd-card hd-ticket-form">
      <h3>Crear Nuevo Ticket</h3>
      <div className="hd-form-group">
        {/* Título */}
        <div>
          <label className="hd-label">Título</label>
          <input
            className={`hd-input${err.titulo ? " error" : ""}`}
            placeholder="Ej. Fallo en equipo de laboratorio"
            value={form.titulo}
            onChange={e => handleInputChange('titulo', e.target.value)}
          />
          {err.titulo && <div className="hd-err">{err.titulo}</div>}
        </div>

        {/* Descripción */}
        <div>
          <label className="hd-label">Descripción</label>
          <textarea
            className={`hd-textarea${err.descripcion ? " error" : ""}`}
            rows={4}
            placeholder="Describe el problema con detalle..."
            value={form.descripcion}
            onChange={e => handleInputChange('descripcion', e.target.value)}
          />
          {err.descripcion && <div className="hd-err">{err.descripcion}</div>}
        </div>

        {/* Prioridad */}
        <div>
          <label className="hd-label">Prioridad</label>
          <select
            className={`hd-select${err.id_prioridad ? " error" : ""}`}
            value={form.id_prioridad}
            onChange={e => handleInputChange('id_prioridad', e.target.value)}
          >
            <option value="">Seleccione prioridad</option>
            <option value="1">Crítica</option>
            <option value="2">Alta</option>
            <option value="3">Media</option>
            <option value="4">Baja</option>
          </select>
          {err.id_prioridad && <div className="hd-err">{err.id_prioridad}</div>}
        </div>

        {/* Imágenes */}
        <ImageUploadZone
          fileInputRef={fileInputRef}
          imagenes={imagenes}
          handleFileChange={handleFileChange}
          error={err.imagenes}
        />

        <ImagePreviews
          imagenes={imagenes}
          onRemove={removeImagen}
        />

        <button
          className="hd-btn-primary"
          style={{ alignSelf: "flex-start" }}
          onClick={crearTicket}
          disabled={uploadingImgs}
        >
          {uploadingImgs ? "Enviando…" : "Enviar Ticket →"}
        </button>
      </div>
    </div>
  );
}