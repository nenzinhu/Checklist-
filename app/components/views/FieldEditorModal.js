"use client";

import { useState, useEffect } from "react";
import { getTabs, getTabFields } from "../../lib/schema.js";

export default function FieldEditorModal({ schema, tabId, fieldId, onSave, onClose }) {
  const tab = getTabs(schema).find((t) => t.id === tabId);
  const f = tab?.fields.find((x) => x.id === fieldId);
  if (!f) return null;

  const [label, setLabel] = useState(f.label);
  const [type, setType] = useState(f.type);
  const [required, setRequired] = useState(f.required !== false);
  const [placeholder, setPlaceholder] = useState(f.placeholder || "");
  const [optionsText, setOptionsText] = useState((f.options || []).join("\n"));
  const [revealField, setRevealField] = useState(f.revealWhen?.field || "");
  const [revealValue, setRevealValue] = useState(f.revealWhen?.value || "");

  const usesOptions = ["select", "selectextra", "multiselect"].includes(type);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const save = () => {
    const optsRaw = optionsText;
    const options = optsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
    const patch = {
      label: label.trim() || f.label,
      type,
      required,
      placeholder,
    };
    if (usesOptions) patch.options = options;
    if (type === "selectextra") patch.placeholder = placeholder || "Selecione ou MANUAL/NÃO ACAUTELADO";
    if (type === "multiselect") {
      patch.exclusiveOptions = options.includes("NENHUM") ? ["NENHUM"] : [];
      patch.requiresText = options.includes("OUTROS") ? ["OUTROS"] : [];
    }
    if (revealField && revealValue) patch.revealWhen = { field: revealField, value: revealValue };
    else patch.revealWhen = undefined;
    onSave(patch);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Editar campo</h2>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-text" style={{ display: "grid", gap: ".8rem" }}>
          <div className="field">
            <label>Rótulo / Nome</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries({
                text: "Texto",
                textarea: "Texto longo",
                number: "Número",
                date: "Data",
                select: "Lista (escolha única)",
                selectextra: "Equipamento (com MANUAL/NÃO ACAUTELADO)",
                multiselect: "Múltipla escolha",
                simnao: "Sim / Não",
              }).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ display: usesOptions ? "block" : "none" }}>
            <label>
              Opções (uma por linha)
              {type === "multiselect" ? " — use NENHUM para opção exclusiva" : ""}
            </label>
            <textarea rows={5} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
          </div>
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />{" "}
              Campo obrigatório
            </label>
          </div>
          <div className="field">
            <label>Placeholder (texto de ajuda)</label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Revelar este campo apenas quando (opcional)</label>
            <div className="btn-row" style={{ gap: ".4rem" }}>
              <select value={revealField} onChange={(e) => setRevealField(e.target.value)}>
                <option value="">— nenhum —</option>
                {getTabFields(tab, schema)
                  .filter((x) => x.id !== f.id)
                  .map((x) => (
                    <option key={x.id} value={x.key}>
                      {x.label}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                placeholder="valor (ex.: COM ALTERAÇÃO)"
                value={revealValue}
                style={{ flex: 1 }}
                onChange={(e) => setRevealValue(e.target.value)}
              />
            </div>
          </div>
        </div>
        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            Salvar campo
          </button>
        </footer>
      </div>
    </div>
  );
}
