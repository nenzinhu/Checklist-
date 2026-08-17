"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDraft,
  saveDraft,
  clearDraft,
  getItems,
  getItemById,
  upsertItem,
  deleteItem,
  isItemEditable,
} from "../lib/storage.js";
import {
  getSchema,
  getTabs,
  getAllFields,
  emptyFormData as schemaEmptyFormData,
} from "../lib/schema.js";
import { emptyDraft as schemaEmptyDraft } from "../lib/form-data.js";
import { useScreenAnimation } from "../lib/useGsap.js";
import {
  validateTab,
  validateAll,
  firstErrorField,
} from "../lib/validation.js";
import { buildReportText } from "../lib/report.js";
import {
  checkAdmin,
  changeAdminPassword,
  setAdminSession,
  clearAdminSession,
  isAdminSession,
} from "../lib/auth.js";
import { todayISO } from "../lib/util.js";

import ListView from "./views/List.js";
import FormView from "./views/Form.js";
import ReviewView from "./views/Review.js";
import LoginView from "./views/Login.js";
import AdminView from "./views/Admin.js";
import FormBuilderView from "./views/FormBuilder.js";
import ChangePasswordView from "./views/ChangePassword.js";
import DashboardView from "./views/Dashboard.js";
import Modal from "./views/Modal.js";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState("list");
  const [draft, setDraft] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [adminFilterDate, setAdminFilterDate] = useState("");
  const [changeError, setChangeError] = useState(null);
  const [changeSuccess, setChangeSuccess] = useState(null);
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);

  const scope = useScreenAnimation([screen]);

  useEffect(() => {
    let active = true;
    getItems()
      .then((its) => {
        if (active) setItems(its);
      })
      .catch(() => {});
    setMounted(true);
    return () => {
      active = false;
    };
  }, []);

  /* ————— helpers ————— */

  const showList = useCallback(() => {
    setScreen("list");
    setFormErrors({});
    setSaveError(null);
  }, []);

  const normalizeDraft = (raw) => {
    const schema = getSchema();
    const tabs = getTabs(schema);
    const maxTab = Math.max(0, tabs.length - 1);
    return {
      currentTab: Math.min(Math.max(Number(raw.currentTab) || 0, 0), maxTab),
      editingId: raw.editingId ?? null,
      data: { ...schemaEmptyFormData(schema), ...(raw.data || {}) },
    };
  };

  const persistDraft = (d) => {
    if (d) saveDraft(d);
  };

  const startNewChecklist = () => {
    const existing = getDraft();
    if (existing) {
      if (
        !confirm(
          "Há um rascunho em andamento. Descartar e começar um novo registro?"
        )
      ) {
        return;
      }
      clearDraft();
    }
    const d = schemaEmptyDraft();
    d.data.data = todayISO();
    saveDraft(d);
    setDraft(d);
    setScreen("form");
    setFormErrors({});
  };

  const continueDraft = () => {
    const existing = getDraft();
    if (!existing) return;
    setDraft(normalizeDraft(existing));
    setScreen("form");
    setFormErrors({});
  };

  const discardDraft = () => {
    if (!confirm("Descartar o rascunho?")) return;
    clearDraft();
    setDraft(null);
    setScreen("list");
  };

  const openItem = async (id) => {
    const item = await getItemById(id);
    if (!item) return;
    if (!isItemEditable(item)) {
      alert("Este registro está bloqueado para edição (passou de 24h da criação).");
      return;
    }
    setDraft({
      currentTab: 0,
      editingId: item.id,
      data: { ...schemaEmptyFormData(), ...item.data },
    });
    saveDraft({
      currentTab: 0,
      editingId: item.id,
      data: { ...schemaEmptyFormData(), ...item.data },
    });
    setScreen("form");
    setFormErrors({});
  };

  const removeItem = async (id) => {
    await deleteItem(id);
    setItems(await getItems());
  };

  const onFormChange = (data, currentTab) => {
    if (!draft) return;
    const nd = { ...draft, data, currentTab };
    setDraft(nd);
    persistDraft(nd);
  };

  const onTabChange = (index) => {
    if (!draft) return;
    const nd = { ...draft, currentTab: index };
    setDraft(nd);
    setFormErrors({});
    persistDraft(nd);
  };

  const onPrev = () => {
    if (!draft || draft.currentTab <= 0) return;
    const nd = { ...draft, currentTab: draft.currentTab - 1 };
    setDraft(nd);
    setFormErrors({});
    persistDraft(nd);
  };

  const onNext = () => {
    if (!draft) return;
    const { ok, errors } = validateTab(draft.currentTab, draft.data);
    if (!ok) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const tabs = getTabs(getSchema());
    if (draft.currentTab >= tabs.length - 1) {
      setScreen("review");
      setSaveError(null);
      persistDraft(draft);
      return;
    }
    const nd = { ...draft, currentTab: draft.currentTab + 1 };
    setDraft(nd);
    persistDraft(nd);
  };

  const onReviewEdit = () => {
    setScreen("form");
    setSaveError(null);
  };

  const onSave = async () => {
    if (!draft) return;
    const { ok, errors } = validateAll(draft.data);
    if (!ok) {
      setSaveError("Há campos obrigatórios incompletos. Volte a editar.");
      const first = firstErrorField(errors);
      const tabForField = fieldTabIndex(first);
      if (tabForField != null) setDraft({ ...draft, currentTab: tabForField });
      setFormErrors(errors);
      return;
    }
    const data = { ...draft.data };
    for (const f of getAllFields()) {
      if (f.type === "number") data[f.key] = Number(data[f.key]);
    }
    await upsertItem({ id: draft.editingId || undefined, data });
    clearDraft();
    setDraft(null);
    setScreen("list");
    setItems(await getItems());
  };

  const onWhatsapp = () => {
    if (!draft) return;
    const text = buildReportText(draft.data);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onCopy = async () => {
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
  };

  const showLogin = () => {
    setScreen("login");
    setLoginError(null);
  };

  const onLogin = (user, pass) => {
    if (checkAdmin(user, pass)) {
      setAdminSession();
      setLoginError(null);
      setScreen("admin");
    } else {
      setLoginError("Usuário ou senha inválidos.");
    }
  };

  const onLogout = () => {
    clearAdminSession();
    setLoginError(null);
    setAdminFilterDate("");
    showList();
  };

  const onAdminOpenItem = async (id) => {
    const item = await getItemById(id);
    if (!item) {
      alert("Registro não encontrado.");
      return;
    }
    const text = buildReportText(item.data || {});
    setModal({
      title: `Cautela & Vistoria ${item.data?.viatura || ""} — ${item.data?.data || ""}`,
      text,
    });
  };

  const showAdmin = () => {
    if (!isAdminSession()) {
      showLogin();
      return;
    }
    setScreen("admin");
  };

  const showBuilder = () => {
    if (!isAdminSession()) {
      showLogin();
      return;
    }
    setScreen("builder");
  };

  const showDashboard = () => {
    if (!isAdminSession()) {
      showLogin();
      return;
    }
    setScreen("dashboard");
  };

  const showChangePass = () => {
    if (!isAdminSession()) {
      showLogin();
      return;
    }
    setScreen("changepass");
    setChangeError(null);
    setChangeSuccess(null);
  };

  const onChangePass = (user, newPass) => {
    if (!newPass || newPass.trim() === "") {
      setChangeError("Informe a nova senha.");
      setChangeSuccess(null);
      return;
    }
    const ok = changeAdminPassword(user, newPass.trim());
    if (ok) {
      setChangeSuccess(`Senha do usuário ${user} alterada com sucesso.`);
      setChangeError(null);
    } else {
      setChangeError("Usuário não encontrado.");
      setChangeSuccess(null);
    }
  };

  const fieldTabIndex = (field) => {
    if (field == null) return null;
    const tabs = getTabs(getSchema());
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].fields.some((f) => f.key === field)) return i;
    }
    return null;
  };

  /* ————— render ————— */

  const body = (() => {
    if (!mounted) return null;
    switch (screen) {
      case "list":
        return (
          <ListView
            items={items}
            hasDraft={!!getDraft()}
            onNew={startNewChecklist}
            onContinueDraft={continueDraft}
            onDiscardDraft={discardDraft}
            onOpen={openItem}
            onDelete={removeItem}
            onAdmin={showAdmin}
          />
        );
      case "form": {
        const d = draft || normalizeDraft(getDraft() || schemaEmptyDraft());
        return (
          <FormView
            draft={d}
            errors={formErrors}
            onChange={onFormChange}
            onTabChange={onTabChange}
            onPrev={onPrev}
            onNext={onNext}
            onCancel={showList}
          />
        );
      }
      case "review": {
        const d = draft || normalizeDraft(getDraft() || schemaEmptyDraft());
        return (
          <ReviewView
            data={d.data}
            saveError={saveError}
            onSave={onSave}
            onEdit={onReviewEdit}
            onWhatsapp={onWhatsapp}
            onCopy={onCopy}
          />
        );
      }
      case "login":
        return (
          <LoginView error={loginError} onLogin={onLogin} onCancel={showList} />
        );
      case "admin":
        return (
          <AdminView
            items={items}
            filterDate={adminFilterDate}
            onLogout={onLogout}
            onFilter={setAdminFilterDate}
            onOpenItem={onAdminOpenItem}
            onChangePass={showChangePass}
            onBuilder={showBuilder}
            onDashboard={showDashboard}
          />
        );
      case "builder":
        return <FormBuilderView onBack={showAdmin} />;
      case "changepass":
        return (
          <ChangePasswordView
            error={changeError}
            success={changeSuccess}
            onBack={showAdmin}
            onChange={onChangePass}
          />
        );
      case "dashboard":
        return <DashboardView items={items} onBack={showAdmin} />;
      default:
        return null;
    }
  })();

  return (
    <div ref={scope} className="screen-root">
      <header className="site-header">
        <div className="site-header-bar">
          <div className="site-header-inner">
            <img
              src="/banner.png"
              alt="PMSC · Cautela & Vistoria"
              className="brand-banner"
            />
            <div className="brand-copy">
              <p className="brand-org">Polícia Militar Rodoviária</p>
              <p className="brand-title" data-anim="title">CAUTELA &amp; VISTORIA</p>
            </div>
          </div>
        </div>
        <div className="site-header-stripe" aria-hidden="true"></div>
      </header>

      <div id="app" className="app">
        {body}
      </div>

      <div
        id="splash"
        className={`splash ${mounted ? "splash--hidden" : ""}`}
        aria-hidden={mounted}
      >
        <img src="/splash.png" alt="Carregando" className="splash-img" />
      </div>

      {modal && (
        <Modal
          title={modal.title}
          text={modal.text}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
