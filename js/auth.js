/** Autenticação simples de administrador (lado do cliente).
 *  Sem backend: as credenciais ficam no código. Isso serve como portaria,
 *  não como segurança real — qualquer um com acesso ao código fonte pode ler.
 *  Para produção, valide no servidor. */

const ADMINS = [
  { user: "9266194", pass: "6194" },
  { user: "9300007", pass: "0007" },
  { user: "admin", pass: "6280760" },
];
export { ADMINS };

const SESSION_KEY = "checklist:admin";

export function checkAdmin(user, pass) {
  return ADMINS.some((a) => a.user === user && a.pass === pass);
}

export function changeAdminPassword(user, newPass) {
  const admin = ADMINS.find((a) => a.user === user);
  if (!admin) return false;
  admin.pass = newPass;
  return true;
}

export function setAdminSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isAdminSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
