from typing import List, Optional, Dict
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from itertools import count

app = FastAPI(title="Sports API (solo JSON)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

class EventIn(BaseModel):
    titulo: str
    liga: str
    deporte: str
    local: str
    visita: str
    fecha_iso: str        
    estadio: str
    asistentes: int
    estado: str           
    marcador_local: int | None = None
    marcador_visita: int | None = None

class Event(EventIn):
    id: int

DB: List[Event] = []
_seed = [
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
_id_gen = count(1)
for r in _seed:
    DB.append(Event(id=next(_id_gen), **r))

@app.get("/api")
def root():
    return {"ok": True, "count": len(DB)}

@app.get("/events", response_model=List[Event])
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=100),
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

@app.get("/calendar/events")
def calendar_events(year: int | None = None, month: int | None = None):
    now = datetime.utcnow()
    if not year:
        year = now.year
    if not month:
        month = now.month

    grouped = defaultdict(list)
    for e in DB:
        try:
            dt = datetime.fromisoformat(e.fecha_iso.replace("Z", "+00:00"))
        except Exception:
            continue
        if dt.year == year and dt.month == month:
            grouped[dt.day].append({
                "id": e.id,
                "time": dt.strftime("%H:%M"),
                "liga": e.liga,
                "title": e.titulo,
                "deporte": e.deporte,
                "estadio": e.estadio,
                "local": e.local,
                "visita": e.visita,
                "estado": e.estado,
                "asistentes": e.asistentes,
                "marcador_local": e.marcador_local,
                "marcador_visita": e.marcador_visita,
            })

    from calendar import monthrange
    last_day = monthrange(year, month)[1]
    days = []
    for d in range(1, last_day + 1):
        days.append({
            "date": f"{year:04d}-{month:02d}-{d:02d}",
            "events": grouped.get(d, [])
        })

    return {"month": f"{year:04d}-{month:02d}", "days": days}

@app.get("/calendar/index")
def calendar_index():
    buckets: Dict[tuple, int] = {}
    for e in DB:
        try:
            dt = datetime.fromisoformat(e.fecha_iso.replace("Z", "+00:00"))
        except Exception:
            continue
        key = (dt.year, dt.month)
        buckets[key] = buckets.get(key, 0) + 1
    items = [{"year": y, "month": m, "count": c} for (y, m), c in buckets.items()]
    items.sort(key=lambda x: (x["year"], x["month"]))
    return items

@app.get("/events/{event_id}", response_model=Event)
def get_event(event_id: int):
    for e in DB:
        if e.id == event_id:
            return e
    raise HTTPException(404, "Event not found")

@app.post("/events", response_model=Event, status_code=201)
def create_event(payload: EventIn):
    evt = Event(id=next(_id_gen), **payload.dict())
    DB.append(evt)
    return evt

@app.put("/events/{event_id}", response_model=Event)
def update_event(event_id: int, payload: EventIn):
    for i, e in enumerate(DB):
        if e.id == event_id:
            DB[i] = Event(id=e.id, **payload.dict())
            return DB[i]
    raise HTTPException(404, "Event not found")

@app.get("/stats/attendance-by-team")
def attendance_by_team():
    acc: Dict[str, int] = {}
    for e in DB:
        acc[e.local] = acc.get(e.local, 0) + e.asistentes
        acc[e.visita] = acc.get(e.visita, 0) + e.asistentes
    labels = list(acc.keys())
    values = [acc[k] for k in labels]
    return {"labels": labels, "values": values, "updated": datetime.utcnow().isoformat() + "Z"}

@app.get("/stats/event-status")
def event_status_breakdown():
    buckets = {"Programado": 0, "En Vivo": 0, "Finalizado": 0}
    for e in DB:
        if e.estado in buckets:
            buckets[e.estado] += 1
    labels = list(buckets.keys())
    values = [buckets[k] for k in labels]
    return {"labels": labels, "values": values, "updated": datetime.utcnow().isoformat() + "Z"}

@app.get("/stats/standings")
def standings(deporte: Optional[str] = None, liga: Optional[str] = None):
    table: Dict[str, Dict[str, int]] = {}

    def row(name: str) -> Dict[str, int]:
        if name not in table:
            table[name] = {"pts": 0, "pj": 0, "pg": 0, "pe": 0, "pp": 0, "gf": 0, "gc": 0}
        return table[name]

    for e in DB:
        if e.estado != "Finalizado": continue
        if e.marcador_local is None or e.marcador_visita is None: continue
        if deporte and e.deporte.lower() != deporte.lower(): continue
        if liga and e.liga.lower() != liga.lower(): continue

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

    rows = [{
        "team": name,
        "pts": r["pts"], "pj": r["pj"], "pg": r["pg"], "pe": r["pe"],
        "pp": r["pp"], "gf": r["gf"], "gc": r["gc"], "dg": r["gf"] - r["gc"]
    } for name, r in table.items()]
    rows.sort(key=lambda x: (-x["pts"], -x["dg"], -x["gf"], x["team"].lower()))
    return {"rows": rows, "updated": datetime.utcnow().isoformat() + "Z"}