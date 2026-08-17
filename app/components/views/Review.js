"use client";

import { getSchema, getTabs, getTabFields, isFieldVisible } from "../../lib/schema.js";
import { formatDate } from "../../lib/util.js";

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

export default function ReviewView({ data, saveError, onSave, onEdit, onWhatsapp, onCopy }) {
  const schema = getSchema();

  const sections = getTabs(schema)
    .map((tab) => {
      const rows = getTabFields(tab, schema)
        .filter((f) => isFieldVisible(f, data))
        .map((f) => {
          let extra = null;
          if (
            f.type === "multiselect" &&
            Array.isArray(f.requiresText) &&
            f.requiresText.length &&
            Array.isArray(data[f.key]) &&
            data[f.key].some((v) => f.requiresText.includes(v))
          ) {
            const tKey = `${f.key}Texto`;
            if (data[tKey]) {
              extra = (
                <div className="review-row">
                  <dt>{f.requiresTextLabel || f.label + " (DETALHE)"}</dt>
                  <dd>{data[tKey]}</dd>
                </div>
              );
            }
          }
          return (
            <div key={f.id}>
              <div className="review-row">
                <dt>{f.label}</dt>
                <dd>{displayValue(f, data)}</dd>
              </div>
              {extra}
            </div>
          );
        });
      if (!rows.length) return null;
      return (
        <section className="review-block" key={tab.id}>
          <h2>{tab.label}</h2>
          <dl>{rows}</dl>
        </section>
      );
    })
    .filter(Boolean);

  return (
    <div>
      <header className="page-header compact">
        <p className="eyebrow">Confirmação</p>
        <h1 data-anim="title">Revisão</h1>
        <p className="subtitle">Confira antes de salvar</p>
      </header>

      {saveError && (
        <div className="banner error-banner" role="alert">
          {saveError}
        </div>
      )}

      <div className="review-body">{sections}</div>

      <footer className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onEdit}>
          Voltar a editar
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCopy}>
          Copiar
        </button>
        <button type="button" className="btn btn-whats" onClick={onWhatsapp}>
          Enviar WhatsApp
        </button>
        <button type="button" className="btn btn-primary" onClick={onSave}>
          Salvar
        </button>
      </footer>
    </div>
  );
}
