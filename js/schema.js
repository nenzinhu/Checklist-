/**
 * Esquema dinâmico do checklist.
 *
 * ANTES as abas e os campos eram fixos (hardcoded) em vários arquivos.
 * AGORA tudo é descrito por este SCHEMA, guardado no localStorage. O admin
 * pode montar o checklist (criar/renomear/excluir abas e campos) pelo
 * "Editor de Formulário" dentro do Painel Admin. Formulário, validação,
 * revisão, relatório e tabela do admin passam a obedecer este schema.
 *
 * Tipos de campo:
 *  - text        : texto livre
 *  - textarea    : texto livre multilinha
 *  - number      : número inteiro >= 0
 *  - date        : data
 *  - select      : escolha única (options)
 *  - selectextra : escolha única + "MANUAL"/"NÃO ACAUTELADO" + descrição (campos de equipamento)
 *  - multiselect : escolha múltipla (options); valor é array
 *  - simnao      : atalho de select com [SIM, NÃO]
 *
 * Campo opcional:
 *  - required   : boolean (padrão true) — se false, não é validado
 *  - revealWhen : { field, value } — só aparece/exige quando o campo informado
 *                 tem aquele valor (ex.: descrição de alteração aparece quando
 *                 alteracoesViaturaTipo === "COM ALTERAÇÃO")
 *  - placeholder: texto do placeholder
 */

const SCHEMA_KEY = "checklist:schema";

export const FIELD_TYPES = {
  text: "Texto",
  textarea: "Texto longo",
  number: "Número",
  date: "Data",
  select: "Lista (escolha única)",
  selectextra: "Equipamento (com MANUAL/NÃO ACAUTELADO)",
  multiselect: "Múltipla escolha",
  simnao: "Sim / Não",
};

/** Converte um rótulo em id válido (slug alfanumérico minúsculo). */
export function slugify(label) {
  const base = String(label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^([0-9])/, "x$1");
  return base || "campo";
}

/** Gera um id de campo único para a aba (evita colisão com existentes). */
function makeFieldId(tabId, keyBase, existingIds) {
  let base = slugify(keyBase) || "campo";
  let id = `${tabId}_${base}`;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${tabId}_${base}${n}`;
    n++;
  }
  return id;
}

/* ————— Esquema padrão (idêntico ao checklist anterior) ————— */

function equipField(field, label, options, placeholder, n) {
  return {
    id: field,
    key: field,
    label,
    type: "selectextra",
    options,
    placeholder,
    required: true,
    order: n,
  };
}

function buildDefaultSchema() {
  const tabs = [
    { id: "identificacao", label: "Identificação", order: 0, fields: [
      { id: "data", key: "data", label: "DATA", type: "date", required: true, order: 0 },
      { id: "viatura", key: "viatura", label: "VIATURA PREFIXO", type: "select", options: ["VTR 5592","VTR 5599","VTR 6997","VTR 5312","VTR 5484","VTR 5471"], required: true, order: 1 },
    ]},
    { id: "guarnicao", label: "Guarnição", order: 1, fields: [
      { id: "patrulheiro", key: "patrulheiro", label: "PM PATRULHEIRO", type: "select", options: ["ST RR JORGE LUIZ","ST RR OSÓRIO","SGT BARDT","SGT CAVALAZZI","SGT WALTER","SGT DOUGLAS","SGT FRANCISCO","SGT MARTINS","SGT LEONARDO","CB RR RODRIGUES","CB DIEGO","CB FABIANA","CB SILVA","CB THIAGO","CB SANTOS","CB ANDRADE","CB ADEMIR","CB CABRAL","CB JEFERSON","CB SCARABELOT","CB MATHEUS","CB BRUNO","CB JULIANA"], required: true, order: 0 },
      { id: "motorista", key: "motorista", label: "PM MOTORISTA", type: "select", options: ["ST RR JORGE LUIZ","ST RR OSÓRIO","SGT BARDT","SGT CAVALAZZI","SGT WALTER","SGT DOUGLAS","SGT FRANCISCO","SGT MARTINS","SGT LEONARDO","CB RR RODRIGUES","CB DIEGO","CB FABIANA","CB SILVA","CB THIAGO","CB SANTOS","CB ANDRADE","CB ADEMIR","CB CABRAL","CB JEFERSON","CB SCARABELOT","CB MATHEUS","CB BRUNO","CB JULIANA"], required: true, order: 1 },
    ]},
    { id: "comunicacao", label: "Comunicação", order: 2, fields: [
      equipField("smartphone", "SMARTPHONE", ["C154","C155","C156","C158","C261","C285"], "Selecione ou MANUAL/NÃO ACAUTELADO", 0),
      equipField("impressora", "IMPRESSORA", ["LEOPARDO FINAL 9FF7","LEOPARDO FINAL 1359","LEOPARDO FINAL AE77","LEOPARDO FINAL 102","LEOPARDO FINAL 76","LEOPARDO FINAL 2B","LEOPARDO FINAL 8B","LEOPARDO FINAL 67","LEOPARDO FINAL 98B7"], "Nenhuma / não se aplica", 1),
      equipField("radioHt", "RÁDIO HT", ["FINAL 652"], "Selecione", 2),
    ]},
    { id: "armamento", label: "Armamento", order: 3, fields: [
      equipField("calibre12", "CALIBRE 12", ["FINAL 4563","FINAL 2434","FINAL 4475","FINAL 9882"], "Selecione ou MANUAL/NÃO ACAUTELADO", 0),
      { id: "municoesCalibre12", key: "municoesCalibre12", label: "MUNIÇÕES CALIBRE 12 (QUANTIDADE)", type: "number", required: true, default: 6, hideWhen: { field: "calibre12", value: "NÃO ACAUTELADO" }, order: 1 },
      equipField("fuzil", "FUZIL", ["FINAL 8715","FINAL 2181","FINAL 2320","FINAL 6386","FINAL 2088","NÃO LEVOU"], "Selecione ou MANUAL/NÃO ACAUTELADO", 2),
      { id: "municoesFuzil", key: "municoesFuzil", label: "MUNIÇÕES FUZIL (QUANTIDADE)", type: "number", required: true, default: 30, hideWhen: { field: "fuzil", value: "NÃO LEVOU" }, order: 3 },
    ]},
    { id: "fiscalizacao", label: "Fiscalização", order: 4, fields: [
      { id: "bafometroAtivo", key: "bafometroAtivo", label: "BAFÔMETRO ATIVO", type: "simnao", required: true, order: 0 },
      { id: "bafometroPassivo", key: "bafometroPassivo", label: "BAFÔMETRO PASSIVO", type: "simnao", required: true, order: 1 },
      { id: "espargidor", key: "espargidor", label: "ESPARGIDOR", type: "simnao", required: true, order: 2 },
      { id: "cones", key: "cones", label: "CONES (QUANTIDADE)", type: "number", required: true, order: 3 },
    ]},
    { id: "extras", label: "Extras", order: 5, fields: [
      { id: "alteracoesViaturaTipo", key: "alteracoesViaturaTipo", label: "ALTERAÇÕES DA VIATURA", type: "select", options: ["SEM ALTERAÇÃO","COM ALTERAÇÃO"], required: true, order: 0 },
      { id: "alteracoesViatura", key: "alteracoesViatura", label: "DESCRIÇÃO DAS ALTERAÇÕES", type: "textarea", required: true, revealWhen: { field: "alteracoesViaturaTipo", value: "COM ALTERAÇÃO" }, order: 1 },
      { id: "outrosEquipamentos", key: "outrosEquipamentos", label: "OUTROS EQUIPAMENTOS", type: "multiselect", options: ["DRONES","SPARK","MOCHILA DE APH","OUTROS","NENHUM"], required: true, order: 2, exclusiveOptions: ["NENHUM"], requiresText: ["OUTROS"] },
      { id: "outrosEquipamentosTexto", key: "outrosEquipamentosTexto", label: "OUTROS (DETALHE)", type: "text", required: false, revealWhen: { field: "outrosEquipamentos", value: "OUTROS" }, order: 3 },
      { id: "outrasAlteracoes", key: "outrasAlteracoes", label: "OUTRAS ALTERAÇÕES", type: "textarea", required: false, order: 4 },
    ]},
  ];
  return { version: 1, tabs };
}

/* ————— Persistência ————— */

function readSchema() {
  try {
    const raw = localStorage.getItem(SCHEMA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tabs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSchema(schema) {
  try {
    localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
    return true;
  } catch {
    return false;
  }
}

/** Retorna o schema atual (padrão na 1ª execução). */
export function getSchema() {
  const schema = readSchema() || buildDefaultSchema();
  // Garante defaults de munição e regra de ocultação mesmo em schemas já salvos.
  for (const f of getAllFields(schema)) {
    if (f.key === "municoesCalibre12") {
      if (f.default === undefined || f.default === null) {
        f.default = 6;
        writeSchema(schema);
      }
      if (!f.hideWhen || f.hideWhen.field !== "calibre12" || f.hideWhen.value !== "NÃO ACAUTELADO") {
        f.hideWhen = { field: "calibre12", value: "NÃO ACAUTELADO" };
        writeSchema(schema);
      }
    }
    if (f.key === "municoesFuzil") {
      if (f.default === undefined || f.default === null) {
        f.default = 30;
        writeSchema(schema);
      }
      if (!f.hideWhen || f.hideWhen.field !== "fuzil" || f.hideWhen.value !== "NÃO LEVOU") {
        f.hideWhen = { field: "fuzil", value: "NÃO LEVOU" };
        writeSchema(schema);
      }
    }
  }
  return schema;
}

export function saveSchema(schema) {
  return writeSchema(schema);
}

export function resetSchema() {
  return writeSchema(buildDefaultSchema());
}

/* ————— Helpers de leitura ————— */

export function getTabs(schema = getSchema()) {
  return [...schema.tabs].sort((a, b) => a.order - b.order);
}

export function getTabById(id, schema = getSchema()) {
  return schema.tabs.find((t) => t.id === id) || null;
}

export function getTabFields(tab, schema = getSchema()) {
  if (!tab || !Array.isArray(tab.fields)) return [];
  return [...tab.fields].sort((a, b) => a.order - b.order);
}

/** Lista achatada de todos os campos (todas as abas), em ordem. */
export function getAllFields(schema = getSchema()) {
  const out = [];
  for (const tab of getTabs(schema)) {
    for (const f of getTabFields(tab, schema)) out.push(f);
  }
  return out;
}

/** Mapa id -> campo para acesso rápido. */
export function fieldMap(schema = getSchema()) {
  const map = {};
  for (const f of getAllFields(schema)) map[f.id] = f;
  return map;
}

/** Verifica se um campo está visível dado o valor atual de `data`. */
export function isFieldVisible(field, data) {
  if (!field.revealWhen) {
    // hideWhen: esconde o campo quando o campo informado tem aquele valor
    if (field.hideWhen) {
      const ref = data?.[field.hideWhen.field];
      if (Array.isArray(ref)) {
        if (ref.includes(field.hideWhen.value)) return false;
      } else if (ref === field.hideWhen.value) {
        return false;
      }
    }
    return true;
  }
  const ref = data?.[field.revealWhen.field];
  if (Array.isArray(ref)) return ref.includes(field.revealWhen.value);
  return ref === field.revealWhen.value;
}

/** Objeto vazio respeitando defaults do schema (multiselect = [], field.default). */
export function emptyFormData(schema = getSchema()) {
  const data = {};
  for (const f of getAllFields(schema)) {
    if (f.type === "multiselect") {
      data[f.key] = [];
    } else if (f.default !== undefined && f.default !== null) {
      data[f.key] = f.default;
    } else {
      data[f.key] = "";
    }
  }
  return data;
}

/* ————— Helpers de edição (usados pelo Editor de Formulário) ————— */

export function createTab(schema, label) {
  let id = `tab_${slugify(label)}`;
  let n = 2;
  while (schema.tabs.some((t) => t.id === id)) {
    id = `tab_${slugify(label)}${n}`;
    n++;
  }
  const maxOrder = schema.tabs.reduce((m, t) => Math.max(m, t.order), -1);
  schema.tabs.push({ id, label: label || "Nova aba", order: maxOrder + 1, fields: [] });
  return schema;
}

export function renameTab(schema, tabId, label) {
  const tab = getTabById(tabId, schema);
  if (tab) tab.label = label;
  return schema;
}

export function deleteTab(schema, tabId) {
  schema.tabs = schema.tabs.filter((t) => t.id !== tabId);
  // renumera ordem
  getTabs(schema).forEach((t, i) => (t.order = i));
  return schema;
}

export function moveTab(schema, tabId, dir) {
  const tabs = getTabs(schema);
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx < 0) return schema;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= tabs.length) return schema;
  const a = tabs[idx].order, b = tabs[swap].order;
  tabs[idx].order = b;
  tabs[swap].order = a;
  return schema;
}

export function addField(schema, tabId, field) {
  const tab = getTabById(tabId, schema);
  if (!tab) return schema;
  const ids = new Set(getAllFields(schema).map((f) => f.id));
  const newField = {
    id: makeFieldId(tabId, field.label || field.key || "campo", ids),
    key: "", // preenchido abaixo
    label: field.label || "Novo campo",
    type: field.type || "text",
    required: field.required !== false,
    order: tab.fields.length,
  };
  // key padrão = id (para não colidir com chaves fixas)
  newField.key = newField.id;
  if (["select", "selectextra", "multiselect"].includes(newField.type)) {
    newField.options = field.options ? [...field.options] : [];
  }
  if (newField.type === "selectextra") {
    newField.placeholder = field.placeholder || "Selecione ou MANUAL/NÃO ACAUTELADO";
  }
  if (newField.type === "text" || newField.type === "textarea") {
    newField.placeholder = field.placeholder || "";
  }
  if (field.revealWhen) newField.revealWhen = field.revealWhen;
  if (newField.type === "multiselect") {
    newField.exclusiveOptions = field.exclusiveOptions || [];
    newField.requiresText = field.requiresText || [];
  }
  tab.fields.push(newField);
  return schema;
}

export function updateField(schema, tabId, fieldId, patch) {
  const tab = getTabById(tabId, schema);
  if (!tab) return schema;
  const f = tab.fields.find((x) => x.id === fieldId);
  if (!f) return schema;
  Object.assign(f, patch);
  // mantém options apenas para tipos que usam
  if (!["select", "selectextra", "multiselect"].includes(f.type)) delete f.options;
  if (f.type !== "selectextra") delete f.placeholder;
  if (f.type !== "multiselect") { delete f.exclusiveOptions; delete f.requiresText; }
  if (!f.revealWhen || !f.revealWhen.field) delete f.revealWhen;
  return schema;
}

export function deleteField(schema, tabId, fieldId) {
  const tab = getTabById(tabId, schema);
  if (!tab) return schema;
  tab.fields = tab.fields.filter((f) => f.id !== fieldId);
  getTabFields(tab, schema).forEach((f, i) => (f.order = i));
  return schema;
}

export function moveField(schema, tabId, fieldId, dir) {
  const tab = getTabById(tabId, schema);
  if (!tab) return schema;
  const fields = getTabFields(tab, schema);
  const idx = fields.findIndex((f) => f.id === fieldId);
  if (idx < 0) return schema;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= fields.length) return schema;
  const a = fields[idx].order, b = fields[swap].order;
  fields[idx].order = b;
  fields[swap].order = a;
  return schema;
}

/** Rótulos amigáveis (para revisão/relatório) derivados do schema. */
export function buildFieldLabels(schema = getSchema()) {
  const labels = {};
  for (const f of getAllFields(schema)) labels[f.key] = f.label;
  return labels;
}
