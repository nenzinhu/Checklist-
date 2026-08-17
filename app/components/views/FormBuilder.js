"use client";

import { useState } from "react";
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
} from "../../lib/schema.js";
import FieldEditorModal from "./FieldEditorModal.js";

const TYPE_OPTIONS = Object.entries(FIELD_TYPES);

export default function FormBuilderView({ onBack }) {
  const [schema, setSchema] = useState(() => getSchema());
  const [editing, setEditing] = useState(null); // {tabId, fieldId} | null

  const tabs = getTabs(schema);

  const rerender = (next) => setSchema({ ...next });

  const handle = (act, tabId, fieldId) => {
    switch (act) {
      case "back":
        onBack();
        return;
      case "tab-add": {
        const inp = document.getElementById("newtab");
        const label = inp.value.trim();
        if (!label) {
          alert("Informe o nome da aba.");
          return;
        }
        const next = createTab(schema, label);
        rerender(next);
        inp.value = "";
        return;
      }
      case "tab-del": {
        const tab = getTabs(schema).find((t) => t.id === tabId);
        if (!confirm(`Excluir a aba "${tab?.label || ""}" e todos os seus campos?`)) return;
        rerender(deleteTab(schema, tabId));
        return;
      }
      case "tab-up":
        rerender(moveTab(schema, tabId, "up"));
        return;
      case "tab-down":
        rerender(moveTab(schema, tabId, "down"));
        return;
      case "field-add": {
        const nameInp = document.getElementById(`newfield-${tabId}`);
        const typeSel = document.getElementById(`newfieldtype-${tabId}`);
        const label = nameInp.value.trim();
        const type = typeSel.value;
        if (!label) {
          alert("Informe o nome do campo.");
          return;
        }
        rerender(addField(schema, tabId, { label, type, required: true }));
        nameInp.value = "";
        return;
      }
      case "field-del": {
        const tab = getTabs(schema).find((t) => t.id === tabId);
        const f = tab?.fields.find((x) => x.id === fieldId);
        if (!confirm(`Excluir o campo "${f?.label || ""}"?`)) return;
        rerender(deleteField(schema, tabId, fieldId));
        return;
      }
      case "field-up":
        rerender(moveField(schema, tabId, fieldId, "up"));
        return;
      case "field-down":
        rerender(moveField(schema, tabId, fieldId, "down"));
        return;
      case "field-edit":
        setEditing({ tabId, fieldId });
        return;
      case "reset": {
        if (
          !confirm(
            "Restaurar o registro para o padrão original? Isto apaga suas abas e campos personalizados."
          )
        )
          return;
        rerender(resetSchema());
        return;
      }
      case "save": {
        if (saveSchema(schema)) {
          alert("Alterações salvas. O novo formato já vale para novos registros.");
          onBack();
        } else {
          alert("Não foi possível salvar (armazenamento indisponível).");
        }
        return;
      }
    }
  };

  return (
    <div>
      <header className="page-header compact">
        <button type="button" className="link-back" onClick={() => handle("back")}>
          ← Painel Admin
        </button>
        <h1 data-anim="title">Editor de Formulário</h1>
        <p className="subtitle">Crie abas e campos do registro</p>
      </header>

      <div className="builder-toolbar">
        <input type="text" id="newtab" placeholder="Nome da nova aba (ex.: Observações)" />
        <button type="button" className="btn btn-small btn-primary" onClick={() => handle("tab-add")}>
          + Aba
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => handle("reset")}>
          Restaurar padrão
        </button>
      </div>

      <div className="builder-list">
        {tabs.length === 0 && <p className="empty">Nenhuma aba. Crie uma acima.</p>}
        {tabs.map((tab, ti) => {
          const fields = getTabFields(tab, schema);
          return (
            <div className="builder-tab" key={tab.id} data-tab={tab.id}>
              <div className="builder-tab-head">
                <div className="builder-tab-title">
                  <strong>
                    {ti + 1}. {tab.label}
                  </strong>
                  <span className="muted">{fields.length} campo(s)</span>
                </div>
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    disabled={ti === 0}
                    onClick={() => handle("tab-up", tab.id)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    disabled={ti === tabs.length - 1}
                    onClick={() => handle("tab-down", tab.id)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => handle("tab-del", tab.id)}
                  >
                    Excluir aba
                  </button>
                </div>
              </div>

              <div className="builder-fields">
                {fields.length === 0 ? (
                  <p className="empty" style={{ padding: ".5rem 0" }}>
                    Nenhum campo ainda. Adicione abaixo.
                  </p>
                ) : (
                  fields.map((f, fi) => {
                    const typeLabel = FIELD_TYPES[f.type] || f.type;
                    const req = f.required !== false ? "obrigatório" : "opcional";
                    return (
                      <div className="builder-field" key={f.id} data-field={f.id}>
                        <div className="builder-field-main">
                          <strong>{f.label}</strong>
                          <span className="muted">
                            {typeLabel} · {req}
                          </span>
                        </div>
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-small btn-ghost"
                            disabled={fi === 0}
                            onClick={() => handle("field-up", tab.id, f.id)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn btn-small btn-ghost"
                            disabled={fi === fields.length - 1}
                            onClick={() => handle("field-down", tab.id, f.id)}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn btn-small btn-ghost"
                            onClick={() => handle("field-edit", tab.id, f.id)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() => handle("field-del", tab.id, f.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="builder-addfield">
                <input type="text" id={`newfield-${tab.id}`} placeholder="Nome do novo campo" />
                <select id={`newfieldtype-${tab.id}`}>
                  {TYPE_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-small btn-primary"
                  onClick={() => handle("field-add", tab.id)}
                >
                  + Campo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="btn-row" style={{ marginTop: "1rem" }}>
        <button type="button" className="btn btn-ghost" onClick={() => handle("back")}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={() => handle("save")}>
          Salvar alterações
        </button>
      </div>

      {editing && (
        <FieldEditorModal
          schema={schema}
          tabId={editing.tabId}
          fieldId={editing.fieldId}
          onSave={(patch) => {
            const next = updateField(schema, editing.tabId, editing.fieldId, patch);
            rerender(next);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
