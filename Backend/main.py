# uvicorn main:app --reload --port 8000
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from datetime import datetime
from itertools import count
from pathlib import Path

app = FastAPI(title="Sports API + Web (demo)")

# === Static & Templates (Jinja2: extends/blocks como Flask) =========
FRONTEND_DIR = Path(__file__).resolve().parents[1] / "Frontend"
templates = Jinja2Templates(directory=str(FRONTEND_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")

# === CORS ===========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ===== Modelos ======================================================
class EventIn(BaseModel):
    titulo: str
    liga: str
    deporte: str
    local: str
    visita: str
    fecha_iso: str         # "2025-06-14T21:00:00Z"
    estadio: str
    asistentes: int
    estado: str            # Programado | En Vivo | Finalizado
    marcador_local: int | None = None
    marcador_visita: int | None = None

class Event(EventIn):
    id: int

# ===== DB en memoria + seed ========================================
DB: List[Event] = []
_seed = [
    # ——— UEFA / NBA / NFL / Tenis (como antes)
    {"titulo":"Champions League Final","liga":"UEFA Champions League","deporte":"Fútbol",
     "local":"Real Madrid","visita":"Bayern Munich","fecha_iso":"2025-06-14T21:00:00Z",
     "estadio":"Wembley Stadium","asistentes":90000,"estado":"Programado"},
    {"titulo":"NBA Finals Game 7","liga":"NBA","deporte":"Baloncesto",
     "local":"Boston Celtics","visita":"LA Lakers","fecha_iso":"2025-06-17T20:00:00Z",
     "estadio":"TD Garden","asistentes":18624,"estado":"Programado"},
    {"titulo":"Super Bowl LX","liga":"NFL","deporte":"Fútbol Americano",
     "local":"Kansas City Chiefs","visita":"San Francisco 49ers","fecha_iso":"2025-02-08T18:30:00Z",
     "estadio":"Allegiant Stadium","asistentes":65000,"estado":"Finalizado",
     "marcador_local":31,"marcador_visita":28},
    {"titulo":"Wimbledon Final","liga":"Grand Slam","deporte":"Tenis",
     "local":"Novak Djokovic","visita":"Carlos Alcaraz","fecha_iso":"2025-07-12T14:00:00Z",
     "estadio":"All England Club","asistentes":15000,"estado":"Programado"},

    # ——— La Liga (agrego FINALIZADOS para que la clasificación funcione)
    {"titulo":"J1 Real Madrid vs FC Barcelona","liga":"La Liga","deporte":"Fútbol",
     "local":"Real Madrid","visita":"FC Barcelona","fecha_iso":"2025-01-18T16:00:00Z",
     "estadio":"Santiago Bernabéu","asistentes":81044,"estado":"Finalizado","marcador_local":2,"marcador_visita":1},
    {"titulo":"J1 Atlético Madrid vs Real Sociedad","liga":"La Liga","deporte":"Fútbol",
     "local":"Atlético Madrid","visita":"Real Sociedad","fecha_iso":"2025-01-19T18:00:00Z",
     "estadio":"Cívitas Metropolitano","asistentes":68000,"estado":"Finalizado","marcador_local":1,"marcador_visita":1},
    {"titulo":"J2 Real Betis vs Sevilla","liga":"La Liga","deporte":"Fútbol",
     "local":"Real Betis","visita":"Sevilla","fecha_iso":"2025-01-25T18:00:00Z",
     "estadio":"Benito Villamarín","asistentes":52000,"estado":"Finalizado","marcador_local":3,"marcador_visita":2},
    {"titulo":"J2 Villarreal vs Osasuna","liga":"La Liga","deporte":"Fútbol",
     "local":"Villarreal","visita":"Osasuna","fecha_iso":"2025-01-26T18:00:00Z",
     "estadio":"La Cerámica","asistentes":23000,"estado":"Finalizado","marcador_local":2,"marcador_visita":0},
    {"titulo":"J3 FC Barcelona vs Atlético Madrid","liga":"La Liga","deporte":"Fútbol",
     "local":"FC Barcelona","visita":"Atlético Madrid","fecha_iso":"2025-02-02T18:00:00Z",
     "estadio":"Estadi Olímpic Lluís Companys","asistentes":54000,"estado":"Finalizado","marcador_local":1,"marcador_visita":0},
    {"titulo":"J3 Real Sociedad vs Real Betis","liga":"La Liga","deporte":"Fútbol",
     "local":"Real Sociedad","visita":"Real Betis","fecha_iso":"2025-02-03T18:00:00Z",
     "estadio":"Reale Arena","asistentes":36000,"estado":"Finalizado","marcador_local":0,"marcador_visita":2},
]
_id_gen = count(start=1)
for r in _seed:
    DB.append(Event(id=next(_id_gen), **r))

# ====== PÁGINAS (Jinja2) ============================================
API_BASE = "http://127.0.0.1:8000"  # inyectada a templates

@app.get("/", response_class=HTMLResponse, tags=["pages"])
def page_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "api_base": API_BASE})

@app.get("/estadisticas", response_class=HTMLResponse, tags=["pages"])
def page_stats(request: Request):
    return templates.TemplateResponse("estadisticas.html", {"request": request, "api_base": API_BASE})

@app.get("/calendario", response_class=HTMLResponse, tags=["pages"])
def page_calendar(request: Request):
    return templates.TemplateResponse("calendario.html", {"request": request, "api_base": API_BASE})

# ——— NUEVO: Admin (alta/edición rápida)
@app.get("/admin", response_class=HTMLResponse, tags=["pages"])
def page_admin(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request, "api_base": API_BASE})

# ===== API ==========================================================
@app.get("/api", tags=["root"])
def root():
    return {"message": "Sports API up", "count": len(DB)}

# Listado con paginación (servidor) + filtros
@app.get("/events", response_model=List[Event], tags=["events"])
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=50),
    q: Optional[str] = None,
    deporte: Optional[str] = None,
    liga: Optional[str] = None,
):
    items = DB
    if q:
        ql = q.lower()
        items = [e for e in items if any(ql in s.lower() for s in [e.titulo, e.local, e.visita, e.liga])]
    if deporte:
        items = [e for e in items if e.deporte.lower() == deporte.lower()]
    if liga:
        items = [e for e in items if e.liga.lower() == liga.lower()]
    start = (page - 1) * page_size
    return items[start:start + page_size]

@app.get("/events/{event_id}", response_model=Event, tags=["events"])
def get_event(event_id: int):
    for e in DB:
        if e.id == event_id:
            return e
    raise HTTPException(status_code=404, detail="Event not found")

@app.post("/events", response_model=Event, status_code=201, tags=["events"])
def create_event(payload: EventIn):
    evt = Event(id=next(_id_gen), **payload.dict())
    DB.append(evt)
    return evt

@app.put("/events/{event_id}", response_model=Event, tags=["events"])
def update_event(event_id: int, payload: EventIn):
    for i, e in enumerate(DB):
        if e.id == event_id:
            updated = Event(id=e.id, **payload.dict())
            DB[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Event not found")

# ——— Stats: asistencia
@app.get("/stats/attendance-by-team", tags=["stats"])
def attendance_by_team():
    acc: Dict[str, int] = {}
    for e in DB:
        acc[e.local] = acc.get(e.local, 0) + e.asistentes
        acc[e.visita] = acc.get(e.visita, 0) + e.asistentes
    labels = list(acc.keys())
    values = [acc[k] for k in labels]
    return {"labels": labels, "values": values, "updated": datetime.utcnow().isoformat() + "Z"}

# ——— Stats: distribución por estado
@app.get("/stats/event-status", tags=["stats"])
def event_status_breakdown():
    buckets = {"Programado": 0, "En Vivo": 0, "Finalizado": 0}
    for e in DB:
        if e.estado in buckets:
            buckets[e.estado] += 1
    labels = list(buckets.keys())
    values = [buckets[k] for k in labels]
    return {"labels": labels, "values": values, "updated": datetime.utcnow().isoformat() + "Z"}

# ——— Stats: Clasificación (La Liga por defecto; acepta filtros)
@app.get("/stats/standings", tags=["stats"])
def standings(
    deporte: Optional[str] = None,
    liga: Optional[str] = None,
):
    """
    Clasificación a partir de eventos FINALIZADOS con marcador.
    Regla fútbol: 3 pts victoria, 1 empate, 0 derrota.
    Orden: PTS desc, DG desc, GF desc, nombre asc.
    """
    table: Dict[str, Dict[str, int]] = {}

    def row(name: str) -> Dict[str, int]:
        if name not in table:
            table[name] = {"pts": 0, "pj": 0, "pg": 0, "pe": 0, "pp": 0, "gf": 0, "gc": 0}
        return table[name]

    for e in DB:
        if e.estado != "Finalizado":
            continue
        if e.marcador_local is None or e.marcador_visita is None:
            continue
        if deporte and e.deporte.lower() != deporte.lower():
            continue
        if liga and e.liga.lower() != liga.lower():
            continue

        L, V = e.local, e.visita
        gl, gv = int(e.marcador_local), int(e.marcador_visita)
        rL, rV = row(L), row(V)

        rL["pj"] += 1; rV["pj"] += 1
        rL["gf"] += gl; rL["gc"] += gv
        rV["gf"] += gv; rV["gc"] += gl

        if gl > gv:
            rL["pg"] += 1; rV["pp"] += 1; rL["pts"] += 3
        elif gl < gv:
            rV["pg"] += 1; rL["pp"] += 1; rV["pts"] += 3
        else:
            rL["pe"] += 1; rV["pe"] += 1; rL["pts"] += 1; rV["pts"] += 1

    rows = []
    for name, r in table.items():
        rows.append({
            "team": name,
            "pts": r["pts"], "pj": r["pj"], "pg": r["pg"], "pe": r["pe"],
            "pp": r["pp"], "gf": r["gf"], "gc": r["gc"], "dg": r["gf"] - r["gc"]
        })

    rows.sort(key=lambda x: (-x["pts"], -x["dg"], -x["gf"], x["team"].lower()))
    return {"rows": rows, "updated": datetime.utcnow().isoformat() + "Z"}
