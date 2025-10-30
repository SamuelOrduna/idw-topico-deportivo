const API = window.API_BASE || "http://127.0.0.1:8000";
const $ = (s) => document.querySelector(s);

function cssVar(v){ return getComputedStyle(document.body).getPropertyValue(v).trim(); }
function nf(x){ return Number(x).toLocaleString(); }

async function safeFetch(url, opts={}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

let barChart, pieChart;

async function buildCharts(){
  const barEl = $("#barGoles");
  const pieEl = $("#pieCorners");

  if (barChart) { barChart.destroy(); barChart = null; }
  if (pieChart) { pieChart.destroy(); pieChart = null; }

  const colorText = cssVar('--legend') || '#222';
  const colorGrid = cssVar('--grid') || '#e5e7eb';
  const colorBar1 = cssVar('--bar-1') || 'rgba(229,9,20,.85)';
  const colorBar2 = cssVar('--bar-2') || '#111';

  if (window.Chart){
    Chart.defaults.color = colorText;
    Chart.defaults.borderColor = colorGrid;
  }

  if (barEl){
    try{
      const att = await safeFetch(`${API}/stats/attendance-by-team`);
      $("#attMeta").textContent = `Actualizado: ${new Date(att.updated).toLocaleString()}`;

      const totalAtt = (att.values || []).reduce((a,b)=>a+b, 0);
      $("#kTeams") && ($("#kTeams").textContent = att.labels.length);
      $("#kAtt") && ($("#kAtt").textContent = nf(totalAtt));
      $("#kUpd") && ($("#kUpd").textContent = new Date(att.updated).toLocaleTimeString());

      barChart = new Chart(barEl, {
        type: 'bar',
        data: {
          labels: att.labels,
          datasets: [{
            label: 'Asistentes (acumulado)',
            data: att.values,
            backgroundColor: colorBar1,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${nf(ctx.parsed.y)} asistentes`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => nf(v) },
              grid: { color: colorGrid }
            },
            x: { grid: { display: false } }
          }
        }
      });
    }catch(err){
      console.error(err);
      $("#attMeta").textContent = "No se pudo cargar la asistencia.";
    }
  }

  if (pieEl){
    try{
      const st = await safeFetch(`${API}/stats/event-status`);
      $("#statusMeta").textContent = `Actualizado: ${new Date(st.updated).toLocaleString()}`;

      pieChart = new Chart(pieEl, {
        type: 'pie',
        data: {
          labels: st.labels,
          datasets: [{ data: st.values, backgroundColor: [colorBar1, colorBar2, '#888'] }]
        },
        options: {
          plugins: {
            legend: { position: 'bottom', labels: { color: colorText } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a,b)=>a+b,0) || 1;
                  const val = ctx.parsed;
                  const pct = Math.round((val*100)/total);
                  return ` ${nf(val)} (${pct}%)`;
                }
              }
            }
          }
        }
      });

      const total = (st.values || []).reduce((a,b)=>a+b,0) || 1;
      $("#statusLegend").innerHTML = st.labels.map((lbl,i)=>{
        const val = st.values[i] || 0;
        const pct = Math.round((val*100)/total);
        const bullet = i===0 ? 'var(--brand-red)' : (i===1 ? 'var(--bar-2)' : '#888');
        return `
          <li class="d-flex align-items-center justify-content-between py-2 border-bottom" style="border-color:var(--card-border-2)!important;">
            <span class="d-flex align-items-center gap-2">
              <span class="badge rounded-pill" style="background:${bullet}"></span>${lbl}
            </span>
            <strong>${pct}%</strong>
          </li>`;
      }).join("");

      $("#kEvents") && ($("#kEvents").textContent = total);
    }catch(err){
      console.error(err);
      $("#statusMeta").textContent = "No se pudo cargar la distribución por estado.";
    }
  }
}

async function buildStandings(){
  const tbody = $("#standingsBody");
  const meta  = $("#standingsMeta");
  if (!tbody) return;

  try{
    const data = await safeFetch(`${API}/stats/standings?deporte=F%C3%BAtbol&liga=La%20Liga`);
    const rows = data.rows || [];
    if (!rows.length){
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-3">Sin datos suficientes.</td></tr>`;
      meta.textContent = "";
      return;
    }
    tbody.innerHTML = rows.map((r,i)=>`
      <tr>
        <td class="text-secondary">${i+1}</td>
        <td class="fw-semibold">${r.team}</td>
        <td class="text-end fw-bold">${r.pts}</td>
        <td class="text-end">${r.pj}</td>
        <td class="text-end">${r.pg}</td>
        <td class="text-end">${r.pe}</td>
      </tr>
    `).join("");
    meta.textContent = `Actualizado: ${new Date(data.updated).toLocaleString()}`;
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger small px-3 py-2">Error cargando clasificación.</td></tr>`;
    if (meta) meta.textContent = "";
  }
}

window.addEventListener("DOMContentLoaded", ()=>{
  buildCharts();      
  buildStandings();    
});

document.addEventListener("visibilitychange", ()=>{
  if (!document.hidden) buildCharts();
});
window.addEventListener("storage", (e)=>{
  if (e.key === "theme") buildCharts();
});
