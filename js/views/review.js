import { getSchema, getTabs, getTabFields, isFieldVisible } from "../schema.js";
import { formatDate } from "./list.js";
import { buildReportText } from "../report.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Valor formatado para exibição conforme o tipo do campo. */
function displayValue(field, data) {
  const v = data[field.key];

  if (field.type === "multiselect") {
    const arr = Array.isArray(v) ? v : [];
    return arr.length ? arr.join(", ") : "—";
  }
  if (field.type === "date") return formatDate(v);
  if (field.type === "selectextra") {
    if (v === "MANUAL") return `MANUAL: ${data[`${field.key}Manual`] || ""}`;
    if (v === "NÃO ACAUTELADO") return "NÃO ACAUTELADO";
    return v === "" || v == null ? "—" : String(v);
  }
  if (field.type === "simnao" || field.type === "select") {
    return v === "" || v == null ? "—" : String(v);
  }
  if (v === "" || v == null) return "—";
  return String(v);
}

/**
 * @param {HTMLElement} root
 * @param {{ data: object, saveError: string|null, onSave, onEdit, onWhatsapp, onCopy }} opts
 */
export function renderReview(root, { data, saveError, onSave, onEdit, onWhatsapp, onCopy }) {
  const schema = getSchema();
  const sections = getTabs(schema)
    .map((tab) => {
      const rows = getTabFields(tab, schema)
        .filter((f) => isFieldVisible(f, data))
        .map((f) => {
          // Texto condicional de multiselect (ex.: OUTROS -> detalhe)
          let extra = "";
          if (
            f.type === "multiselect" &&
            Array.isArray(f.requiresText) &&
            f.requiresText.length &&
            Array.isArray(data[f.key]) &&
            data[f.key].some((v) => f.requiresText.includes(v))
          ) {
            const tKey = `${f.key}Texto`;
            if (data[tKey]) {
              extra = `
              <div class="review-row">
                <dt>${escapeHtml(f.requiresTextLabel || f.label + " (DETALHE)")}</dt>
                <dd>${escapeHtml(data[tKey])}</dd>
              </div>`;
            }
          }
          return `
          <div class="review-row">
            <dt>${escapeHtml(f.label)}</dt>
            <dd>${escapeHtml(displayValue(f, data))}</dd>
          </div>${extra}`;
        })
        .join("");
      if (!rows) return "";
      return `
      <section class="review-block">
        <h2>${escapeHtml(tab.label)}</h2>
        <dl>${rows}</dl>
      </section>`;
    })
    .join("");

  root.innerHTML = `
    <header class="page-header compact">
      <p class="eyebrow">Confirmação</p>
      <h1>Revisão</h1>
      <p class="subtitle">Confira antes de salvar</p>
    </header>

    ${saveError ? `<div class="banner error-banner" role="alert">${escapeHtml(saveError)}</div>` : ""}

    <div class="review-body">
      ${sections}
    </div>

    <footer class="form-footer">
      <button type="button" class="btn btn-ghost" data-action="edit">Voltar a editar</button>
      <button type="button" class="btn btn-ghost" data-action="copy">Copiar</button>
      <button type="button" class="btn btn-whats" data-action="whatsapp">Enviar WhatsApp</button>
      <button type="button" class="btn btn-primary" data-action="save">Salvar</button>
    </footer>
  `;

  root.querySelector('[data-action="edit"]').addEventListener("click", onEdit);
  root.querySelector('[data-action="save"]').addEventListener("click", onSave);
  root.querySelector('[data-action="whatsapp"]')?.addEventListener("click", onWhatsapp);
  root.querySelector('[data-action="copy"]')?.addEventListener("click", onCopy);
}
