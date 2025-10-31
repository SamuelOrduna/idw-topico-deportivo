# 📡 API Endpoints Overview

> ⚠️ **Nota importante:**  
> Esta “DB” vive en memoria del proceso.  
> Si reinicias el servidor, los datos se pierden.  
> Para un entorno real, usa una base de datos persistente (p. ej. PostgreSQL).

---

## 🩺 GET `/health`

**Descripción:**  
Verifica que el servidor está en funcionamiento.

**Respuesta:**
```json
{ "ok": true, "count": <número_de_eventos_en_memoria> }
```

**Uso:**  
Heartbeat simple para confirmar que el servidor está vivo.

---

## 🏟️ GET `/events`

**Descripción:**  
Lista los eventos con soporte de filtros y paginación.

**Parámetros de consulta (`query params`):**
- `q`: búsqueda en `titulo`, `local`, `visita`, `liga` (case-insensitive).  
- `deporte`: coincidencia exacta (en minúsculas).  
- `liga`: coincidencia exacta (en minúsculas).  
- `page` y `page_size`: control de paginación.

**Uso típico:**  
El frontend lo usa para listar y filtrar tarjetas de eventos.

---

## 🎯 GET `/events/{event_id}`

**Descripción:**  
Obtiene la información completa de un evento específico.

**Errores posibles:**
- `404` si el evento no existe.

---

## ➕ POST `/events`

**Descripción:**  
Crea un nuevo evento.

**Proceso interno:**
1. Valida el cuerpo (`payload`) con `EventIn` (Pydantic).  
2. Convierte tipos automáticamente y lanza error si algo no coincide.  
3. Crea un nuevo objeto `Event(id=...)` y lo agrega a la base de datos en memoria.

---

## ✏️ PUT `/events/{id}`

**Descripción:**  
Actualiza un evento existente.

**Proceso interno:**
1. Localiza el evento por su `id`.  
2. Reemplaza la entrada existente con un nuevo objeto `Event(...)` usando el mismo ID.

---

## 📅 GET `/calendar/events?year=&month=`

**Descripción:**  
Devuelve una estructura tipo calendario con los eventos agrupados por día.

**Respuesta:**
```json
{
  "month": "YYYY-MM",
  "days": [
    { "date": "YYYY-MM-DD", "events": [ ... ] },
    ...
  ]
}
```

**Lógica interna:**
1. Parsear `fecha_iso` de cada evento.  
2. Filtrar por año y mes.  
3. Agrupar por día.  
4. Usar `calendar.monthrange(year, month)` para generar todos los días del mes, incluso los que no tienen eventos.  
5. Para cada día, incluir su lista de eventos (vacía si no hay).

---

## 🗓️ GET `/calendar/index`

**Descripción:**  
Resumen por año y mes del número de eventos registrados.

**Lógica:**
1. Recorre todos los eventos.  
2. Extrae año y mes de `fecha_iso`.  
3. Incrementa el contador en `buckets[(year, month)] += 1`.  
4. Devuelve una lista ordenada con los totales.

---

## 👥 GET `/stats/attendance-by-team`

**Descripción:**  
Suma de asistentes por equipo (local y visitante).

**Lógica:**
```python
acc[e.local]  = acc.get(e.local, 0)  + e.asistentes
acc[e.visita] = acc.get(e.visita, 0) + e.asistentes
```

**Respuesta:**
```json
{
  "labels": ["Equipo A", "Equipo B", ...],
  "values": [12345, 9876, ...],
  "updated": "2025-10-30T22:15:00Z"
}
```

**Uso:**  
El frontend muestra un gráfico de barras con los totales por equipo.

---

## 📊 GET `/stats/event-status`

**Descripción:**  
Cuenta cuántos eventos hay en cada estado (`Programado`, `En Vivo`, `Finalizado`).

**Respuesta:**
```json
{
  "labels": ["Programado", "En Vivo", "Finalizado"],
  "values": [10, 3, 25],
  "updated": "2025-10-30T22:20:00Z"
}
```

**Uso:**  
Permite mostrar gráficos de distribución por estado de evento.

---

## 🏆 GET `/stats/standings?deporte=&liga=`

**Descripción:**  
Genera una tabla de posiciones basada en los eventos **finalizados**.

**Lógica de cálculo:**
1. Considera solo eventos con `estado == "Finalizado"`.  
2. Para cada partido:
   - Incrementa `pj` (partidos jugados).  
   - Suma `gf` y `gc` (goles a favor/en contra).  
   - Si gana local → `pg local +1`, `pp visita +1`, `pts local +3`.  
   - Si gana visita → inverso.  
   - Si empatan → ambos `pe +1`, `pts +1`.  
3. Calcula `dg = gf - gc`.  
4. Ordena por `(-pts, -dg, -gf, nombre)`.

**Respuesta esperada:**
```json
{
  "rows": [
    { "equipo": "Tigres", "pj": 5, "pg": 4, "pe": 1, "pp": 0, "gf": 12, "gc": 5, "dg": 7, "pts": 13 },
    ...
  ],
  "updated": "2025-10-30T22:25:00Z"
}
```

**Uso:**  
Mostrar tablas de posiciones actualizadas por liga y deporte.

---
