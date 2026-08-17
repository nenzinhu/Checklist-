import {
  getDraft,
  saveDraft,
  clearDraft,
  getItems,
  upsertItem,
  deleteItem,
  getItemById,
  createId,
  isItemEditable,
} from "./storage.js";
import { getSchema, getTabs, getAllFields, emptyFormData as schemaEmptyFormData } from "./schema.js";
import { emptyDraft as schemaEmptyDraft } from "./form-data.js";
import {
  validateTab,
  validateAll,
  firstErrorField,
} from "./validation.js";
import { renderList } from "./views/list.js";
import { renderForm } from "./views/form.js";
import { renderReview } from "./views/review.js";
import { renderLogin } from "./views/login.js";
import { renderAdmin } from "./views/admin.js";
import { renderFormBuilder } from "./views/form-builder.js";
import { renderChangePassword } from "./views/change-password.js";
import { renderDashboard } from "./views/dashboard.js";
import { openTextModal } from "./views/modal.js";
import {
  checkAdmin,
  changeAdminPassword,
  setAdminSession,
  clearAdminSession,
  isAdminSession,
} from "./auth.js";
import { buildReportText } from "./report.js";

const appEl = document.getElementById("app");

/** @type {'list' | 'form' | 'review' | 'login' | 'admin' | 'changepass' | 'builder' | 'dashboard'} */
let screen = "list";
/** @type {ReturnType<typeof schemaEmptyDraft> | null} */
let draft = null;
/** @type {Record<string, string>} */
let formErrors = {};
/** @type {string | null} */
let saveError = null;
/** @type {string | null} */
let loginError = null;
/** @type {string} */
let adminFilterDate = "";
/** @type {string | null} */
let changeError = null;
/** @type {string | null} */
let changeSuccess = null;

function showList() {
  screen = "list";
  formErrors = {};
  saveError = null;
  render();
}

function startNewChecklist() {
  const existing = getDraft();
  if (existing) {
    if (
      !confirm(
        "Há um rascunho em andamento. Descartar e começar um novo checklist?"
      )
    ) {
      return;
    }
    clearDraft();
  }
  draft = schemaEmptyDraft();
  draft.data.data = todayISO();
  saveDraft(draft);
  screen = "form";
  formErrors = {};
  render();
}

function continueDraft() {
  const existing = getDraft();
  if (!existing) return;
  draft = normalizeDraft(existing);
  screen = "form";
  formErrors = {};
  render();
}

function discardDraft() {
  if (!confirm("Descartar o rascunho?")) return;
  clearDraft();
  draft = null;
  render();
}

async function openItem(id) {
  const item = await getItemById(id);
  if (!item) return;
  if (!isItemEditable(item)) {
    alert("Este checklist está bloqueado para edição (passou de 24h da criação).");
    return;
  }
  draft = {
    currentTab: 0,
    editingId: item.id,
    data: { ...schemaEmptyFormData(), ...item.data },
  };
  saveDraft(draft);
  screen = "form";
  formErrors = {};
  render();
}

async function removeItem(id) {
  await deleteItem(id);
  render();
}

function normalizeDraft(raw) {
  const schema = getSchema();
  const tabs = getTabs(schema);
  const maxTab = Math.max(0, tabs.length - 1);
  return {
    currentTab: Math.min(Math.max(Number(raw.currentTab) || 0, 0), maxTab),
    editingId: raw.editingId ?? null,
    data: { ...schemaEmptyFormData(schema), ...(raw.data || {}) },
  };
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function persistDraft() {
  if (draft) saveDraft(draft);
}

function onFormChange(data, currentTab) {
  if (!draft) return;
  draft.data = data;
  draft.currentTab = currentTab;
  persistDraft();
}

function onTabChange(index) {
  if (!draft) return;
  draft.currentTab = index;
  formErrors = {};
  persistDraft();
  render();
}

function onPrev() {
  if (!draft || draft.currentTab <= 0) return;
  draft.currentTab -= 1;
  formErrors = {};
  persistDraft();
  render();
}

function onNext() {
  if (!draft) return;
  const { ok, errors } = validateTab(draft.currentTab, draft.data);
  if (!ok) {
    formErrors = errors;
    render();
    return;
  }
  formErrors = {};
  const tabs = getTabs(getSchema());
  if (draft.currentTab >= tabs.length - 1) {
    screen = "review";
    saveError = null;
    persistDraft();
    render();
    return;
  }
  draft.currentTab += 1;
  persistDraft();
  render();
}

function onReviewEdit() {
  screen = "form";
  saveError = null;
  render();
}

async function onSave() {
  if (!draft) return;
  const { ok, errors } = validateAll(draft.data);
  if (!ok) {
    saveError = "Há campos obrigatórios incompletos. Volte a editar.";
    const first = firstErrorField(errors);
    const tabForField = fieldTabIndex(first);
    if (tabForField != null) draft.currentTab = tabForField;
    formErrors = errors;
    render();
    return;
  }

  // Normaliza números
  const data = { ...draft.data };
  for (const f of getAllFields()) {
    if (f.type === "number") data[f.key] = Number(data[f.key]);
  }

  await upsertItem({
    id: draft.editingId || undefined,
    data,
  });

  clearDraft();
  draft = null;
  showList();
}

function onWhatsapp() {
  if (!draft) return;
  const text = buildReportText(draft.data);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

async function onCopy() {
  if (!draft) return;
  const text = buildReportText(draft.data);
  try {
    await navigator.clipboard.writeText(text);
    alert("Relatório copiado para a área de transferência.");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("Relatório copiado para a área de transferência.");
    } catch {
      alert("Não foi possível copiar. Selecione o texto manualmente.");
    }
    document.body.removeChild(ta);
  }
}

function showLogin() {
  screen = "login";
  loginError = null;
  render();
}

function onLogin(user, pass) {
  if (checkAdmin(user, pass)) {
    setAdminSession();
    loginError = null;
    screen = "admin";
    render();
  } else {
    loginError = "Usuário ou senha inválidos.";
    render();
  }
}

function onLogout() {
  clearAdminSession();
  loginError = null;
  adminFilterDate = "";
  showList();
}

async function onAdminOpenItem(id) {
  const item = await getItemById(id);
  if (!item) {
    alert("Checklist não encontrado.");
    return;
  }
  const text = buildReportText(item.data || {});
  openTextModal(`Checklist ${item.data?.viatura || ""} — ${item.data?.data || ""}`, text);
}

function showAdmin() {
  if (!isAdminSession()) {
    showLogin();
    return;
  }
  screen = "admin";
  render();
}

function showBuilder() {
  if (!isAdminSession()) {
    showLogin();
    return;
  }
  screen = "builder";
  render();
}

function showDashboard() {
  if (!isAdminSession()) {
    showLogin();
    return;
  }
  screen = "dashboard";
  render();
}

function showChangePass() {
  if (!isAdminSession()) {
    showLogin();
    return;
  }
  screen = "changepass";
  changeError = null;
  changeSuccess = null;
  render();
}

function onChangePass(user, newPass) {
  if (!newPass || newPass.trim() === "") {
    changeError = "Informe a nova senha.";
    changeSuccess = null;
    render();
    return;
  }
  const ok = changeAdminPassword(user, newPass.trim());
  if (ok) {
    changeSuccess = `Senha do usuário ${user} alterada com sucesso.`;
    changeError = null;
  } else {
    changeError = "Usuário não encontrado.";
    changeSuccess = null;
  }
  render();
}

/** Descobre em qual aba (índice) está um campo, pelo schema. */
function fieldTabIndex(field) {
  if (field == null) return null;
  const tabs = getTabs(getSchema());
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].fields.some((f) => f.key === field)) return i;
  }
  return null;
}

async function render() {
  const items = await getItems().catch(() => []);

  if (screen === "list") {
    renderList(appEl, {
      items,
      hasDraft: !!getDraft(),
      onNew: startNewChecklist,
      onContinueDraft: continueDraft,
      onDiscardDraft: discardDraft,
      onOpen: openItem,
      onDelete: removeItem,
      onAdmin: showAdmin,
    });
    return;
  }

  if (screen === "form") {
    if (!draft) {
      draft = normalizeDraft(getDraft() || schemaEmptyDraft());
    }
    renderForm(appEl, {
      draft,
      errors: formErrors,
      onChange: onFormChange,
      onTabChange,
      onPrev,
      onNext,
      onCancel: showList,
    });
    return;
  }

  if (screen === "review") {
    if (!draft) {
      draft = normalizeDraft(getDraft() || schemaEmptyDraft());
    }
    renderReview(appEl, {
      data: draft.data,
      saveError,
      onSave,
      onEdit: onReviewEdit,
      onWhatsapp,
      onCopy,
    });
    return;
  }

  if (screen === "login") {
    renderLogin(appEl, {
      error: loginError,
      onLogin,
      onCancel: showList,
    });
    return;
  }

  if (screen === "admin") {
    renderAdmin(appEl, {
      items,
      filterDate: adminFilterDate,
      onLogout,
      onFilter: (date) => {
        adminFilterDate = date;
        render();
      },
      onOpenItem: onAdminOpenItem,
      onChangePass: showChangePass,
      onBuilder: showBuilder,
      onDashboard: showDashboard,
    });
    return;
  }

  if (screen === "builder") {
    renderFormBuilder(appEl, {
      onBack: showAdmin,
    });
    return;
  }

  if (screen === "changepass") {
    renderChangePassword(appEl, {
      error: changeError,
      success: changeSuccess,
      onBack: showAdmin,
      onChange: onChangePass,
    });
    return;
  }

  if (screen === "dashboard") {
    renderDashboard(appEl, {
      items,
      onBack: showAdmin,
    });
  }
}

render();
