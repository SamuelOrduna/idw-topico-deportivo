// frontend/assets/js/calendar.js
(function () {
  const API = "http://127.0.0.1:8000";
  const monthsEs = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
  ];

  const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    calendar: null,
    selected: null,
  };

  const $ = (sel) => document.querySelector(sel);
  const calendarBody = () => document.getElementById("calendarBody");
  const monthTitle = () => document.getElementById("monthTitle");
  const dayPanel = () => document.getElementById("selectedDayEvents");

  function pad(n){ return n.toString().padStart(2,'0'); }

  function fetchCalendar(){
    const y = state.year, m = state.month;
    return fetch(`${API}/calendar/events?year=${y}&month=${m}`)
      .then(r => r.json())
      .then(data => { state.calendar = data; renderCalendar(); })
      .catch(err => console.error('Error fetching calendar:', err));
  }

  function renderCalendar(){
    const y = state.year, m = state.month;
    const { days = [] } = state.calendar || {};
    monthTitle().textContent = `${monthsEs[m-1]} ${y}`;

    const startDate = new Date(`${y}-${pad(m)}-01T00:00:00`);
    let startCol = (startDate.getDay() + 6) % 7; // 0=Mon
    let html = '<tr>' + '<td></td>'.repeat(startCol);

    days.forEach((d) => {
      const dayNum = Number(d.date.slice(-2));
      const todayIso = new Date().toISOString().slice(0, 10);
      const isToday = d.date === todayIso;
      const isSel = d.date === state.selected;
      const hasEvents = (d.events || []).length > 0;

      html += `<td class="${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}" data-date="${d.date}">`+
              `${hasEvents ? '<span class="event-dot"></span>' : ''}`+
              `<div class="fw-bold">${dayNum}</div>`+
              `${(d.events || []).slice(0, 2).map(e => (
                `<div class=\"event-liga\">${e.liga}</div>`+
                `<div class=\"event-title event-item\"`+
                ` data-id=\"${e.id}\" data-date=\"${d.date}\" data-time=\"${e.time}\"`+
                ` data-liga=\"${e.liga}\" data-title=\"${e.title}\" data-deporte=\"${e.deporte}\"`+
                ` data-estadio=\"${e.estadio}\" data-local=\"${e.local}\" data-visita=\"${e.visita}\"`+
                ` data-ml=\"${e.marcador_local || ''}\" data-mv=\"${e.marcador_visita || ''}\"`+
                ` data-asistentes=\"${e.asistentes || ''}\"`+
                `>${e.title}</div>`
              )).join('')}`+
              `</td>`;
      startCol++;
      if (startCol % 7 === 0) html += '</tr><tr>';
    });

    html += '</tr>';
    calendarBody().innerHTML = html;
    bindCellClicks();
    renderSelectedDayEvents();
  }

  function bindCellClicks(){
    document.querySelectorAll('[data-date]').forEach(cell => {
      cell.onclick = () => { state.selected = cell.getAttribute('data-date'); renderCalendar(); };
    });
    document.querySelectorAll('.event-item').forEach(item => {
      item.onclick = (ev) => {
        ev.stopPropagation();
        const data = item.dataset;
        state.selected = data.date;
        renderCalendar();
      };
    });
  }

  function renderSelectedDayEvents(){
    const panel = dayPanel();
    if (!state.selected || !state.calendar){
      panel.innerHTML = '<p class="text-secondary small mb-0">Selecciona un día para ver sus eventos</p>';
      return;
    }
    const day = state.calendar.days.find(d => d.date === state.selected);
    if (!day || !day.events || day.events.length === 0){
      panel.innerHTML = '<p class="text-secondary small mb-0">No hay eventos programados para este día</p>';
      return;
    }
    const dt = new Date(state.selected);
    let html = `<div class="fw-bold mb-3">${dt.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`;
    html += (day.events).map(ev => `
      <div class="border-bottom pb-3 mb-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="fw-semibold">${ev.title || ''}</div>
          <div class="text-secondary small">${ev.time || ''}</div>
        </div>
        <div class="small text-secondary mb-1">${ev.liga || ''}${ev.deporte ? ' · '+ev.deporte : ''}${ev.estado ? ' · '+ev.estado : ''}</div>
        ${(ev.local || ev.visita) ? `<div class="small mb-1">${ev.local || ''} ${(ev.local && ev.visita)?'vs':''} ${ev.visita || ''}</div>` : ''}
        ${ev.estadio ? `<div class="small text-secondary"><i class="bi bi-geo-alt me-1"></i>${ev.estadio}</div>` : ''}
        ${(ev.marcador_local!=null && ev.marcador_visita!=null)? `<div class="small text-secondary">Marcador: ${ev.marcador_local} - ${ev.marcador_visita}</div>`: ''}
        ${ev.asistentes ? `<div class="small text-secondary">Asistentes: ${Number(ev.asistentes).toLocaleString()}</div>` : ''}
      </div>
    `).join('');
    panel.innerHTML = html;
  }

  function attachNav(){
    document.getElementById('prevMonth').onclick = () => {
      state.month -= 1;
      if (state.month < 1) { state.month = 12; state.year--; }
      state.selected = null;
      fetchCalendar();
    };
    document.getElementById('nextMonth').onclick = () => {
      state.month += 1;
      if (state.month > 12) { state.month = 1; state.year++; }
      state.selected = null;
      fetchCalendar();
    };
    document.getElementById('refreshCal').onclick = () => fetchCalendar();
    window.addEventListener('focus', () => fetchCalendar());
  }

  window.CalendarPage = {
    init: function(){
      const today = new Date();
      const iso = today.toISOString().slice(0,10);
      if (state.year === today.getFullYear() && state.month === (today.getMonth()+1)) {
        state.selected = iso;
      }
      attachNav();
      fetchCalendar();
    }
  };
})();


