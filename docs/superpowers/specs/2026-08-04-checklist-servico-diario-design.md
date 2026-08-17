# Design: CHECK LIST DO SERVIÇO DIÁRIO (Webapp)

**Data:** 2026-08-04  
**Status:** Aprovado pelo usuário (abordagem HTML/CSS/JS + localStorage)  
**Stack:** HTML + CSS + JavaScript puro (sem build, sem framework)

## Objetivo

Webapp para preencher o checklist diário de serviço (viatura, guarnição, equipamentos e armamento), com navegação por categorias (dropdown de abas + Próximo/Anterior) e persistência local via `localStorage` como banco de dados.

## Arquitetura

App estático com arquivos:

```
index.html
css/styles.css
js/
  app.js          # roteamento de telas e orquestração
  storage.js      # leitura/escrita localStorage
  form-data.js    # opções das listas (viaturas, PMs, equipamentos)
  validation.js   # regras por aba
  views/
    list.js       # tela lista
    form.js       # tela formulário (abas)
    review.js     # tela revisão
```

Sem servidor, sem npm. Abrir `index.html` no navegador (ou servir estático).

## Telas

### 1. Lista (início)

- Botão **Novo checklist**
- Lista de checklists salvos (mais recente primeiro), cada item mostrando: data, prefixo da viatura, patrulheiro / motorista
- Ações: **Abrir** (editar registro salvo) · **Excluir** (com confirmação)
- Se existir rascunho (`checklist:draft`) ao clicar Novo: diálogo **Continuar** / **Descartar**

### 2. Formulário

- Header: título + dropdown de abas (6 categorias) + indicador `N/6`
- Corpo: campos só da categoria atual
- Rodapé: **Anterior** | **Próximo** (na última aba: **Revisar**)
- Dropdown permite saltar para qualquer aba
- **Próximo** valida a aba atual; **Anterior** não valida
- Abas já válidas mostram marca ✓ no dropdown

### 3. Revisão

- Resumo somente leitura de todos os campos preenchidos
- **Salvar** → grava em `checklist:items`, limpa rascunho, volta à lista
- **Voltar a editar** → retorna ao formulário (última aba ou aba 1)

## Categorias e campos

### 1. Identificação do serviço

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| DATA | date | Sim |
| VIATURA PREFIXO | select | Sim |
| ALTERAÇÕES GERAIS DA VIATURA | textarea | Sim |

**Opções VIATURA:** VTR 5592, VTR 5599, VTR 6997, VTR 5312, VTR 5484, VTR 5471

### 2. Guarnição

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| PM PATRULHEIRO | select | Sim |
| PM MOTORISTA | select | Sim |

**Lista compartilhada:** ST RR JORGE LUIZ, ST RR OSÓRIO, SGT BARDT, SGT CAVALAZZI, SGT WALTER, SGT DOUGLAS, SGT FRANCISCO, SGT MARTINS, SGT LEONARDO, CB RR RODRIGUES, CB DIEGO, CB FABIANA, CB SILVA, CB THIAGO, CB SANTOS, CB ANDADRE, CB ADEMIR, CB CABRAL, CB JEFERSON, CB SCARABELOT, CB MATHEUS, CB BRUNO, CB JULIANA

### 3. Comunicação / TI

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| SMARTPHONE | select | Sim |
| IMPRESSORA | select | Não |
| RÁDIO HT | select | Sim |

**Smartphone:** C154, C155, C156, C158, C261, C285  
**Impressora:** LEOPARDO FINAL 9F77, 1359, AE77, 102, 76, 2B, 8B, 67  
**Rádio HT:** FINAL 647, FINAL 649, FINAL 654, FINAL 656, DA PONTE

### 4. Armamento e munição

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| CALIBRE 12 | select | Sim |
| MUNIÇÕES CALIBRE 12 (QTD) | number ≥ 0 | Sim |
| FUZIL | select | Sim |
| MUNIÇÕES FUZIL (QTD) | number ≥ 0 | Sim |

**Calibre 12:** FINAL 4563, 2434, 4475, 9882  
**Fuzil:** FINAL 8715, 2181, 2320, 6386, 2088, NÃO LEVOU (substitui “Opção 6”)

### 5. Fiscalização / via

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| BAFÔMETRO ATIVO | Sim/Não | Sim |
| BAFÔMETRO PASSIVO | Sim/Não | Sim |
| ESPARGIDOR | Sim/Não | Sim |
| CONES (QUANTIDADE) | number ≥ 0 | Sim |

### 6. Extras

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| OUTROS EQUIPAMENTOS | checkbox multi: DRONES, SPARK, MOCHILA DE APH, OUTROS | Sim (ao menos 1, ou permitir “nenhum”? → **ao menos uma opção ou campo explícito**; se só OUTROS, texto obrigatório) |
| OUTROS (texto) | text | Obrigatório se OUTROS marcado |
| OUTRAS ALTERAÇÕES | textarea | Não |

**Regra Extras:** pelo menos uma opção de equipamento marcada **ou** o usuário marca implicitamente via escolha; se nenhuma das opções físicas, permitir checkbox “NENHUM” obrigatório no conjunto (uma opção entre as multi + NENHUM). Decisão explícita: incluir opção **NENHUM** na lista de OUTROS EQUIPAMENTOS para satisfazer obrigatoriedade sem forçar equipamento.

## Modelo de dados (localStorage)

### Chaves

| Chave | Conteúdo |
|-------|----------|
| `checklist:draft` | Objeto rascunho ou `null` |
| `checklist:items` | Array de registros salvos |

### Registro salvo

```json
{
  "id": "uuid-ou-timestamp",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "data": {
    "data": "2026-08-04",
    "viatura": "VTR 5592",
    "alteracoesViatura": "...",
    "patrulheiro": "...",
    "motorista": "...",
    "smartphone": "C154",
    "impressora": "",
    "radioHt": "FINAL 647",
    "calibre12": "FINAL 4563",
    "municoesCalibre12": 0,
    "fuzil": "FINAL 8715",
    "municoesFuzil": 0,
    "bafometroAtivo": "SIM",
    "bafometroPassivo": "NAO",
    "espargidor": "SIM",
    "cones": 4,
    "outrosEquipamentos": ["DRONES"],
    "outrosEquipamentosTexto": "",
    "outrasAlteracoes": ""
  }
}
```

### Rascunho

Mesmo shape de `data`, mais `currentTab` (índice 0–5) e `editingId` (se estiver editando um item salvo; senão `null`).

## Validação

- Por aba: todos os obrigatórios da aba preenchidos
- Números: inteiros ≥ 0
- Extras: pelo menos uma opção em OUTROS EQUIPAMENTOS (incluindo NENHUM); se OUTROS marcado, texto não vazio
- Mensagem de erro sob o campo; Próximo foca o primeiro inválido
- Antes de Salvar na revisão: revalidar todas as abas

## UX / visual

- Tema operacional: azul-escuro, cinza, branco; tipografia legível em mobile
- Uma categoria visível por vez
- Sem cards decorativos no fluxo principal
- Dropdown com ✓ em abas válidas; aba atual destacada
- Autosave do rascunho a cada alteração de campo
- Sem sincronização entre dispositivos / sem backend

## Fora de escopo (v1)

- PDF / impressão
- Backend, API, planilha
- Login / multi-usuário
- PWA / service worker
- Correção de nomes da lista (ex.: ANDADRE) — manter como fornecido

## Critérios de sucesso

1. Usuário completa as 6 abas com dropdown e Próximo/Anterior
2. Dados persistem após recarregar a página (lista + rascunho)
3. É possível editar e excluir um checklist salvo
4. Validação impede avançar/salvar com obrigatórios faltando
5. Funciona em viewport mobile e desktop
