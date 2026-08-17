import { supabase } from "./supabaseClient.js";

const DRAFT_KEY = "checklist:draft";

/** Janela de edição após a criação, em horas (espelha o banco: editavel_ate). */
export const LOCK_HOURS = 24;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDraft() {
  return readJson(DRAFT_KEY, null);
}

export function saveDraft(draft) {
  writeJson(DRAFT_KEY, draft);
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

/** Normaliza uma linha do banco no formato usado pelo app. */
function rowToItem(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.created_at,
    editavelAte: row.editavel_ate,
    data: row.dados || {},
  };
}

/** Busca todos os checklists (mais recentes primeiro). */
export async function getItems() {
  const { data, error } = await supabase
    .from("guarnicoes")
    .select("id, created_at, editavel_ate, dados")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erro ao buscar guarnições:", error);
    return [];
  }
  return (data || []).map(rowToItem);
}

export async function getItemById(id) {
  const { data, error } = await supabase
    .from("guarnicoes")
    .select("id, created_at, editavel_ate, dados")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToItem(data);
}

/** Insere ou atualiza um checklist. `editingId` ausente = novo. */
export async function upsertItem(record) {
  const id = record.id || undefined;
  const row = {
    data: record.data?.data || "",
    viatura: record.data?.viatura || "",
    patrulheiro: record.data?.patrulheiro || "",
    motorista: record.data?.motorista || "",
    dados: record.data || {},
  };
  let query = supabase.from("guarnicoes").upsert(
    id ? { id, ...row } : row,
    { onConflict: "id" }
  ).select("id, created_at, editavel_ate, dados");
  const { data, error } = await query;
  if (error) {
    console.error("Erro ao salvar guarnição:", error);
    return record;
  }
  const saved = (data && data[0]) || row;
  return {
    id: saved.id || id,
    createdAt: saved.created_at,
    updatedAt: saved.created_at,
    editavelAte: saved.editavel_ate,
    data: saved.dados || record.data,
  };
}

export async function deleteItem(id) {
  const { error } = await supabase.from("guarnicoes").delete().eq("id", id);
  if (error) console.error("Erro ao excluir:", error);
}

export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Um checklist pode ser aberto/editado apenas dentro de LOCK_HOURS
 * a partir de sua criação. Passado esse tempo, fica bloqueado.
 */
export function isItemEditable(item) {
  if (!item) return true;
  const limit = item.editavelAte
    ? new Date(item.editavelAte).getTime()
    : item.createdAt
    ? new Date(item.createdAt).getTime() + LOCK_HOURS * 60 * 60 * 1000
    : NaN;
  if (Number.isNaN(limit)) return true;
  return Date.now() < limit;
}
