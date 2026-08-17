import { getSchema, getTabs, getTabFields, isFieldVisible } from "../schema.js";
import { isTabValid } from "../validation.js";

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

const EQUIP_OPTIONS = ["MANUAL", "NÃO ACAUTELADO"];

function optionList(options, selected, placeholder = "Selecione…") {
  const sel = selected == null ? "" : String(selected);
  return `
    <option value="">${placeholder}</option>
    ${options
      .map(
        (o) =>
          `<option value="${escapeAttr(o)}" ${o === sel ? "selected" : ""}>${escapeHtml(o)}</option>`
      )
      .join("")}
  `;
}

function selectControl(name, options, value, placeholder) {
  return `<select id="field-${escapeAttr(name)}" name="${escapeAttr(name)}">${optionList(
    options,
    value,
    placeholder
  )}</select>`;
}

function fieldWrap(name, label, controlHtml, error, required = true) {
  return `
    <div class="field ${error ? "has-error" : ""}" data-field="${escapeAttr(name)}">
      <label for="field-${escapeAttr(name)}">${escapeHtml(label)}${
    required ? ' <span class="req">*</span>' : ""
  }</label>
      ${controlHtml}
      ${
        error
          ? `<p class="error-msg" id="err-${escapeAttr(name)}">${escapeHtml(error)}</p>`
          : ""
      }
    </div>
  `;
}

/** Renderiza um único campo dinâmico conforme o schema. */
function renderField(field, data, errors) {
  if (!isFieldVisible(field, data)) return "";
  const name = field.key;
  const value = data[name] ?? "";
  const err = errors[name];

  switch (field.type) {
    case "textarea":
      return fieldWrap(
        name,
        field.label,
        `<textarea id="field-${escapeAttr(name)}" name="${escapeAttr(
          name
        )}" rows="3" placeholder="${escapeAttr(field.placeholder || "")}">${escapeHtml(
          value || ""
        )}</textarea>`,
        err,
        field.required
      );

    case "number":
      return fieldWrap(
        name,
        field.label,
        `<input type="number" id="field-${escapeAttr(name)}" name="${escapeAttr(
          name
        )}" min="0" step="1" value="${escapeAttr(
          value === "" || value == null ? "" : value
        )}" />`,
        err,
        field.required
      );

    case "date":
      return fieldWrap(
        name,
        field.label,
        `<input type="date" id="field-${escapeAttr(name)}" name="${escapeAttr(
          name
        )}" value="${escapeAttr(value || "")}" />`,
        err,
        field.required
      );

    case "select":
      return fieldWrap(
        name,
        field.label,
        selectControl(name, field.options || [], value, "Selecione…"),
        err,
        field.required
      );

    case "simnao":
      return fieldWrap(
        name,
        field.label,
        selectControl(name, ["SIM", "NÃO"], value, "Selecione…"),
        err,
        field.required
      );

    case "selectextra": {
      const items = [...(field.options || []), ...EQUIP_OPTIONS];
      const isManual = value === "MANUAL";
      const manualBox = isManual
        ? fieldWrap(
            `${name}Manual`,
            `${field.label} (DESCRIÇÃO)`,
            `<input type="text" id="field-${escapeAttr(name)}Manual" name="${escapeAttr(
              name
            )}Manual" value="${escapeAttr(data[`${name}Manual`] || "")}" placeholder="Descreva o item" />`,
            errors[`${name}Manual`],
            true
          )
        : "";
      return (
        fieldWrap(
          name,
          field.label,
          selectControl(name, items, value, field.placeholder || "Selecione"),
          err,
          false
        ) + manualBox
      );
    }

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      const checks = (field.options || [])
        .map(
          (opt) => `
        <label class="check-row">
          <input type="checkbox" name="${escapeAttr(name)}" value="${escapeAttr(
            opt
          )}" ${selected.includes(opt) ? "checked" : ""} />
          <span>${escapeHtml(opt)}</span>
        </label>`
        )
        .join("");
      let html = fieldWrap(
        name,
        field.label,
        `<div class="check-group" id="field-${escapeAttr(name)}">${checks}</div>`,
        err,
        field.required
      );
      // Campo de texto condicional (ex.: quando marca OUTROS)
      if (
        Array.isArray(field.requiresText) &&
        field.requiresText.length &&
        selected.some((v) => field.requiresText.includes(v))
      ) {
        const tKey = `${name}Texto`;
        html += fieldWrap(
          tKey,
          field.requiresTextLabel || `${field.label} (DETALHE)`,
          `<input type="text" id="field-${escapeAttr(tKey)}" name="${escapeAttr(
            tKey
          )}" value="${escapeAttr(data[tKey] || "")}" placeholder="Descreva" />`,
          errors[tKey],
          true
        );
      }
      return html;
    }

    case "text":
    default:
      return fieldWrap(
        name,
        field.label,
        `<input type="text" id="field-${escapeAttr(name)}" name="${escapeAttr(
          name
        )}" value="${escapeAttr(value || "")}" placeholder="${escapeAttr(
          field.placeholder || ""
        )}" />`,
        err,
        field.required
      );
  }
}

export function renderTabFields(tabIndex, schema, data, errors) {
  const tab = getTabs(schema)[tabIndex];
  if (!tab) return "";
  return getTabFields(tab, schema)
    .map((f) => renderField(f, data, errors))
    .join("");
}

/** Lê valores do DOM da aba atual para o objeto data. */
export function readFormFields(root, data) {
  const schema = getSchema();
  const next = { ...data };
  const form = root.querySelector("#checklist-form");
  if (!form) return next;

  for (const field of getTabs(schema)
    .flatMap((t) => getTabFields(t, schema))
    .filter((f) => f.tab === undefined || true)) {
    const name = field.key;
    // Campo oculto (hideWhen/revealWhen) -> não ler valor do DOM, zera para não poluir.
    if (!isFieldVisible(field, data)) {
      next[name] = field.type === "multiselect" ? [] : "";
      continue;
    }
    if (field.type === "multiselect") {
      const checks = form.querySelectorAll(`input[name="${escapeAttr(name)}"]`);
      next[name] = [...checks].filter((c) => c.checked).map((c) => c.value);
      // texto condicional
      if (Array.isArray(field.requiresText) && field.requiresText.length) {
        const tEl = form.querySelector(`#field-${escapeAttr(name)}Texto`);
        next[`${name}Texto`] = tEl ? tEl.value : (data[`${name}Texto`] || "");
      }
      continue;
    }
    const el = form.querySelector(`#field-${escapeAttr(name)}`);
    if (!el) continue;
    next[name] = el.value === "" ? "" : el.value;
    // selectextra: limpa descrição manual se não for MANUAL
    if (field.type === "selectextra" && el.value !== "MANUAL") {
      next[`${name}Manual`] = "";
    }
  }

  return next;
}

/**
 * @param {HTMLElement} root
 * @param {{
 *   draft: object,
 *   errors: object,
 *   onChange: (data, currentTab) => void,
 *   onTabChange: (index) => void,
 *   onPrev: () => void,
 *   onNext: () => void,
 *   onCancel: () => void,
 * }} opts
 */
export function renderForm(root, { draft, errors = {}, onChange, onTabChange, onPrev, onNext, onCancel }) {
  const schema = getSchema();
  const tabs = getTabs(schema);
  const tab = draft.currentTab ?? 0;
  const data = draft.data;
  const progress = `${tab + 1}/${tabs.length}`;

  const tabOptions = tabs
    .map((t, i) => {
      const valid = isTabValid(i, data, schema);
      const mark = valid ? " ✓" : "";
      const current = i === tab ? " (atual)" : "";
      return `<option value="${i}" ${i === tab ? "selected" : ""}>${i + 1}. ${escapeHtml(
        t.label
      )}${mark}${current}</option>`;
    })
    .join("");

  root.innerHTML = `
    <header class="page-header compact">
      <button type="button" class="link-back" data-action="cancel">← Lista</button>
      <h1>Preenchimento</h1>
      <p class="progress" aria-live="polite">Etapa ${progress}</p>
    </header>

    <div class="tab-bar">
      <label class="sr-only" for="tab-select">Categoria</label>
      <select id="tab-select" class="tab-select" aria-label="Categoria">
        ${tabOptions}
      </select>
    </div>

    <form id="checklist-form" class="form-body" novalidate>
      <h2 class="tab-title">${escapeHtml(tabs[tab].label)}</h2>
      ${renderTabFields(tab, schema, data, errors)}
    </form>

    <footer class="form-footer">
      <button type="button" class="btn btn-ghost" data-action="prev" ${
        tab === 0 ? "disabled" : ""
      }>Anterior</button>
      <button type="button" class="btn btn-primary" data-action="next">
        ${tab === tabs.length - 1 ? "Revisar" : "Próximo"}
      </button>
    </footer>
  `;

  const form = root.querySelector("#checklist-form");

  const emitChange = () => {
    const updated = readFormFields(root, data);
    onChange(updated, tab);
  };

  form.addEventListener("input", emitChange);

  form.addEventListener("change", (e) => {
    const t = e.target;
    const updated = readFormFields(root, data);

    // Exclusividade em multiselect (ex.: NENHUM)
    if (t && t.type === "checkbox") {
      const field = findFieldByKey(schema, t.name);
      if (field && Array.isArray(field.exclusiveOptions) && field.exclusiveOptions.length) {
        const formEl = root.querySelector("#checklist-form");
        const boxes = [...formEl.querySelectorAll(`input[name="${escapeAttr(t.name)}"]`)];
        if (t.checked && field.exclusiveOptions.includes(t.value)) {
          boxes.forEach((c) => {
            if (c.value !== t.value) c.checked = false;
          });
        } else if (t.checked) {
          const ex = boxes.find((c) => field.exclusiveOptions.includes(c.value));
          if (ex) ex.checked = false;
        }
      }
    }

    onChange(updated, tab);
    // Re-render p/ refletir revealWhen / caixa MANUAL / texto condicional
    onTabChange(tab);
  });

  root.querySelector("#tab-select").addEventListener("change", (e) => {
    const updated = readFormFields(root, data);
    onChange(updated, tab);
    onTabChange(Number(e.target.value));
  });

  root.querySelector('[data-action="prev"]').addEventListener("click", () => {
    const updated = readFormFields(root, data);
    onChange(updated, tab);
    onPrev();
  });

  root.querySelector('[data-action="next"]').addEventListener("click", () => {
    const updated = readFormFields(root, data);
    onChange(updated, tab);
    onNext();
  });

  root.querySelector('[data-action="cancel"]').addEventListener("click", onCancel);

  const firstErr = Object.keys(errors)[0];
  if (firstErr) {
    requestAnimationFrame(() => {
      const el =
        root.querySelector(`#field-${escapeAttr(firstErr)}`) ||
        root.querySelector(
          `[data-field="${escapeAttr(firstErr)}"] input, [data-field="${escapeAttr(
            firstErr
          )}"] select, [data-field="${escapeAttr(firstErr)}"] textarea`
        );
      if (el && typeof el.focus === "function") el.focus();
    });
  }
}

function findFieldByKey(schema, key) {
  for (const tab of getTabs(schema)) {
    for (const f of getTabFields(tab, schema)) {
      if (f.key === key) return f;
    }
  }
  return null;
}
