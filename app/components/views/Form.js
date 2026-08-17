"use client";

import { useEffect, useRef } from "react";
import { getSchema, getTabs, getTabFields, isFieldVisible } from "../../lib/schema.js";
import { isTabValid } from "../../lib/validation.js";
import FormField from "./FormField.js";

export default function FormView({
  draft,
  errors = {},
  onChange,
  onTabChange,
  onPrev,
  onNext,
  onCancel,
}) {
  const schema = getSchema();
  const tabs = getTabs(schema);
  const tab = draft.currentTab ?? 0;
  const data = draft.data;
  const progress = `${tab + 1}/${tabs.length}`;
  const firstErr = Object.keys(errors)[0];

  // foca o primeiro erro quando troca de aba/erros
  const errorRef = useRef(firstErr);
  useEffect(() => {
    if (firstErr && firstErr !== errorRef.current) {
      const el =
        document.getElementById(`field-${firstErr}`) ||
        document.querySelector(`[data-field="${firstErr}"] input, [data-field="${firstErr}"] select, [data-field="${firstErr}"] textarea`);
      if (el && typeof el.focus === "function") el.focus();
    }
    errorRef.current = firstErr;
  }, [firstErr]);

  const fields = getTabFields(tabs[tab], schema).filter((f) => isFieldVisible(f, data));

  // patrulheiro e motorista não podem se repetir: remove o já escolhido
  // no select do outro campo.
  const patrulheiro = data.patrulheiro;
  const motorista = data.motorista;
  const excludeFor = (key) => {
    if (key === "patrulheiro") return motorista ? [motorista] : [];
    if (key === "motorista") return patrulheiro ? [patrulheiro] : [];
    return [];
  };

  const setFieldValues = (patch) => {
    onChange({ ...data, ...patch }, tab);
  };

  return (
    <div>
      <header className="page-header compact">
        <button type="button" className="link-back" onClick={onCancel}>
          ← Lista
        </button>
        <h1 data-anim="title">Preenchimento</h1>
        <p className="progress" aria-live="polite">
          Etapa {progress}
        </p>
      </header>

      <div className="tab-bar">
        <label className="sr-only" htmlFor="tab-select">
          Categoria
        </label>
        <select
          id="tab-select"
          className="tab-select"
          aria-label="Categoria"
          value={tab}
          onChange={(e) => {
            onChange({ ...data }, tab);
            onTabChange(Number(e.target.value));
          }}
        >
          {tabs.map((t, i) => {
            const valid = isTabValid(i, data, schema);
            return (
              <option key={t.id} value={i}>
                {i + 1}. {t.label}
                {valid ? " ✓" : ""}
                {i === tab ? " (atual)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      <form className="form-body" noValidate id="checklist-form">
        <h2 className="tab-title">{tabs[tab].label}</h2>
        {fields.map((f) => (
          <FormField
            key={f.id}
            field={f}
            data={data}
            errors={errors}
            exclude={excludeFor(f.key)}
            onChange={setFieldValues}
          />
        ))}
      </form>

      <footer className="form-footer">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={tab === 0}
          onClick={() => {
            onChange({ ...data }, tab);
            onPrev();
          }}
        >
          Anterior
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onChange({ ...data }, tab);
            onNext();
          }}
        >
          {tab === tabs.length - 1 ? "Revisar" : "Próximo"}
        </button>
      </footer>
    </div>
  );
}
