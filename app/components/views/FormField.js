"use client";

import { useState } from "react";

const EQUIP_OPTIONS = ["MANUAL", "NÃO ACAUTELADO"];

/** Renderiza um único campo dinâmico conforme o schema. */
export default function FormField({ field, data, errors, onChange, exclude = [] }) {
  if (!field) return null;
  const name = field.key;
  const value = data[name] ?? "";
  const err = errors[name];

  const set = (patch) => {
    onChange({ ...patch });
  };

  // selectextra: caixa MANUAL condicional
  if (field.type === "selectextra") {
    const baseOpts = (field.options || []).filter((o) => !exclude.includes(o));
    const items = [...baseOpts, ...EQUIP_OPTIONS];
    const isManual = value === "MANUAL";
    const manualErr = errors[`${name}Manual`];
    return (
      <div>
        <div className={`field ${err ? "has-error" : ""}`} data-field={name}>
          <label htmlFor={`field-${name}`}>
            {field.label}
            {field.required ? <span className="req">*</span> : null}
          </label>
          <select
            id={`field-${name}`}
            name={name}
            value={value}
            onChange={(e) =>
              set({
                [name]: e.target.value,
                // limpa descrição manual se não for MANUAL
                ...(e.target.value !== "MANUAL" ? { [`${name}Manual`]: "" } : {}),
              })
            }
          >
            <option value="">{field.placeholder || "Selecione"}</option>
            {items.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {err && (
            <p className="error-msg" id={`err-${name}`}>
              {err}
            </p>
          )}
        </div>
        {isManual && (
          <div className={`field ${manualErr ? "has-error" : ""}`} data-field={`${name}Manual`}>
            <label htmlFor={`field-${name}Manual`}>
              {field.label} (DESCRIÇÃO) <span className="req">*</span>
            </label>
            <input
              type="text"
              id={`field-${name}Manual`}
              name={`${name}Manual`}
              value={data[`${name}Manual`] || ""}
              placeholder="Descreva o item"
              onChange={(e) => set({ [`${name}Manual`]: e.target.value })}
            />
            {manualErr && (
              <p className="error-msg" id={`err-${name}Manual`}>
                {manualErr}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // multiselect
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    const tKey = `${name}Texto`;
    const showText = Array.isArray(field.requiresText) && field.requiresText.length
      ? selected.some((v) => field.requiresText.includes(v))
      : false;
    const textErr = errors[tKey];

    const toggle = (opt, checked) => {
      let next = checked ? [...selected, opt] : selected.filter((x) => x !== opt);
      // exclusividade
      if (Array.isArray(field.exclusiveOptions) && field.exclusiveOptions.length) {
        if (checked && field.exclusiveOptions.includes(opt)) {
          next = [opt];
        } else if (checked) {
          next = next.filter((x) => !field.exclusiveOptions.includes(x));
        }
      }
      set({ [name]: next });
    };

    return (
      <div>
        <div className={`field ${err ? "has-error" : ""}`} data-field={name}>
          <label>
            {field.label}
            {field.required ? <span className="req">*</span> : null}
          </label>
          <div className="check-group" id={`field-${name}`}>
            {(field.options || []).map((opt) => (
              <label className="check-row" key={opt}>
                <input
                  type="checkbox"
                  name={name}
                  value={opt}
                  checked={selected.includes(opt)}
                  onChange={(e) => toggle(opt, e.target.checked)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {err && (
            <p className="error-msg" id={`err-${name}`}>
              {err}
            </p>
          )}
        </div>
        {showText && (
          <div className={`field ${textErr ? "has-error" : ""}`} data-field={tKey}>
            <label htmlFor={`field-${tKey}`}>
              {field.requiresTextLabel || `${field.label} (DETALHE)`}{" "}
              <span className="req">*</span>
            </label>
            <input
              type="text"
              id={`field-${tKey}`}
              name={tKey}
              value={data[tKey] || ""}
              placeholder="Descreva"
              onChange={(e) => set({ [tKey]: e.target.value })}
            />
            {textErr && (
              <p className="error-msg" id={`err-${tKey}`}>
                {textErr}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // campos simples
  const common = {
    id: `field-${name}`,
    name,
    value: value,
  };

  let control;
  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          {...common}
          rows={3}
          placeholder={field.placeholder || ""}
          value={value || ""}
          onChange={(e) => set({ [name]: e.target.value })}
        />
      );
      break;
    case "number":
      control = (
        <input
          type="number"
          {...common}
          min={0}
          step={1}
          value={value === "" || value == null ? "" : value}
          onChange={(e) => set({ [name]: e.target.value === "" ? "" : e.target.value })}
        />
      );
      break;
    case "date":
      control = (
        <input
          type="date"
          {...common}
          value={value || ""}
          onChange={(e) => set({ [name]: e.target.value })}
        />
      );
      break;
    case "select":
    case "simnao":
      control = (
        <select
          {...common}
          value={value || ""}
          onChange={(e) => set({ [name]: e.target.value })}
        >
          <option value="">Selecione…</option>
          {(field.options || (field.type === "simnao" ? ["SIM", "NÃO"] : []))
            .filter((o) => !exclude.includes(o))
            .map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
        </select>
      );
      break;
    case "text":
    default:
      control = (
        <input
          type="text"
          {...common}
          value={value || ""}
          placeholder={field.placeholder || ""}
          onChange={(e) => set({ [name]: e.target.value })}
        />
      );
  }

  return (
    <div className={`field ${err ? "has-error" : ""}`} data-field={name}>
      <label htmlFor={`field-${name}`}>
        {field.label}
        {field.required ? <span className="req">*</span> : null}
      </label>
      {control}
      {err && (
        <p className="error-msg" id={`err-${name}`}>
          {err}
        </p>
      )}
    </div>
  );
}
