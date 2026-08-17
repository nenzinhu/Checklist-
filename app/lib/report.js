/**
 * Gera o texto do relatório (WhatsApp) a partir do schema dinâmico.
 */

import { getSchema, getTabs, getTabFields, isFieldVisible } from "./schema.js";

function formatDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function val(v) {
  return v === "" || v == null ? "—" : String(v);
}

function equipLine(label, value, manual) {
  if (value === "MANUAL") return `${label}: ${val(manual)} (MANUAL)`;
  if (value === "NÃO ACAUTELADO") return `${label}: NÃO ACAUTELADO`;
  return `${label}: ${val(value)}`;
}

function fieldLine(field, data) {
  const v = data[field.key];

  if (field.type === "multiselect") {
    const arr = Array.isArray(v) && v.length ? v.join(", ") : "—";
    let line = `${field.label}: ${arr}`;
    if (
      Array.isArray(field.requiresText) &&
      field.requiresText.length &&
      Array.isArray(v) &&
      v.some((x) => field.requiresText.includes(x)) &&
      data[`${field.key}Texto`]
    ) {
      line += ` (${val(data[`${field.key}Texto`])})`;
    }
    return line;
  }

  if (field.type === "selectextra") {
    return equipLine(field.label, v, data[`${field.key}Manual`]);
  }

  if (field.type === "date") {
    return `${field.label}: ${formatDateBR(v)}`;
  }

  return `${field.label}: ${val(v)}`;
}

export function buildReportText(data = {}) {
  const schema = getSchema();
  const L = [];
  L.push("📋 CAUTELA & VISTORIA");
  L.push("");

  for (const tab of getTabs(schema)) {
    const lines = getTabFields(tab, schema)
      .filter((f) => isFieldVisible(f, data))
      .map((f) => fieldLine(f, data));
    if (!lines.length) continue;
    L.push(`➡️ ${tab.label.toUpperCase()}`);
    L.push(...lines);
    L.push("");
  }

  return L.join("\n").replace(/\n+$/, "\n");
}
