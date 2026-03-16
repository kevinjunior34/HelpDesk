import { useEffect } from "react";

export function Toast({ msg, type, onClose }) {
  useEffect(() => { 
    const t = setTimeout(onClose, 3000); 
    return () => clearTimeout(t); 
  }, [onClose]);
  
  return <div className={`hd-toast ${type}`}>{msg}</div>;
}