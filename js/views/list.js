import { FIELD_LABELS } from "../form-data.js";
import { isItemEditable } from "../storage.js";

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

/**
 * @param {HTMLElement} root
 * @param {{
 *   items: Array,
 *   hasDraft: boolean,
 *   onNew: () => void,
 *   onContinueDraft: () => void,
 *   onDiscardDraft: () => void,
 *   onOpen: (id: string) => void,
 *   onDelete: (id: string) => void,
 *   onAdmin: () => void,
 * }} handlers
 */
export function renderList(root, { items, hasDraft, onNew, onContinueDraft, onDiscardDraft, onOpen, onDelete, onAdmin }) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const rows = sorted
    .map((item) => {
      const editavel = isItemEditable(item);
      const openBtn = editavel
        ? `<button type="button" class="btn btn-small" data-action="open" data-id="${item.id}">Abrir</button>`
        : `<button type="button" class="btn btn-small" data-action="open" data-id="${item.id}" disabled title="Edição bloqueada após 24h">Bloqueado</button>`;
      return `
        <li class="item-row" data-id="${item.id}">
          <div class="item-main">
            <strong>${formatDate(item.data?.data)}</strong>
            <span>${item.data?.viatura || "—"}</span>
            <span class="muted">${item.data?.patrulheiro || "—"} / ${item.data?.motorista || "—"}</span>
          </div>
          <div class="item-actions">
            ${openBtn}
            <button type="button" class="btn btn-small btn-danger" data-action="delete" data-id="${item.id}">Excluir</button>
          </div>
        </li>`;
    })
    .join("");

  root.innerHTML = `
    <header class="page-header">
      <p class="eyebrow">Serviço diário</p>
      <h1>Checklists salvos</h1>
      <p class="subtitle">Registro local neste aparelho</p>
    </header>

    ${
      hasDraft
        ? `<div class="banner draft-banner" role="status">
            <p>Há um rascunho em andamento.</p>
            <div class="btn-row">
              <button type="button" class="btn btn-primary" data-action="continue-draft">Continuar</button>
              <button type="button" class="btn btn-ghost" data-action="discard-draft">Descartar</button>
            </div>
          </div>`
        : ""
    }

    <div class="toolbar">
      <button type="button" class="btn btn-primary btn-block" data-action="new">
        Novo checklist
      </button>
      <button type="button" class="btn btn-ghost btn-block" data-action="admin">
        Painel Admin
      </button>
    </div>

    <section class="list-section" aria-label="Checklists salvos">
      <h2 class="section-title">Salvos (${sorted.length})</h2>
      ${
        sorted.length === 0
          ? `<p class="empty">Nenhum checklist salvo ainda.</p>`
          : `<ul class="item-list">${rows}</ul>`
      }
    </section>
  `;

  root.querySelector('[data-action="new"]')?.addEventListener("click", onNew);
  root
    .querySelector('[data-action="admin"]')
    ?.addEventListener("click", onAdmin);
  root
    .querySelector('[data-action="continue-draft"]')
    ?.addEventListener("click", onContinueDraft);
  root
    .querySelector('[data-action="discard-draft"]')
    ?.addEventListener("click", onDiscardDraft);

  root.querySelectorAll('[data-action="open"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      onOpen(btn.getAttribute("data-id"));
    });
  });
  root.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Excluir este checklist?")) onDelete(id);
    });
  });
}

export { formatDate, FIELD_LABELS };
