endpoints (qué hacen y por qué)

GET /health → heartbeat simple: { ok: true, count: len(DB) }. útil para checar que el server está vivo.

GET /events
filtros:

q: busca en titulo, local, visita, liga (todo en minúsculas para comparación case-insensitive).

deporte: igualdad exacta en minúsculas.

liga: igualdad exacta en minúsculas.
paginación simple: page y page_size.
el frontend los usa para listar y filtrar tarjetas.

GET /events/{event_id} → obtener un evento puntual. si no existe, 404.

POST /events → crear.
validas el payload con EventIn (pydantic te convierte tipos donde puede y te marca error si no). creas Event(id=...) y lo agregas a DB.

PUT /events/{id} → actualizar.
localizas por índice y reemplazas la entrada con uno nuevo Event(...) que usa el mismo id.

GET /calendar/events?year&month
arma una estructura tipo:
{ "month": "YYYY-MM", "days": [ { "date": "YYYY-MM-DD", "events": [ ... ] }, ... ] }.
para lograrlo:

parsea la fecha_iso de cada evento, 2) filtra por año/mes, 3) agrupa por día (diccionario grouped[dt.day] = [...]), 4) produce todos los días del mes (aunque no tengan eventos) usando calendar.monthrange(year, month) para saber hasta qué día llega ese mes, 5) para cada día arma su events (lista vacía si no hubo matches).

GET /calendar/index
un resumen por (año, mes) → cuántos eventos hay. simplemente marcha sobre DB, parsea fecha_iso, lleva un contador en buckets[(year, month)] += 1 y luego lo convierte a lista ordenada.

GET /stats/attendance-by-team
suma asistentes por equipo, contando tanto cuando el equipo es “local” como cuando es “visita”. por eso hace dos líneas:

acc[e.local]  = acc.get(e.local, 0)  + e.asistentes
acc[e.visita] = acc.get(e.visita, 0) + e.asistentes


devuelve { labels: [...equipos], values: [... totales], updated: ISO }.
updated lo generas con datetime.utcnow().isoformat() + "Z" para que el frontend pueda imprimir “Actualizado: …”.

GET /stats/event-status
buckets para Programado, En Vivo, Finalizado. cuenta ocurrencias según e.estado. mismo patrón de labels, values, updated.

GET /stats/standings?deporte&liga
la “tabla” la calculas a partir de los eventos finalizados (los que tienen estado == "Finalizado" y marcadores). por cada partido:

sumas pj (partidos jugados) a ambos.

sumas gf/gc (goles a favor/en contra) usando los marcadores.

si gana local → pg local + 1, pp visita + 1, pts local + 3.
si gana visita → al revés.
si empatan → ambos pe + 1 y pts + 1.
calculas dg = gf - gc, y ordenas por (-pts, -dg, -gf, nombre).
devuelves filas con todas las métricas y updated.

!!!! esta nota es importante: 
esta “DB” vive en memoria del proceso. si se esta probando y reinicias el servidor, se pierde. para demo está perfecto, pero si quisieras tener algo más serio
sería bueno usaruna base como PostgreSQL, etc... :D