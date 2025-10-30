// frontend/assets/js/stats.js
const API = (new URLSearchParams(location.search).get("api")) ||
            localStorage.getItem("API_BASE") || "http://127.0.0.1:8000";
const $ = s => document.querySelector(s);

async function safeFetch(u){ const r = await fetch(u); if(!r.ok) throw new Error(r.status); return r.json(); }

let barChart, pieChart;

function theme() {
  // lee variables CSS para que coincida la gráfica
  const cs = getComputedStyle(document.documentElement);
  return {
    text: cs.getPropertyValue('--text-0').trim() || '#f4f6f8',
    grid: cs.getPropertyValue('--line').trim() || '#272b30',
    brand: cs.getPropertyValue('--brand').trim() || '#e50914',
    muted: cs.getPropertyValue('--bg-2').trim() || '#191c20',
  };
}

async function loadCharts(){
  const t = theme();

  if (window.Chart){
    Chart.defaults.color = t.text;
    Chart.defaults.borderColor = t.grid;
  }

  // ---- Asistencia (bar)
  try{
    const att = await safeFetch(`${API}/stats/attendance-by-team`);
    const ctx1 = document.getElementById("bar").getContext("2d");
    if(barChart) barChart.destroy();
    barChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: att.labels,
        datasets: [{
          label: "Asistentes",
          data: att.values,
          backgroundColor: t.brand,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display:false }},
          y: { beginAtZero:true }
        }
      }
    });
    $("#attMeta").textContent = `Actualizado: ${new Date(att.updated).toLocaleString()}`;
  }catch(e){ $("#attMeta").textContent = "Error de datos."; }

  // ---- Estado (pie)
  try{
    const st = await safeFetch(`${API}/stats/event-status`);
    const ctx2 = document.getElementById("pie").getContext("2d");
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(ctx2, {
      type: "pie",
      data: {
        labels: st.labels,
        datasets: [{
          data: st.values,
          backgroundColor: [t.brand, t.muted, "#666"]
        }]
      },
      options: { responsive: true }
    });
    $("#stMeta").textContent = `Actualizado: ${new Date(st.updated).toLocaleString()}`;
  }catch(e){ $("#stMeta").textContent = "Error de datos."; }

  // ---- Clasificación (tabla)
  try{
    const table = await safeFetch(`${API}/stats/standings?deporte=F%C3%BAtbol&liga=La%20Liga`);
    const tbody = $("#standings");
    tbody.innerHTML = (table.rows||[]).map((r,i)=>`
      <tr>
        <td>${i+1}</td><td>${r.team}</td>
        <td class="text-end">${r.pts}</td>
        <td class="text-end">${r.pj}</td>
        <td class="text-end">${r.pg}</td>
        <td class="text-end">${r.pe}</td>
      </tr>`).join("");
    $("#tabMeta").textContent = `Actualizado: ${new Date(table.updated).toLocaleString()}`;
  }catch(e){ $("#tabMeta").textContent = "Error de datos."; }
}

window.addEventListener("DOMContentLoaded", loadCharts);
