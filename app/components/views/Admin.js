"use client";

import { getSchema, getTabs, getTabFields, isFieldVisible } from "../../lib/schema.js";
import { formatDate, todayISO } from "../../lib/util.js";

function cell(v) {
  const s = v === "" || v == null ? "—" : String(v);
  return <td>{s}</td>;
}

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

export default function AdminView({
  items,
  filterDate,
  onLogout,
  onFilter,
  onOpenItem,
  onChangePass,
  onBuilder,
  onDashboard,
}) {
  const schema = getSchema();
  const data = filterDate || todayISO();
  const dayItems = items.filter((it) => (it.data?.data || "") === data);
  const sorted = [...dayItems].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const allFields = getTabs(schema).flatMap((tab) => getTabFields(tab, schema));

  return (
    <div>
      <header className="page-header compact">
        <button type="button" className="link-back" onClick={onLogout}>
          ← Sair
        </button>
        <h1 data-anim="title">Painel Admin</h1>
        <p className="progress" aria-live="polite">
          {dayItems.length} registro(s) em {formatDate(data)}
        </p>
        <div className="btn-row" style={{ marginTop: ".4rem" }}>
          <button type="button" className="btn btn-small btn-ghost" onClick={onBuilder}>
            ✎ Editor de Formulário
          </button>
          <button type="button" className="btn btn-small btn-ghost" onClick={onChangePass}>
            Alterar Senha
          </button>
          <button type="button" className="btn btn-small btn-primary" onClick={onDashboard}>
            📊 Dashboard
          </button>
        </div>
      </header>

      <div className="toolbar admin-filter">
        <label htmlFor="admin-date">Data da guarnição:</label>
        <input
          type="date"
          id="admin-date"
          name="admin-date"
          value={data}
          onChange={(e) => onFilter(e.target.value || "")}
        />
      </div>

      <section className="admin-section" aria-label="Checklists do dia">
        {sorted.length === 0 ? (
          <p className="empty">Nenhum checklist salvo para esta data.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {allFields.map((f) => (
                    <th key={f.id}>{f.label}</th>
                  ))}
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((it) => {
                  const d = it.data || {};
                  return (
                    <tr key={it.id}>
                      {allFields.map((f) => {
                        const show = isFieldVisible(f, d);
                        const v = show ? cellValue(f, d) : "";
                        const s = v === "" || v == null ? "—" : String(v);
                        return <td key={f.id}>{s}</td>;
                      })}
                      <td>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => onOpenItem(it.id)}
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
