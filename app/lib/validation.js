/**
 * Validação dinâmica, baseada no schema.
 * Valida apenas campos visíveis e obrigatórios.
 * Retorna { ok: boolean, errors: { fieldKey: message } }
 */

import { getSchema, getTabs, getTabFields, isFieldVisible } from "./schema.js";

function requiredText(value, message = "Campo obrigatório") {
  if (value == null || String(value).trim() === "") return message;
  return null;
}

function requiredNumber(value, message = "Informe um número ≥ 0") {
  if (value === "" || value == null) return message;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return message;
  return null;
}

function requiredArray(value, message = "Selecione ao menos uma opção") {
  if (!Array.isArray(value) || value.length === 0) return message;
  return null;
}

/** Valida o valor de um único campo conforme seu tipo. */
function validateField(field, data) {
  const value = data[field.key];
  const errors = {};

  if (!field.required) {
    const empty =
      value === "" || value == null ||
      (Array.isArray(value) && value.length === 0);
    if (empty) return errors;
  }

  switch (field.type) {
    case "number": {
      const e = requiredNumber(value);
      if (e) errors[field.key] = e;
      break;
    }
    case "multiselect": {
      const e = requiredArray(value);
      if (e) {
        errors[field.key] = e;
        break;
      }
      const arr = value || [];
      if (Array.isArray(field.exclusiveOptions) && field.exclusiveOptions.length) {
        const hasExclusive = arr.some((v) => field.exclusiveOptions.includes(v));
        if (hasExclusive && arr.length > 1) {
          errors[field.key] = `${arr[0]} não pode ser combinado com outras opções`;
          break;
        }
      }
      if (Array.isArray(field.requiresText) && field.requiresText.length) {
        const needs = arr.some((v) => field.requiresText.includes(v));
        if (needs) {
          const t = requiredText(data[`${field.key}Texto`], "Descreva a opção selecionada");
          if (t) errors[`${field.key}Texto`] = t;
        }
      }
      break;
    }
    case "selectextra": {
      if (value === "MANUAL") {
        const t = requiredText(data[`${field.key}Manual`], "Descreva o item");
        if (t) errors[`${field.key}Manual`] = t;
      } else if (!value) {
        errors[field.key] = "Selecione uma opção";
      }
      break;
    }
    default: {
      const e = requiredText(value);
      if (e) errors[field.key] = field.type === "date" ? "Informe a data" : e;
      break;
    }
  }

  return errors;
}

/** Valida todos os campos de uma aba (somente os visíveis). */
export function validateTab(tabIndex, data, schema = getSchema()) {
  const tabs = getTabs(schema);
  const errors = {};
  const tab = tabs[tabIndex];
  if (!tab) return { ok: true, errors };

  for (const field of getTabFields(tab, schema)) {
    if (!isFieldVisible(field, data)) continue;
    Object.assign(errors, validateField(field, data));
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function isTabValid(tabIndex, data, schema = getSchema()) {
  return validateTab(tabIndex, data, schema).ok;
}

/** Valida todas as abas visíveis. */
export function validateAll(data, schema = getSchema()) {
  const allErrors = {};
  const tabs = getTabs(schema);
  for (let i = 0; i < tabs.length; i++) {
    const { errors } = validateTab(i, data, schema);
    Object.assign(allErrors, errors);
  }
  return { ok: Object.keys(allErrors).length === 0, errors: allErrors };
}

export function firstErrorField(errors) {
  const keys = Object.keys(errors);
  return keys.length ? keys[0] : null;
}
