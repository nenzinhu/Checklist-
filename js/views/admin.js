import { formatDate } from "./list.js";
import { buildReportText } from "../report.js";
import { getSchema, getTabs, getTabFields, isFieldVisible } from "../schema.js";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(v) {
  const s = v === "" || v == null ? "—" : String(v);
  return `<td>${escapeHtml(s)}</td>`;
}

/** Valor de uma célula da tabela administrativa para o campo informado. */
function cellValue(field, data) {
  const v = data[field.key];

  if (field.type === "multiselect") {
    return Array.isArray(v) && v.length ? v.join(", ") : "";
  }
  if (field.type === "selectextra") {
    if (v === "MANUAL") return `MANUAL: ${data[`${field.key}Manual`] || ""}`;
    if (v === "NÃO ACAUTELADO") return "NÃO ACAUTELADO";
    return v || "";
  }
  if (v === "" || v == null) return "";
  return String(v);
}

/**
 * @param {HTMLElement} root
 * @param {{
 *   items: Array,
 *   filterDate: string,
 *   onLogout: () => void,
 *   onFilter: (date: string) => void,
 *   onOpenItem: (id: string) => void,
 *   onChangePass: () => void,
 *   onBuilder: () => void,
 *   onDashboard: () => void,
 * }} opts
 */
export function renderAdmin(root, { items, filterDate, onLogout, onFilter, onOpenItem, onChangePass, onBuilder, onDashboard }) {
  const schema = getSchema();
  const data = filterDate || todayISO();
  const dayItems = items.filter((it) => (it.data?.data || "") === data);
  const sorted = [...dayItems].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  // Todas as colunas (todas as abas) — sem quebrar a tabela.
  const allFields = getTabs(schema).flatMap((tab) => getTabFields(tab, schema));

  const headCols = allFields.map((f) => `<th>${escapeHtml(f.label)}</th>`).join("");

  const rows = sorted
    .map((it) => {
      const d = it.data || {};
      const tds = allFields
        .map((f) => cell(isFieldVisible(f, d) ? cellValue(f, d) : ""))
        .join("");
      return `<tr>${tds}<td><button type="button" class="btn btn-small" data-action="open-item" data-id="${it.id}">Abrir</button></td></tr>`;
    })
    .join("");

  const table =
    sorted.length === 0
      ? `<p class="empty">Nenhum checklist salvo para esta data.</p>`
      : `<div class="table-wrap"><table class="admin-table"><thead><tr>${headCols}<th>AÇÕES</th></tr></thead><tbody>${rows}</tbody></table></div>`;

  root.innerHTML = `
    <header class="page-header compact">
      <button type="button" class="link-back" data-action="logout">← Sair</button>
      <h1>Painel Admin</h1>
      <p class="progress" aria-live="polite">${dayItems.length} checklist(s) em ${formatDate(data)}</p>
      <div class="btn-row" style="margin-top:.4rem">
        <button type="button" class="btn btn-small btn-ghost" data-action="builder">✎ Editor de Formulário</button>
        <button type="button" class="btn btn-small btn-ghost" data-action="change-pass">Alterar Senha</button>
        <button type="button" class="btn btn-small btn-primary" data-action="dashboard">📊 Dashboard</button>
      </div>
    </header>

    <div class="toolbar admin-filter">
      <label for="admin-date">Data da guarnição:</label>
      <input type="date" id="admin-date" name="admin-date" value="${escapeHtml(data)}" />
    </div>

    <section class="admin-section" aria-label="Checklists do dia">
      ${table}
    </section>
  `;

  root.querySelector('[data-action="logout"]')?.addEventListener("click", onLogout);
  root.querySelector('[data-action="change-pass"]')?.addEventListener("click", onChangePass);
  root.querySelector('[data-action="builder"]')?.addEventListener("click", onBuilder);
  root.querySelector('[data-action="dashboard"]')?.addEventListener("click", onDashboard);

  root.querySelectorAll('[data-action="open-item"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      onOpenItem(btn.getAttribute("data-id"));
    });
  });

  const dateInput = root.querySelector("#admin-date");
  if (dateInput) {
    dateInput.addEventListener("change", (e) => {
      onFilter(e.target.value || "");
    });
  }
}
