import { ADMINS } from "../auth.js";

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
 *   success: string | null,
 *   onBack: () => void,
 *   onChange: (user: string, newPass: string) => void,
 * }} opts
 */
export function renderChangePassword(root, { error, success, onBack, onChange }) {
  const options = ADMINS.map(
    (a) => `<option value="${escapeHtml(a.user)}">${escapeHtml(a.user)}</option>`
  ).join("");

  root.innerHTML = `
    <header class="page-header compact">
      <button type="button" class="link-back" data-action="back">← Voltar</button>
      <h1>Alterar Senha</h1>
      <p class="subtitle">Acesso administrativo</p>
    </header>

    ${error ? `<div class="banner error-banner" role="alert">${escapeHtml(error)}</div>` : ""}
    ${success ? `<div class="banner success-banner" role="status">${escapeHtml(success)}</div>` : ""}

    <form id="change-pass-form" class="form-body" novalidate>
      <div class="field">
        <label for="cp-user">Usuário</label>
        <select id="cp-user" name="user">${options}</select>
      </div>
      <div class="field">
        <label for="cp-new">Nova senha</label>
        <input type="text" id="cp-new" name="newPass" autocomplete="off" />
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-action="back">Voltar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `;

  const form = root.querySelector("#change-pass-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = form.querySelector("#cp-user").value;
    const newPass = form.querySelector("#cp-new").value;
    onChange(user, newPass);
  });

  root.querySelector('[data-action="back"]')?.addEventListener("click", onBack);
}
