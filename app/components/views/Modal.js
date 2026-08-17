"use client";

import { useEffect } from "react";

export default function Modal({ title, text, onClose }) {
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Texto copiado.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        alert("Texto copiado.");
      } catch {
        alert("Não foi possível copiar.");
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <pre className="modal-text">{text}</pre>
        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={copy}>
            Copiar
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
