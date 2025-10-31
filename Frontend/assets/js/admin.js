const API = (new URLSearchParams(location.search).get("api")) ||
            localStorage.getItem("API_BASE") || "http://127.0.0.1:8000";
const $ = s => document.querySelector(s);

async function safeFetch(url, opts={}){ const r = await fetch(url, opts); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

async function loadTable(){
  const rows = await safeFetch(`${API}/events?page=1&page_size=50`);
  $("#tbody").innerHTML = rows.map(e=>`
    <tr>
      <td>${e.id}</td><td>${e.titulo}</td><td>${e.liga}</td><td>${e.estado}</td>
      <td class="text-end">${e.asistentes.toLocaleString()}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-primary" onclick='fill(${JSON.stringify(e).replaceAll("'","&#39;")})'>Editar</button></td>
    </tr>`).join("");
}

window.fill = (e)=>{
  for (const k of ["id","titulo","liga","deporte","local","visita","fecha_iso","estadio","asistentes","estado","marcador_local","marcador_visita"]) {
    const el = document.getElementById(k);
    if(!el) continue;
    el.value = (e[k] ?? "");
  }
  window.scrollTo({top:0, behavior:"smooth"});
};

function clearForm(){ document.getElementById("form").reset(); document.getElementById("id").value=""; }

async function submit(ev){
  ev.preventDefault();
  const get = id => document.getElementById(id).value.trim();
  const payload = {
    titulo: get("titulo"),
    liga: get("liga"),
    deporte: get("deporte"),
    local: get("local"),
    visita: get("visita"),
    fecha_iso: get("fecha_iso"),
    estadio: get("estadio"),
    asistentes: parseInt(get("asistentes")||"0",10),
    estado: get("estado"),
    marcador_local: get("marcador_local")===""?null:parseInt(get("marcador_local"),10),
    marcador_visita: get("marcador_visita")===""?null:parseInt(get("marcador_visita"),10),
  };
  const id = get("id");
  if (id) {
    await safeFetch(`${API}/events/${id}`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
  } else {
    await safeFetch(`${API}/events`,      { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
  }
  clearForm(); loadTable();
}

window.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("form").addEventListener("submit", submit);
  document.getElementById("clear").addEventListener("click", clearForm);
  loadTable();
});
    