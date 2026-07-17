/**
 * VendorFlow — Charts Module (Chart.js wrappers)
 * Manages all analytics charts with proper theming.
 */

const Charts = (() => {
  const registered = {};

  // Destroy existing chart if re-rendering
  function destroy(id) {
    if (registered[id]) {
      registered[id].destroy();
      delete registered[id];
    }
  }

  // Theme-aware colours
  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      text:    isDark ? 'rgba(241,245,249,0.7)' : 'rgba(15,23,42,0.7)',
      grid:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      tooltip: isDark ? '#1a1a2e' : '#fff',
    };
  }

  const PURPLE  = '#7c3aed';
  const CYAN    = '#06b6d4';
  const GREEN   = '#10b981';
  const AMBER   = '#f59e0b';
  const DANGER  = '#ef4444';
  const PINK    = '#ec4899';
  const ORANGE  = '#f97316';
  const INDIGO  = '#6366f1';

  const PALETTE = [PURPLE, CYAN, GREEN, AMBER, DANGER, PINK, ORANGE, INDIGO];

  function gradientFill(ctx, color, alpha = 0.3) {
    const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    g.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
    g.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
    return g;
  }

  /** Build hex → rgba helper */
  function hexRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /** Default Chart.js options */
  function defaultOptions(extra = {}) {
    const tc = getThemeColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: tc.text,
            font: { family: 'Inter', size: 11, weight: '600' },
            boxWidth: 10, boxHeight: 10,
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: tc.tooltip,
          titleColor: tc.text,
          bodyColor: tc.text,
          borderColor: 'rgba(255,255,255,.08)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleFont: { family: 'Inter', size: 12, weight: '700' },
          bodyFont: { family: 'Inter', size: 12 },
          callbacks: extra.tooltipCallbacks || {},
        },
      },
      scales: extra.scales ?? {
        x: {
          grid: { color: tc.grid, drawBorder: false },
          ticks: { color: tc.text, font: { family: 'Inter', size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: tc.grid, drawBorder: false },
          ticks: { color: tc.text, font: { family: 'Inter', size: 11 }, callback: extra.yCallback },
          border: { display: false },
          beginAtZero: true,
        },
      },
      animation: { duration: 600, easing: 'easeInOutQuart' },
      ...extra.base,
    };
  }

  /**
   * Revenue & Profit Line Chart
   */
  function renderRevenuChart(canvasId, daily, currency) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = daily.map(d => {
      const dt = new Date(d.date + 'T12:00:00');
      return dt.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric' });
    });

    const rate = Currency.getRate();
    const mul  = currency === 'ZAR' ? rate : 1;
    const sym  = Currency.symbol(currency);

    const revenues = daily.map(d => +(d.revenue * mul).toFixed(2));
    const profits  = daily.map(d => +(d.profit  * mul).toFixed(2));
    const expenses = daily.map(d => +(d.expenses * mul).toFixed(2));

    const revGrad = ctx.createLinearGradient(0, 0, 0, 280);
    revGrad.addColorStop(0, hexRgba(PURPLE, 0.35));
    revGrad.addColorStop(1, hexRgba(PURPLE, 0));

    const opts = defaultOptions({
      yCallback: v => `${sym}${v.toFixed(2)}`,
      tooltipCallbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${sym}${ctx.parsed.y.toFixed(2)}`,
      },
    });

    registered[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenues,
            borderColor: PURPLE,
            backgroundColor: revGrad,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: PURPLE,
            borderWidth: 2,
          },
          {
            label: 'Profit',
            data: profits,
            borderColor: GREEN,
            backgroundColor: hexRgba(GREEN, 0.08),
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: GREEN,
            borderWidth: 2,
          },
          {
            label: 'Expenses',
            data: expenses,
            borderColor: AMBER,
            backgroundColor: hexRgba(AMBER, 0.06),
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: AMBER,
            borderWidth: 2,
            borderDash: [5, 3],
          },
        ],
      },
      options: opts,
    });
  }

  /**
   * Top Products Bar Chart
   */
  function renderTopProducts(canvasId, products, currency) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rate = Currency.getRate();
    const mul  = currency === 'ZAR' ? rate : 1;
    const sym  = Currency.symbol(currency);

    const labels = products.map(p => p.name);
    const data   = products.map(p => +(p.revenue * mul).toFixed(2));
    const colors = products.map((_, i) => PALETTE[i % PALETTE.length]);
    const bgs    = colors.map(c => hexRgba(c, 0.75));

    const opts = defaultOptions({
      yCallback: v => `${sym}${v.toFixed(0)}`,
      tooltipCallbacks: {
        label: ctx => ` Revenue: ${sym}${ctx.parsed.y.toFixed(2)}`,
      },
    });

    opts.plugins.legend.display = false;

    registered[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data,
          backgroundColor: bgs,
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: opts,
    });
  }

  /**
   * Category Donut Chart
   */
  function renderCategoryDonut(canvasId, categories, currency) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rate = Currency.getRate();
    const mul  = currency === 'ZAR' ? rate : 1;
    const sym  = Currency.symbol(currency);
    const tc   = getThemeColors();

    const labels = Object.keys(categories);
    const data   = Object.values(categories).map(v => +(v * mul).toFixed(2));
    const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

    registered[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => hexRgba(c, 0.8)),
          borderColor: colors,
          borderWidth: 1.5,
          hoverBorderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: tc.text,
              font: { family: 'Inter', size: 11, weight: '600' },
              boxWidth: 10, boxHeight: 10,
              usePointStyle: true,
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: tc.tooltip,
            titleColor: tc.text,
            bodyColor: tc.text,
            borderColor: 'rgba(255,255,255,.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: ctx => ` ${ctx.label}: ${sym}${ctx.parsed.toFixed(2)}`,
            },
          },
        },
        animation: { duration: 600, easing: 'easeInOutQuart' },
      },
    });
  }

  /**
   * Mini sparkline for dashboard
   */
  function renderSparkline(canvasId, data, color) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 60);
    grad.addColorStop(0, hexRgba(color, 0.3));
    grad.addColorStop(1, hexRgba(color, 0));

    registered[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true },
        },
        animation: { duration: 400 },
      },
    });
  }

  /** Update all charts when theme changes */
  function refreshAll() {
    Object.keys(registered).forEach(id => {
      const chart = registered[id];
      if (!chart) return;
      const tc = getThemeColors();
      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = tc.text;
      }
      if (chart.options.scales?.x?.ticks) {
        chart.options.scales.x.ticks.color = tc.text;
        chart.options.scales.x.grid.color  = tc.grid;
      }
      if (chart.options.scales?.y?.ticks) {
        chart.options.scales.y.ticks.color = tc.text;
        chart.options.scales.y.grid.color  = tc.grid;
      }
      chart.update();
    });
  }

  return { renderRevenuChart, renderTopProducts, renderCategoryDonut, renderSparkline, refreshAll, destroy };
})();

window.Charts = Charts;
