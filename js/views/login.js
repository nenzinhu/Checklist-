function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {HTMLElement} root
 * @param {{
 *   error: string | null,
 *   onLogin: (user: string, pass: string) => void,
 *   onCancel: () => void,
 * }} opts
 */
export function renderLogin(root, { error, onLogin, onCancel }) {
  root.innerHTML = `
    <header class="page-header compact">
      <h1>Acesso Administrativo</h1>
      <p class="subtitle">Painel restrito</p>
    </header>

    ${error ? `<div class="banner error-banner" role="alert">${escapeHtml(error)}</div>` : ""}

    <form id="admin-login-form" class="form-body" novalidate>
      <div class="field">
        <label for="login-user">Usuário</label>
        <input type="text" id="login-user" name="user" inputmode="numeric" autocomplete="username" />
      </div>
      <div class="field">
        <label for="login-pass">Senha</label>
        <input type="password" id="login-pass" name="pass" autocomplete="current-password" />
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-action="cancel">Voltar</button>
        <button type="submit" class="btn btn-primary">Entrar</button>
      </div>
    </form>
  `;

  const form = root.querySelector("#admin-login-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = form.querySelector("#login-user").value.trim();
    const pass = form.querySelector("#login-pass").value;
    onLogin(user, pass);
  });

  root
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", onCancel);
}
