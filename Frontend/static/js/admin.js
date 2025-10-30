const API = window.API_BASE || "http://127.0.0.1:8000";
const $  = (s)=>document.querySelector(s);

async function safeFetch(url, opts={}){
  const r = await fetch(url, opts);
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

let page = 1, pageSize = 5, lastLen = 0;

async function loadTable(){
  const rows = await safeFetch(`${API}/events?page=${page}&page_size=${pageSize}`);
  lastLen = rows.length;
  $("#tblEvents").innerHTML = rows.map(e=>`
    <tr>
      <td>${e.id}</td>
      <td>${e.titulo}</td>
      <td>${e.liga}</td>
      <td>${e.estado}</td>
      <td class="text-end">${e.asistentes.toLocaleString()}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary" onclick='editEvent(${JSON.stringify(e)})'>
          <i class="bi bi-pencil"></i>
        </button>
      </td>
    </tr>
  `).join("");
  const start = (page-1)*pageSize+1;
  const end   = start + rows.length - 1;
  $("#evRange").textContent = rows.length ? `Mostrando ${start}-${end}` : `Sin registros`;
}

window.editEvent = (e)=>{
  $("#evtId").value = e.id;
  $("#titulo").value = e.titulo;
  $("#deporte").value = e.deporte;
  $("#liga").value = e.liga;
  $("#local").value = e.local;
  $("#visita").value = e.visita;
  $("#fecha_iso").value = e.fecha_iso;
  $("#estadio").value = e.estadio;
  $("#asistentes").value = e.asistentes;
  $("#estado").value = e.estado;
  $("#marcador_local").value = e.marcador_local ?? "";
  $("#marcador_visita").value = e.marcador_visita ?? "";
  window.scrollTo({top:0, behavior:"smooth"});
};

function clearForm(){
  $("#evtId").value = "";
  $("#evtForm").reset();
}

$("#btnClear").addEventListener("click", clearForm);

$("#evtForm").addEventListener("submit", async (ev)=>{
  ev.preventDefault();
  const payload = {
    titulo: $("#titulo").value.trim(),
    liga: $("#liga").value.trim(),
    deporte: $("#deporte").value.trim(),
    local: $("#local").value.trim(),
    visita: $("#visita").value.trim(),
    fecha_iso: $("#fecha_iso").value.trim(),
    estadio: $("#estadio").value.trim(),
    asistentes: parseInt($("#asistentes").value,10) || 0,
    estado: $("#estado").value,
    marcador_local: $("#marcador_local").value===""?null:parseInt($("#marcador_local").value,10),
    marcador_visita: $("#marcador_visita").value===""?null:parseInt($("#marcador_visita").value,10)
  };

  const id = $("#evtId").value;
  try{
    if (id){
      await safeFetch(`${API}/events/${id}`, {
        method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
      });
    }else{
      await safeFetch(`${API}/events`, {
        method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
      });
    }
    clearForm();
    loadTable();
    localStorage.setItem("eventsChangedAt", String(Date.now())); // para notificar otras pestañas
  }catch(err){
    alert("Error guardando: "+err.message);
  }
});

// Paginación (servidor)
$("#btnPrev").addEventListener("click", ()=>{ page = Math.max(1, page-1); loadTable(); });
$("#btnNext").addEventListener("click", ()=>{ if(lastLen===pageSize) page+=1; loadTable(); });

// Eventos extra (interactividad)
document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") clearForm(); });
window.addEventListener("storage", (e)=>{ if(e.key==="eventsChangedAt") loadTable(); });

window.addEventListener("DOMContentLoaded", loadTable);
