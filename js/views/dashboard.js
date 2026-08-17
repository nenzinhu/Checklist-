import { formatDate } from "./list.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (k == null || k === "") continue;
    if (Array.isArray(k)) {
      for (const v of k) {
        if (v && v !== "NENHUM") map.set(v, (map.get(v) || 0) + 1);
      }
    } else {
      map.set(k, (map.get(k) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function topN(arr, n) {
  return arr.slice(0, n);
}

function barRow({ label, value }, max) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `
    <div class="dash-bar-row">
      <div class="dash-bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
      <div class="dash-bar-track">
        <div class="dash-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="dash-bar-value">${value}</div>
    </div>`;
}

function statCard({ label, value, hint, accent }) {
  return `
    <div class="dash-card" style="${accent ? `border-top-color:${accent}` : ""}">
      <p class="dash-card-label">${escapeHtml(label)}</p>
      <p class="dash-card-value">${value}</p>
      ${hint ? `<p class="dash-card-hint">${escapeHtml(hint)}</p>` : ""}
    </div>`;
}

function simpleDonut(segments) {
  // segments: [{label, value, color}]
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return "";
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * circ;
      const dash = `${len} ${circ - len}`;
      const el = `<circle class="dash-donut-arc" cx="60" cy="60" r="${radius}" fill="none" stroke="${s.color}" stroke-width="16" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)" />`;
      offset += len;
      return el;
    })
    .join("");
  return `
    <div class="dash-donut-wrap">
      <svg class="dash-donut" viewBox="0 0 120 120" role="img" aria-label="Proporção">
        <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--bg-soft)" stroke-width="16" />
        ${arcs}
      </svg>
      <div class="dash-donut-center"><strong>${total}</strong><span>total</span></div>
    </div>`;
}

function legend(items) {
  return `<ul class="dash-legend">${items
    .filter((i) => i.value > 0)
    .map(
      (i) =>
        `<li><span class="dash-dot" style="background:${i.color}"></span>${escapeHtml(
          i.label
        )} <strong>${i.value}</strong></li>`
    )
    .join("")}</ul>`;
}

/**
 * Painel geral de métricas, gráficos e estatísticas.
 * @param {HTMLElement} root
 * @param {{
 *   items: Array,
 *   onBack: () => void,
 * }} opts
 */
export function renderDashboard(root, { items, onBack }) {
  const all = Array.isArray(items) ? items : [];
  const total = all.length;

  // Período
  const dates = all
    .map((i) => i.data?.data)
    .filter(Boolean)
    .sort();
  const firstDate = dates[0] || "—";
  const lastDate = dates[dates.length - 1] || "—";

  // Guarnições que NÃO acautelaram
  const NAO_ACAUTELADO = "NÃO ACAUTELADO";
  const NAO_LEVOU = "NÃO LEVOU";
  const semCalibre12 = all.filter((i) => i.data?.calibre12 === NAO_ACAUTELADO);
  const semFuzil = all.filter((i) => i.data?.fuzil === NAO_LEVOU);

  // Equipamentos mais "pegos"/usados (exclui opções de não-acautelado / nenhum)
  const isValido = (v) => v != null && v !== "" && v !== "NENHUM" && v !== NAO_ACAUTELADO && v !== NAO_LEVOU;
  const calibre12 = countBy(all, (i) => (isValido(i.data?.calibre12) ? i.data.calibre12 : null));
  const fuzil = countBy(all, (i) => (isValido(i.data?.fuzil) ? i.data.fuzil : null));
  const smartphone = countBy(all, (i) => (isValido(i.data?.smartphone) ? i.data.smartphone : null));
  const impressora = countBy(all, (i) => (isValido(i.data?.impressora) ? i.data.impressora : null));
  const radioHt = countBy(all, (i) => (isValido(i.data?.radioHt) ? i.data.radioHt : null));

  // Viaturas / Guarnição (contexto)
  const viaturas = countBy(all, (i) => i.data?.viatura);
  const patrulheiros = countBy(all, (i) => i.data?.patrulheiro);
  const alteracoes = countBy(all, (i) => i.data?.alteracoesViaturaTipo);
  const cones = all.reduce((s, i) => s + (Number(i.data?.cones) || 0), 0);

  const maxViatura = viaturas.length ? viaturas[0].value : 0;
  const maxPessoa = patrulheiros.length ? patrulheiros[0].value : 0;
  const maxEquip = Math.max(
    calibre12[0]?.value || 0,
    fuzil[0]?.value || 0,
    smartphone[0]?.value || 0,
    impressora[0]?.value || 0,
    radioHt[0]?.value || 0
  );

  const alterColors = { SIM: "var(--pm-green)", NÃO: "var(--pm-red)" };
  const alterSegments = alteracoes.map((a) => ({
    label: a.label,
    value: a.value,
    color: alterColors[a.label] || "var(--pm-yellow)",
  }));

  const cards = [
    {
      label: "Total de checklists",
      value: total,
      hint: total ? `De ${formatDate(firstDate)} a ${formatDate(lastDate)}` : "Sem registros",
      accent: "var(--pm-green)",
    },
    {
      label: "Viaturas diferentes",
      value: viaturas.length,
      hint: viaturas[0] ? `Mais usada: ${viaturas[0].label}` : "—",
      accent: "var(--pm-yellow)",
    },
    {
      label: "Calibre 12 não acautelado",
      value: semCalibre12.length,
      hint: "Guarnições sem arma de calibre 12",
      accent: "var(--pm-red)",
    },
    {
      label: "Fuzil não acautelado",
      value: semFuzil.length,
      hint: "Guarnições sem fuzil",
      accent: "var(--pm-red)",
    },
    {
      label: "Cones (soma)",
      value: cones,
      hint: "Equipamento de fiscalização",
      accent: "var(--pm-brand-green)",
    },
    {
      label: "Com alteração na viatura",
      value: alteracoes.find((a) => a.label === "COM ALTERAÇÃO")?.value || 0,
      hint: "Registros com alterações",
      accent: "var(--pm-yellow-bright)",
    },
  ];

  const naAcauteladas = all
    .filter((i) => i.data?.calibre12 === NAO_ACAUTELADO || i.data?.fuzil === NAO_LEVOU)
    .slice(0, 12);

  root.innerHTML = `
    <header class="page-header compact">
      <button type="button" class="link-back" data-action="back">← Voltar</button>
      <h1>Dashboard</h1>
      <p class="subtitle">Estatísticas de equipamentos das guarnições</p>
    </header>

    ${
      total === 0
        ? `<p class="empty">Nenhum checklist salvo ainda. O dashboard aparece após registrar guarnições.</p>`
        : `
    <section class="dash-cards" aria-label="Indicadores gerais">
      ${cards.map(statCard).join("")}
    </section>

    <section class="dash-grid">
      <div class="dash-panel">
        <h2 class="section-title">Calibre 12 mais pego</h2>
        <div class="dash-bars">
          ${topN(calibre12, 6).map((x) => barRow(x, maxEquip)).join("") || '<p class="empty">—</p>'}
        </div>
      </div>

      <div class="dash-panel">
        <h2 class="section-title">Fuzil mais pego</h2>
        <div class="dash-bars">
          ${topN(fuzil, 6).map((x) => barRow(x, maxEquip)).join("") || '<p class="empty">—</p>'}
        </div>
      </div>

      <div class="dash-panel">
        <h2 class="section-title">Smartphone mais usado</h2>
        <div class="dash-bars">
          ${topN(smartphone, 6).map((x) => barRow(x, maxEquip)).join("") || '<p class="empty">—</p>'}
        </div>
      </div>

      <div class="dash-panel">
        <h2 class="section-title">Impressora mais usada</h2>
        <div class="dash-bars">
          ${topN(impressora, 6).map((x) => barRow(x, maxEquip)).join("") || '<p class="empty">—</p>'}
        </div>
      </div>

      <div class="dash-panel">
        <h2 class="section-title">Rádio HT mais usado</h2>
        <div class="dash-bars">
          ${topN(radioHt, 6).map((x) => barRow(x, maxEquip)).join("") || '<p class="empty">—</p>'}
        </div>
      </div>

      <div class="dash-panel">
        <h2 class="section-title">Alterações da viatura</h2>
        ${simpleDonut(alterSegments)}
        ${legend(alterSegments)}
      </div>

      <div class="dash-panel dash-panel-wide dash-alert">
        <h2 class="section-title">Guarnições que NÃO acautelaram</h2>
        ${
          naAcauteladas.length
            ? `<ul class="dash-na-list">
                ${naAcauteladas
                  .map(
                    (i) => `<li>
                      <strong>${escapeHtml(i.data?.viatura || "—")}</strong>
                      <span>${escapeHtml(formatDate(i.data?.data))}</span>
                      <span class="dash-na-tags">
                        ${i.data?.calibre12 === NAO_ACAUTELADO ? '<em class="tag-red">Calibre 12</em>' : ""}
                        ${i.data?.fuzil === NAO_LEVOU ? '<em class="tag-red">Fuzil</em>' : ""}
                      </span>
                    </li>`
                  )
                  .join("")}
              </ul>`
            : '<p class="empty">Todas as guarnições acautelaram armamento.</p>'
        }
      </div>
    </section>
    `
    }

    <div class="btn-row" style="margin-top:1rem">
      <button type="button" class="btn btn-ghost" data-action="back">← Voltar ao painel</button></div>
  `;

  root.querySelector('[data-action="back"]')?.addEventListener("click", onBack);
}
