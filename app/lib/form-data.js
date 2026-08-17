/**
 * Compatibilidade: estrutura de abas/campos é dinâmica (ver schema.js).
 * Re-exports mantêm a API usada por form/report/review.
 */

import { getSchema, getTabs, emptyFormData as schemaEmptyData, buildFieldLabels } from "./schema.js";

export const TABS = getTabs();

export const VIATURAS = [];
export const GUARNICAO = [];
export const SMARTPHONES = [];
export const IMPRESSORAS = [];
export const RADIOS_HT = [];
export const CALIBRES_12 = [];
export const FUZIS = [];
export const SIM_NAO = ["SIM", "NÃO"];
export const ALTERACOES_VIATURA = ["SEM ALTERAÇÃO", "COM ALTERAÇÃO"];
export const MANUAL_NAO_ACAUTELADO = ["MANUAL", "NÃO ACAUTELADO"];
export const EQUIP_OPTIONS = MANUAL_NAO_ACAUTELADO;
export const EQUIP_FIELDS = [];
export const OUTROS_EQUIPAMENTOS = [];

export function emptyFormData() {
  return schemaEmptyData();
}

export function emptyDraft() {
  return {
    currentTab: 0,
    editingId: null,
    data: emptyFormData(),
  };
}

/** Rótulos amigáveis derivados do schema atual. */
export const FIELD_LABELS = buildFieldLabels();
