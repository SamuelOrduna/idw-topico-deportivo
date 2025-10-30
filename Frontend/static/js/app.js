const API = window.API_BASE || "http://127.0.0.1:8000";
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let state = {
  all: [],
  page: 1,
  pageSize: parseInt(localStorage.getItem("pageSize") || "9", 10),
  q: "",
  deporte: "",
  liga: "",
};

async function safeFetch(url, opts={}){ const res = await fetch(url, opts); if(!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); }

async function loadEventsInitial(){
  try{
    const page1 = await safeFetch(`${API}/events?page=1&page_size=50`);
    let all = page1;
    if(page1.length===50){
      const page2 = await safeFetch(`${API}/events?page=2&page_size=50`);
      all = page1.concat(page2);
    }
    state.all = all;
    renderAll(true);
  }catch(err){
    console.error(err);
    alert("No se pudo cargar la API.");
  }
}

function renderAll(){
  let items = state.all.filter(e=>{
    const q = state.q;
    const okQ = !q || [e.titulo,e.local,e.visita,e.liga].some(s=>s.toLowerCase().includes(q));
    const okD = !state.deporte || e.deporte.toLowerCase()===state.deporte;
    const okL = !state.liga || e.liga.toLowerCase()===state.liga;
    return okQ && okD && okL;
  });
  const total = items.length;
  const start = (state.page-1)*state.pageSize;
  const pageItems = items.slice(start, start+state.pageSize);

  $("#rangeText").textContent = `Mostrando ${Math.min(total?start+1:0,total)} - ${Math.min(start+pageItems.length,total)} de ${total}`;
  renderCards(pageItems);
  renderPager(Math.max(1, Math.ceil(total/state.pageSize)));

  const deportes = [...new Set(state.all.map(e=>e.deporte))].sort();
  const ligas = [...new Set(state.all.map(e=>e.liga))].sort();
  fillSelect($("#selDeporte"), ["Todos"].concat(deportes));
  fillSelect($("#selLiga"), ["Todas"].concat(ligas));
}

function renderCards(items){
  const row = $("#cardsRow");
  row.innerHTML = items.map(cardHTML).join("") || `<div class="text-center text-secondary py-4">Sin resultados</div>`;
}
function cardHTML(e){
  const badge = e.estado==="En Vivo"?"danger":(e.estado==="Finalizado"?"light text-dark":"primary");
  return `
  <div class="col-12 col-md-6 col-lg-4">
    <div class="card h-100"><div class="card-body">
      <div class="d-flex gap-2 mb-2">
        <span class="badge text-bg-secondary">${e.deporte}</span>
        <span class="badge text-bg-${badge}">${e.estado}</span>
      </div>
      <h5 class="card-title mb-1">${e.titulo}</h5>
      <div class="text-secondary mb-3">${e.liga}</div>
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 mb-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge text-bg-danger">${e.local.slice(0,3).toUpperCase()}</span>
            <span class="fw-semibold">${e.local}</span>
          </div>
          ${e.marcador_local!=null?`<span class="fs-5 fw-bold text-danger">${e.marcador_local}</span>`:""}
        </div>
        <div class="text-center text-secondary mb-2">VS</div>
        <div class="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge text-bg-secondary">${e.visita.slice(0,3).toUpperCase()}</span>
            <span class="fw-semibold">${e.visita}</span>
          </div>
          ${e.marcador_visita!=null?`<span class="fs-5 fw-bold text-secondary">${e.marcador_visita}</span>`:""}
        </div>
      </div>
      <ul class="list-unstyled small text-secondary mb-3">
        <li class="mb-1"><i class="bi bi-calendar-event me-2"></i>${new Date(e.fecha_iso).toLocaleString()}</li>
        <li class="mb-1"><i class="bi bi-geo-alt me-2"></i>${e.estadio}</li>
        <li><i class="bi bi-people me-2"></i>${e.asistentes.toLocaleString()} asistentes</li>
      </ul>
    </div></div>
  </div>`;
}
function renderPager(pages){
  const ul = $("#pager");
  const li = (lbl, dis, act, click)=>`
    <li class="page-item ${dis?'disabled':''} ${act?'active':''}">
      <a class="page-link" href="#" onclick="${click};return false;">${lbl}</a>
    </li>`;
  let html = "";
  html += li("&lsaquo;", state.page<=1, false, `setPage(${state.page-1})`);
  for(let i=1;i<=pages;i++) html += li(String(i), false, i===state.page, `setPage(${i})`);
  html += li("&rsaquo;", state.page>=pages, false, `setPage(${state.page+1})`);
  ul.innerHTML = html;
}
window.setPage = p => { state.page = Math.max(1,p); renderAll(); };
function fillSelect(sel, opts){
  const cur = sel.value;
  sel.innerHTML = opts.map((o,i)=>`<option ${i===0?'value=""':''}>${o}</option>`).join("");
  if(cur) sel.value = cur;
}

document.getElementById("btnClear").addEventListener("click", ()=>{
  document.getElementById("searchInput").value="";
  document.getElementById("selDeporte").value="";
  document.getElementById("selLiga").value="";
  state.q=""; state.deporte=""; state.liga=""; state.page=1; renderAll();
});
document.getElementById("searchInput").addEventListener("input", e=>{ state.q=e.target.value.trim().toLowerCase(); state.page=1; renderAll(); });
document.getElementById("selDeporte").addEventListener("change", e=>{ state.deporte=e.target.value.toLowerCase(); state.page=1; renderAll(); });
document.getElementById("selLiga").addEventListener("change", e=>{ state.liga=e.target.value.toLowerCase(); state.page=1; renderAll(); });

window.addEventListener("load", ()=>{
  document.getElementById("pageSize").value = String(state.pageSize);
  loadEventsInitial();
});
