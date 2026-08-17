"use client";

import { useState } from "react";

export default function LoginView({ error, onLogin, onCancel }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div>
      <header className="page-header compact">
        <h1 data-anim="title">Acesso Administrativo</h1>
        <p className="subtitle">Painel restrito</p>
      </header>

      {error && (
        <div className="banner error-banner" role="alert">
          {error}
        </div>
      )}

      <form
        className="form-body"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onLogin(user.trim(), pass);
        }}
      >
        <div className="field">
          <label htmlFor="login-user">Usuário</label>
          <input
            type="text"
            id="login-user"
            name="user"
            inputMode="numeric"
            autoComplete="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Senha</label>
          <input
            type="password"
            id="login-pass"
            name="pass"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Voltar
          </button>
          <button type="submit" className="btn btn-primary">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
