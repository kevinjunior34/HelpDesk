import { useRef } from "react";

export function useImageUpload({ imagenes, setImagenes, onError }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const valid = [];
    const newErrs = [];

    files.forEach(file => {
      if (!allowed.includes(file.type)) {
        newErrs.push(`"${file.name}" no es una imagen válida (jpg, png, webp, gif).`);
      } else if (file.size > maxSize) {
        newErrs.push(`"${file.name}" supera el límite de 5MB.`);
      } else if (imagenes.length + valid.length >= 5) {
        newErrs.push("Máximo 5 imágenes por ticket.");
      } else {
        valid.push({
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        });
      }
    });

    if (newErrs.length) {
      onError?.('imagenes', newErrs.join(" "));
    } else {
      onError?.('imagenes', null);
    }

    setImagenes(prev => [...prev, ...valid].slice(0, 5));
    e.target.value = "";
  };

  const removeImagen = (idx) => {
    setImagenes(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  return {
    fileInputRef,
    handleFileChange,
    removeImagen
  };
}