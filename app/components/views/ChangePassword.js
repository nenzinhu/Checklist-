"use client";

import { useState } from "react";
import { ADMINS } from "../../lib/auth.js";

export default function ChangePasswordView({ error, success, onBack, onChange }) {
  const [user, setUser] = useState(ADMINS[0]?.user || "");
  const [newPass, setNewPass] = useState("");

  return (
    <div>
      <header className="page-header compact">
        <button type="button" className="link-back" onClick={onBack}>
          ← Voltar
        </button>
        <h1 data-anim="title">Alterar Senha</h1>
        <p className="subtitle">Acesso administrativo</p>
      </header>

      {error && (
        <div className="banner error-banner" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="banner success-banner" role="status">
          {success}
        </div>
      )}

      <form
        className="form-body"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onChange(user, newPass);
        }}
      >
        <div className="field">
          <label htmlFor="cp-user">Usuário</label>
          <select
            id="cp-user"
            name="user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          >
            {ADMINS.map((a) => (
              <option key={a.user} value={a.user}>
                {a.user}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cp-new">Nova senha</label>
          <input
            type="text"
            id="cp-new"
            name="newPass"
            autoComplete="off"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Voltar
          </button>
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
