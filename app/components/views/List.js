"use client";

import { isItemEditable } from "../../lib/storage.js";
import { formatDate } from "../../lib/util.js";

export default function ListView({
  items,
  hasDraft,
  onNew,
  onContinueDraft,
  onDiscardDraft,
  onOpen,
  onDelete,
  onAdmin,
}) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return (
    <div>
      <header className="page-header">
        <p className="eyebrow">Polícia Militar Rodoviária</p>
        <h1 data-anim="title">Cautelas &amp; Vistorias</h1>
        <p className="subtitle">Registros neste aparelho</p>
      </header>

      {hasDraft && (
        <div className="banner draft-banner" role="status">
          <p>Há um rascunho em andamento.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={onContinueDraft}>
              Continuar
            </button>
            <button type="button" className="btn btn-ghost" onClick={onDiscardDraft}>
              Descartar
            </button>
          </div>
        </div>
      )}

      <div className="toolbar">
        <button type="button" className="btn btn-primary btn-block" onClick={onNew}>
          + Nova Vistoria & Cautela
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onAdmin}>
          Painel Admin
        </button>
      </div>

      <section className="list-section" aria-label="Checklists salvos">
        <h2 className="section-title">Salvos ({sorted.length})</h2>
        {sorted.length === 0 ? (
        <p className="empty">Nenhum registro salvo ainda.</p>
        ) : (
          <ul className="item-list">
            {sorted.map((item) => {
              const editavel = isItemEditable(item);
              return (
                <li className="item-row" key={item.id} data-id={item.id}>
                  <div className="item-main">
                    <strong>{item.id ? formatDate(item.data?.data) : "—"}</strong>
                    <span>{item.data?.viatura || "—"}</span>
                    <span className="muted">
                      {item.data?.patrulheiro || "—"} / {item.data?.motorista || "—"}
                    </span>
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={!editavel}
                      title={editavel ? "" : "Edição bloqueada após 24h"}
                      onClick={() => onOpen(item.id)}
                    >
                      {editavel ? "Abrir" : "Bloqueado"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => {
                        if (confirm("Excluir este registro?")) onDelete(item.id);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
