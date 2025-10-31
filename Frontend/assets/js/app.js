const API = (new URLSearchParams(location.search).get("api")) ||
            localStorage.getItem("API_BASE") || "http://127.0.0.1:8000";

const $ = s => document.querySelector(s);

async function safeFetch(url, opts={}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function cardHTML(e){
  
  const badge = (e.estado === "En Vivo" || e.estado === "Programado")
  ? "danger"
  : "secondary";

  return `
  <div class="col-12 col-md-6 col-lg-4">
    <div class="card h-100"><div class="card-body">
      <div class="d-flex gap-2 mb-2">
        <span class="badge text-bg-secondary">${e.deporte}</span>
        <span class="badge text-bg-${badge}">${e.estado}</span>
      </div>
      <h5 class="card-title mb-1">${e.titulo}</h5>
      <div class="text-secondary mb-2">${e.liga}</div>
      <div class="small mb-2"><i class="bi bi-people me-1"></i>${e.asistentes.toLocaleString()} asistentes</div>
      <div class="small"><i class="bi bi-calendar-event me-1"></i>${new Date(e.fecha_iso).toLocaleString()}</div>
    </div></div>
  </div>`;
}

async function load() {
  const q = ($("#q").value || "").trim();
  const deporte = $("#dep").value || "";
  const liga = $("#lig").value || "";
  const params = new URLSearchParams({ page: "1", page_size: "30" });
  if (q) params.set("q", q);
  if (deporte) params.set("deporte", deporte);
  if (liga) params.set("liga", liga);

  try{
    const rows = await safeFetch(`${API}/events?${params}`);
    $("#cards").innerHTML = rows.map(cardHTML).join("") || `<div class="text-secondary">Sin resultados.</div>`;

    const all = await safeFetch(`${API}/events?page=1&page_size=100`);
    const deportes = [...new Set(all.map(e=>e.deporte))].sort();
    const ligas = [...new Set(all.map(e=>e.liga))].sort();
    if (!$("#dep").dataset.filled){
      $("#dep").innerHTML = `<option value="">Todos</option>` + deportes.map(d=>`<option>${d}</option>`).join("");
      $("#dep").dataset.filled = "1";
    }
    if (!$("#lig").dataset.filled){
      $("#lig").innerHTML = `<option value="">Todas</option>` + ligas.map(d=>`<option>${d}</option>`).join("");
      $("#lig").dataset.filled = "1";
    }
  }catch(err){
    $("#cards").innerHTML = `<div class="text-danger">No se pudo cargar la API.</div>`;
    console.error(err);
  }
}

window.addEventListener("DOMContentLoaded", ()=>{
  $("#q").addEventListener("input", ()=>load());
  $("#dep").addEventListener("change", ()=>load());
  $("#lig").addEventListener("change", ()=>load());
  load();
});


(function(){
  const layer = document.getElementById('spotlight');
  const grid  = document.getElementById('cards');
  if(!layer || !grid) return;

  function isDark() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
  }

  function enable() {
    grid.addEventListener('mouseenter', show);
    grid.addEventListener('mouseleave', hide);
    window.addEventListener('pointermove', update, {passive:true});
    window.addEventListener('touchmove',  update, {passive:true});
  }

  function disable() {
    hide();
    grid.removeEventListener('mouseenter', show);
    grid.removeEventListener('mouseleave', hide);
    window.removeEventListener('pointermove', update);
    window.removeEventListener('touchmove', update);
  }

  function show() { layer.style.opacity = '1'; }
  function hide() { layer.style.opacity = '0'; }

  function update(e){
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    if (x==null || y==null) return;
    layer.style.setProperty('--sx', x + 'px');
    layer.style.setProperty('--sy', y + 'px');
  }

  if (isDark()) enable();

  window.addEventListener('themechange', () => {
    if (isDark()) enable();
    else disable();
  });
})();
