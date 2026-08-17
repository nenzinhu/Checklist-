"use client";

import { formatDate } from "../../lib/util.js";

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
  return (
    <div className="dash-bar-row" key={label}>
      <div className="dash-bar-label" title={label}>
        {label}
      </div>
      <div className="dash-bar-track">
        <div className="dash-bar-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <div className="dash-bar-value">{value}</div>
    </div>
  );
}

function statCard({ label, value, hint, accent }) {
  return (
    <div
      className="dash-card"
      key={label}
      style={accent ? { borderTopColor: accent } : undefined}
    >
      <p className="dash-card-label">{label}</p>
      <p className="dash-card-value">{value}</p>
      {hint ? <p className="dash-card-hint">{hint}</p> : null}
    </div>
  );
}

function simpleDonut(segments) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const len = (s.value / total) * circ;
      const dash = `${len} ${circ - len}`;
      const el = (
        <circle
          className="dash-donut-arc"
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={s.color}
          strokeWidth="16"
          strokeDasharray={dash}
          strokeDashoffset={-offset}
          transform="rotate(-90 60 60)"
          key={i}
        />
      );
      offset += len;
      return el;
    });
  return (
    <div className="dash-donut-wrap">
      <svg className="dash-donut" viewBox="0 0 120 120" role="img" aria-label="Proporção">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--bg-soft)" strokeWidth="16" />
        {arcs}
      </svg>
      <div className="dash-donut-center">
        <strong>{total}</strong>
        <span>total</span>
      </div>
    </div>
  );
}

function legend(items) {
  return (
    <ul className="dash-legend">
      {items
        .filter((i) => i.value > 0)
        .map((i) => (
          <li key={i.label}>
            <span className="dash-dot" style={{ background: i.color }}></span>
            {i.label} <strong>{i.value}</strong>
          </li>
        ))}
    </ul>
  );
}

export default function DashboardView({ items, onBack }) {
  const all = Array.isArray(items) ? items : [];
  const total = all.length;

  const dates = all.map((i) => i.data?.data).filter(Boolean).sort();
  const firstDate = dates[0] || "—";
  const lastDate = dates[dates.length - 1] || "—";

  const NAO_ACAUTELADO = "NÃO ACAUTELADO";
  const NAO_LEVOU = "NÃO LEVOU";
  const semCalibre12 = all.filter((i) => i.data?.calibre12 === NAO_ACAUTELADO);
  const semFuzil = all.filter((i) => i.data?.fuzil === NAO_LEVOU);

  const isValido = (v) =>
    v != null && v !== "" && v !== "NENHUM" && v !== NAO_ACAUTELADO && v !== NAO_LEVOU;
  const calibre12 = countBy(all, (i) => (isValido(i.data?.calibre12) ? i.data.calibre12 : null));
  const fuzil = countBy(all, (i) => (isValido(i.data?.fuzil) ? i.data.fuzil : null));
  const smartphone = countBy(all, (i) => (isValido(i.data?.smartphone) ? i.data.smartphone : null));
  const impressora = countBy(all, (i) => (isValido(i.data?.impressora) ? i.data.impressora : null));
  const radioHt = countBy(all, (i) => (isValido(i.data?.radioHt) ? i.data.radioHt : null));

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
      label: "Total de registros",
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

  return (
    <div>
      <header className="page-header compact">
        <button type="button" className="link-back" onClick={onBack}>
          ← Voltar
        </button>
        <h1 data-anim="title">Dashboard</h1>
        <p className="subtitle">Estatísticas de equipamentos das guarnições</p>
      </header>

      {total === 0 ? (
        <p className="empty">
          Nenhum registro salvo ainda. O dashboard aparece após registrar guarnições.
        </p>
      ) : (
        <>
          <section className="dash-cards" aria-label="Indicadores gerais">
            {cards.map(statCard)}
          </section>

          <section className="dash-grid">
            <div className="dash-panel">
              <h2 className="section-title">Calibre 12 mais pego</h2>
              <div className="dash-bars">
                {topN(calibre12, 6).map((x) => barRow(x, maxEquip)) || <p className="empty">—</p>}
              </div>
            </div>

            <div className="dash-panel">
              <h2 className="section-title">Fuzil mais pego</h2>
              <div className="dash-bars">
                {topN(fuzil, 6).map((x) => barRow(x, maxEquip)) || <p className="empty">—</p>}
              </div>
            </div>

            <div className="dash-panel">
              <h2 className="section-title">Smartphone mais usado</h2>
              <div className="dash-bars">
                {topN(smartphone, 6).map((x) => barRow(x, maxEquip)) || <p className="empty">—</p>}
              </div>
            </div>

            <div className="dash-panel">
              <h2 className="section-title">Impressora mais usada</h2>
              <div className="dash-bars">
                {topN(impressora, 6).map((x) => barRow(x, maxEquip)) || <p className="empty">—</p>}
              </div>
            </div>

            <div className="dash-panel">
              <h2 className="section-title">Rádio HT mais usado</h2>
              <div className="dash-bars">
                {topN(radioHt, 6).map((x) => barRow(x, maxEquip)) || <p className="empty">—</p>}
              </div>
            </div>

            <div className="dash-panel">
              <h2 className="section-title">Alterações da viatura</h2>
              {simpleDonut(alterSegments)}
              {legend(alterSegments)}
            </div>

            <div className="dash-panel dash-panel-wide dash-alert">
              <h2 className="section-title">Guarnições que NÃO acautelaram</h2>
              {naAcauteladas.length ? (
                <ul className="dash-na-list">
                  {naAcauteladas.map((i) => (
                    <li key={i.id}>
                      <strong>{i.data?.viatura || "—"}</strong>
                      <span>{formatDate(i.data?.data)}</span>
                      <span className="dash-na-tags">
                        {i.data?.calibre12 === NAO_ACAUTELADO ? (
                          <em className="tag-red">Calibre 12</em>
                        ) : null}
                        {i.data?.fuzil === NAO_LEVOU ? <em className="tag-red">Fuzil</em> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">Todas as guarnições acautelaram armamento.</p>
              )}
            </div>
          </section>
        </>
      )}

      <div className="btn-row" style={{ marginTop: "1rem" }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Voltar ao painel
        </button>
      </div>
    </div>
  );
}
