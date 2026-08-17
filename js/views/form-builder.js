import {
  getSchema,
  getTabs,
  getTabFields,
  createTab,
  renameTab,
  deleteTab,
  moveTab,
  addField,
  updateField,
  deleteField,
  moveField,
  saveSchema,
  resetSchema,
  FIELD_TYPES,
  slugify,
} from "../schema.js";
import { openTextModal } from "./modal.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s);
}

const TYPE_OPTIONS = Object.entries(FIELD_TYPES)
  .map(([v, l]) => `<option value="${v}">${escapeHtml(l)}</option>`)
  .join("");

/**
 * Tela de administração do esquema: o admin monta o checklist.
 *
 * @param {HTMLElement} root
 * @param {{
 *   onBack: () => void,
 * }} opts
 */
export function renderFormBuilder(root, { onBack }) {
  // Cópia de trabalho do schema (salva somente ao clicar em "Salvar alterações").
  let schema = getSchema();

  const render = () => {
    const tabs = getTabs(schema);
    const tabsHtml = tabs
      .map((tab, ti) => {
        const fields = getTabFields(tab, schema);
        const fieldsHtml = fields.length
          ? fields
              .map((f, fi) =>
                fieldRowHtml(tab, f, fi, fields.length)
              )
              .join("")
          : `<p class="empty" style="padding:.5rem 0">Nenhum campo ainda. Adicione abaixo.</p>`;
        return `
          <div class="builder-tab" data-tab="${escapeAttr(tab.id)}">
            <div class="builder-tab-head">
              <div class="builder-tab-title">
                <strong>${ti + 1}. ${escapeHtml(tab.label)}</strong>
                <span class="muted">${fields.length} campo(s)</span>
              </div>
              <div class="btn-row">
                <button type="button" class="btn btn-small btn-ghost" data-act="tab-up" data-tab="${escapeAttr(tab.id)}" ${ti === 0 ? "disabled" : ""}>↑</button>
                <button type="button" class="btn btn-small btn-ghost" data-act="tab-down" data-tab="${escapeAttr(tab.id)}" ${ti === tabs.length - 1 ? "disabled" : ""}>↓</button>
                <button type="button" class="btn btn-small btn-danger" data-act="tab-del" data-tab="${escapeAttr(tab.id)}">Excluir aba</button>
              </div>
            </div>
            <div class="builder-fields">${fieldsHtml}</div>
            <div class="builder-addfield">
              <input type="text" id="newfield-${escapeAttr(tab.id)}" placeholder="Nome do novo campo" />
              <select id="newfieldtype-${escapeAttr(tab.id)}">${TYPE_OPTIONS}</select>
              <button type="button" class="btn btn-small btn-primary" data-act="field-add" data-tab="${escapeAttr(tab.id)}">+ Campo</button>
            </div>
          </div>`;
      })
      .join("");

    root.innerHTML = `
      <header class="page-header compact">
        <button type="button" class="link-back" data-act="back">← Painel Admin</button>
        <h1>Editor de Formulário</h1>
        <p class="subtitle">Crie abas e campos do checklist</p>
      </header>

      <div class="builder-toolbar">
        <input type="text" id="newtab" placeholder="Nome da nova aba (ex.: Observações)" />
        <button type="button" class="btn btn-small btn-primary" data-act="tab-add">+ Aba</button>
        <button type="button" class="btn btn-small btn-ghost" data-act="reset">Restaurar padrão</button>
      </div>

      <div class="builder-list">${tabsHtml || '<p class="empty">Nenhuma aba. Crie uma acima.</p>'}</div>

      <div class="btn-row" style="margin-top:1rem">
        <button type="button" class="btn btn-ghost" data-act="back">Cancelar</button>
        <button type="button" class="btn btn-primary" data-act="save">Salvar alterações</button>
      </div>
    `;

    wire();
  };

  const wire = () => {
    root.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.getAttribute("data-act");
        const tabId = btn.getAttribute("data-tab");
        const fieldId = btn.getAttribute("data-field");
        handle(act, tabId, fieldId, btn);
      });
    });
  };

  const handle = (act, tabId, fieldId, btn) => {
    switch (act) {
      case "back":
        onBack();
        return;
      case "tab-add": {
        const inp = root.querySelector("#newtab");
        const label = inp.value.trim();
        if (!label) {
          alert("Informe o nome da aba.");
          return;
        }
        createTab(schema, label);
        render();
        return;
      }
      case "tab-del": {
        const tab = getTabs(schema).find((t) => t.id === tabId);
        if (!confirm(`Excluir a aba "${tab?.label || ""}" e todos os seus campos?`)) return;
        deleteTab(schema, tabId);
        render();
        return;
      }
      case "tab-up":
        moveTab(schema, tabId, "up");
        render();
        return;
      case "tab-down":
        moveTab(schema, tabId, "down");
        render();
        return;
      case "field-add": {
        const nameInp = root.querySelector(`#newfield-${escapeAttr(tabId)}`);
        const typeSel = root.querySelector(`#newfieldtype-${escapeAttr(tabId)}`);
        const label = nameInp.value.trim();
        const type = typeSel.value;
        if (!label) {
          alert("Informe o nome do campo.");
          return;
        }
        addField(schema, tabId, { label, type, required: true });
        render();
        return;
      }
      case "field-del": {
        const tab = getTabs(schema).find((t) => t.id === tabId);
        const f = tab?.fields.find((x) => x.id === fieldId);
        if (!confirm(`Excluir o campo "${f?.label || ""}"?`)) return;
        deleteField(schema, tabId, fieldId);
        render();
        return;
      }
      case "field-up":
        moveField(schema, tabId, fieldId, "up");
        render();
        return;
      case "field-down":
        moveField(schema, tabId, fieldId, "down");
        render();
        return;
      case "field-edit": {
        openFieldEditor(tabId, fieldId);
        return;
      }
      case "reset": {
        if (!confirm("Restaurar o checklist para o padrão original? Isto apaga suas abas e campos personalizados.")) return;
        schema = resetSchema();
        render();
        return;
      }
      case "save": {
        if (saveSchema(schema)) {
          alert("Alterações salvas. O novo formato já vale para novos checklists.");
          onBack();
        } else {
          alert("Não foi possível salvar (armazenamento indisponível).");
        }
        return;
      }
    }
  };

  /** Modal de edição de um campo (tipo, opções, obrigatório, revelar-condicional). */
  const openFieldEditor = (tabId, fieldId) => {
    const tab = getTabs(schema).find((t) => t.id === tabId);
    const f = tab?.fields.find((x) => x.id === fieldId);
    if (!f) return;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    const usesOptions = ["select", "selectextra", "multiselect"].includes(f.type);
    const optionsText = (f.options || []).join("\n");
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <header class="modal-head">
          <h2>Editar campo</h2>
          <button type="button" class="modal-close" data-x>×</button>
        </header>
        <div class="modal-text" style="display:grid;gap:.8rem">
          <div class="field">
            <label>Rótulo / Nome</label>
            <input type="text" id="fe-label" value="${escapeAttr(f.label)}" />
          </div>
          <div class="field">
            <label>Tipo</label>
            <select id="fe-type">${TYPE_OPTIONS.replace(`value="${f.type}"`, `value="${f.type}" selected`)}</select>
          </div>
          <div class="field" id="fe-options-wrap" style="${usesOptions ? "" : "display:none"}">
            <label>Opções (uma por linha)${f.type === "multiselect" ? " — use NENHUM para opção exclusiva" : ""}</label>
            <textarea id="fe-options" rows="5">${escapeHtml(optionsText)}</textarea>
          </div>
          <div class="field">
            <label><input type="checkbox" id="fe-required" ${f.required !== false ? "checked" : ""}/> Campo obrigatório</label>
          </div>
          <div class="field">
            <label>Placeholder (texto de ajuda)</label>
            <input type="text" id="fe-placeholder" value="${escapeAttr(f.placeholder || "")}" />
          </div>
          <div class="field">
            <label>Revelar este campo apenas quando (opcional)</label>
            <div class="btn-row" style="gap:.4rem">
              <select id="fe-reveal-field"><option value="">— nenhum —</option>${revealFieldOptions(tabId, f)}</select>
              <input type="text" id="fe-reveal-value" placeholder="valor (ex.: COM ALTERAÇÃO)" value="${escapeAttr(f.revealWhen?.value || "")}" style="flex:1" />
            </div>
          </div>
        </div>
        <footer class="modal-foot">
          <button type="button" class="btn btn-ghost" data-x>Cancelar</button>
          <button type="button" class="btn btn-primary" data-fe-save>Salvar campo</button>
        </footer>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
      if (e.target.getAttribute("data-x") !== null && (e.target.tagName === "BUTTON" || e.target.classList.contains("modal-close"))) close();
    });
    overlay.querySelector("#fe-type").addEventListener("change", (e) => {
      const t = e.target.value;
      overlay.querySelector("#fe-options-wrap").style.display = ["select", "selectextra", "multiselect"].includes(t) ? "" : "none";
    });
    overlay.querySelector("[data-fe-save]").addEventListener("click", () => {
      const label = overlay.querySelector("#fe-label").value.trim() || f.label;
      const type = overlay.querySelector("#fe-type").value;
      const required = overlay.querySelector("#fe-required").checked;
      const placeholder = overlay.querySelector("#fe-placeholder").value.trim();
      const optsRaw = overlay.querySelector("#fe-options").value;
      const options = optsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      const revealField = overlay.querySelector("#fe-reveal-field").value;
      const revealValue = overlay.querySelector("#fe-reveal-value").value.trim();

      const patch = { label, type, required, placeholder };
      if (["select", "selectextra", "multiselect"].includes(type)) patch.options = options;
      if (type === "selectextra") patch.placeholder = placeholder || "Selecione ou MANUAL/NÃO ACAUTELADO";
      if (type === "multiselect") {
        // opções exclusivas = exatamente NENHUM; requer texto = OUTROS
        patch.exclusiveOptions = options.includes("NENHUM") ? ["NENHUM"] : [];
        patch.requiresText = options.includes("OUTROS") ? ["OUTROS"] : [];
      }
      if (revealField && revealValue) patch.revealWhen = { field: revealField, value: revealValue };
      else patch.revealWhen = undefined;

      updateField(schema, tabId, fieldId, patch);
      close();
      render();
    });
  };

  const revealFieldOptions = (tabId, currentField) => {
    const tab = getTabs(schema).find((t) => t.id === tabId);
    const others = getTabFields(tab, schema).filter((f) => f.id !== currentField.id);
    if (!others.length) return "";
    return others
      .map(
        (f) =>
          `<option value="${escapeAttr(f.key)}" ${
            currentField.revealWhen?.field === f.key ? "selected" : ""
          }>${escapeHtml(f.label)}</option>`
      )
      .join("");
  };

  render();
}

function fieldRowHtml(tab, f, fi, total) {
  const typeLabel = FIELD_TYPES[f.type] || f.type;
  const req = f.required !== false ? "obrigatório" : "opcional";
  return `
    <div class="builder-field" data-field="${escapeAttr(f.id)}">
      <div class="builder-field-main">
        <strong>${escapeHtml(f.label)}</strong>
        <span class="muted">${escapeHtml(typeLabel)} · ${req}</span>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-small btn-ghost" data-act="field-up" data-tab="${escapeAttr(tab.id)}" data-field="${escapeAttr(f.id)}" ${fi === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn btn-small btn-ghost" data-act="field-down" data-tab="${escapeAttr(tab.id)}" data-field="${escapeAttr(f.id)}" ${fi === total - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn btn-small btn-ghost" data-act="field-edit" data-tab="${escapeAttr(tab.id)}" data-field="${escapeAttr(f.id)}">Editar</button>
        <button type="button" class="btn btn-small btn-danger" data-act="field-del" data-tab="${escapeAttr(tab.id)}" data-field="${escapeAttr(f.id)}">Excluir</button>
      </div>
    </div>`;
}
