function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Abre um modal simples exibindo um texto (pré-formatado).
 * @param {string} title
 * @param {string} text
 */
export function openTextModal(title, text) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <header class="modal-head">
        <h2>${escapeHtml(title)}</h2>
        <button type="button" class="modal-close" data-action="close" aria-label="Fechar">×</button>
      </header>
      <pre class="modal-text">${escapeHtml(text)}</pre>
      <footer class="modal-foot">
        <button type="button" class="btn btn-ghost" data-action="copy">Copiar</button>
        <button type="button" class="btn btn-primary" data-action="close">Fechar</button>
      </footer>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
    const action = e.target?.getAttribute?.("data-action");
    if (action === "close") close();
  });
  overlay.querySelector('[data-action="copy"]')?.addEventListener("click", async () => {
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
  });
  document.addEventListener(
    "keydown",
    function onEsc(ev) {
      if (ev.key === "Escape") {
        close();
        document.removeEventListener("keydown", onEsc);
      }
    }
  );
}
