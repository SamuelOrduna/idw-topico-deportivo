# Proyecto1-Desarrollo-web

### Integrantes
Mariela Mejía Gutiérrez - 201373

Samuel Rodrigo Orduña Ferreira - 207739

Luis Eduardo Suarez Arroyo - 202717

Carlos Lugo Torres - 207647

## Proyecto elegido
El proyecto elegido fue <strong>página de eventos deportivos</strong> la cual está basada en un sitio que muestre eventos deportivos como partidos, torneos, competencias, etc donde se incluya información general, calendario y estadísticas.

Las características técnicas de la página son las siguientes:
- Listado de eventos
- Tema claro/oscuro persistente
- API de resultados deportivos
- Gráficas con rendimiento o asistencia por equipo

### Objetivo
El objetivo del proyecto es incorporar los temas vistos en clase y reforzar las habilidades adquiridas. Específicamente, se busca incorporar temas como:
- Responsividad de una página web usando Bootstrap 5.3.8
- Manejo de APIs mediante fetch
- Manejo de visualización de datos
- Aplicar los fundamentos de HTML semántico y la estructura de documentación 
- Programación de interactividad mediante el uso de JavaScript

# Proceso de elaboración del diseño (frontend)
El proceso del diseño se inició eligiendo los colores que se usarían en la página web. Para ello, se investigó sobre la psicología de los colores, pues buscamos que nuestra página sea atractiva para los aficionados del deporte. 

Basándonos en la siguiente imagen, se eligieron los colores rojo, blanco y negro.
<p align="center">
    <img src="imagenesReadme/psicologiaColores.png" width="500" alt="Imagen mostrando significado de los colores en la psicología">
</p>

Justificación de la decisión: 
- <strong>Rojo:</strong> Es un color potente y dinámico que proyecta pasión y urgencia. Se usó para incentivar la pasión de los fanáticos de los deportes y fomentar la urgencia de consultar los calendarios y resultados de los eventos más esperados. Además, el rojo tiene la capacidadad de destacar elementos clave en nuestro diseño, como tipo de deporte o botones relevantes, guiando la atención del usuario a la información de interés. 
- <strong>Blanco:</strong> Este color se eligió con el fin de representar la limpieza y lograr una visión ordenada y amigable a la vista de los usuarios. El blanco también actúa como un espacio de respiro entre elementos más intensos, equilibrando la composición y reforzando la accesibilidad del sitio.
- <strong>Negro:</strong> Representa la elegancia, refinamiento y seriedad. Se utilizó para dotar a la página de un tono profesional y sofisticado, acorde con la naturaleza de los eventos deportivos de alto nivel. 

Una vez eligiendo los colores, pasamos al diseño gráfico de la interfaz. Para ello, nos auxiliamos de ChatGPT para la creación de una interfaz que fuera visualmente atractiva y ordenada (NOTA: No se utilizó para la elaboración del código, únicamente para generar una foto sobre cómo queríamos los diseños. Evidencia de la conversación: https://chatgpt.com/share/69015248-cadc-8001-9525-db077cb875ee). 

<strong>Los diseños de inspiración (en modo oscuro) fueron los siguientes:</strong>

Inspiración eventos (pantalla principal)

<p align="center">
    <img src="imagenesReadme/inspiracionEventosOscuro.png" width="500" alt="Imagen inspiración diseño para eventos (pantalla principal)">
</p>

Inspiración estadísticas

<p align="center">
    <img src="imagenesReadme/inspiracionEstadisticasOscuro.png" width="500" alt="Imagen inspiración diseño para estadísticas">
</p>

Inspiración calendario

<p align="center">
    <img src="imagenesReadme/inspiracionCalendarioOscuro.png" width="500" alt="Imagen inspiración diseño para calendario">
</p>

<strong>Los diseños de inspiración (en modo claro) fueron los siguientes:</strong>

Inspiración eventos (pantalla principal)

<p align="center">
    <img src="imagenesReadme/inspiracionEventos.jpeg" width="500" alt="Imagen inspiración diseño para eventos (pantalla principal)">
</p>

Inspiración estadísticas

<p align="center">
    <img src="imagenesReadme/inspiracionEstadisticas.jpeg" width="500" alt="Imagen inspiración diseño para estadísticas">
</p>

Inspiración calendario

<p align="center">
    <img src="imagenesReadme/inspiracionCalendario.jpeg" width="500" alt="Imagen inspiración diseño para calendario">
</p>

## Proceso elaboración eventos

## Proceso elaboración estadísticas
### Estructura general
- Encabezado con título y subtítulo y un botón de tema (luna/sol) que alterna entre claro y oscuro.
- Pestañas superiores (Eventos, Estadísticas, Calendario) con la pestaña de Estadísticas activa para reforzar la navegación (que el usuario sepa en qué pestaña está).
- Bloque de filtros con buscador y selects de Deporte, Competición y Temporada. Se utilizaron input groups y form-select de Bootstrap para uniformidad y accesibilidad.
- Panel principal dividido en dos columnas:
    - Columna izquierda: gráfica de barras “Estadísticas de goles” (goles, en contra, disparos, a puerta) y gráfica de pastel “Tiros de esquina”.
    - Columna derecha: tabla de clasificación con columnas (#, Equipo, PTS, PJ, PG, PE) y acción “Ver tabla completa”.

### Componentes 
- Bootstrap 5.3.8: espaciados, botones, formularios y utilidades responsivas.
- Chart.js 4:
    - Barra para comparativos cuantitativos.
    - Gráfica de pastel para proporciones.
    - Colores de los charts ligados a variables CSS para que cambien automáticamente con el tema.
- JavaScript:
    - Toggle de tema (claro/oscuro) con persistencia en localStorage.
    - Reconstrucción de gráficas al cambiar de tema para respetar la paleta activa (destrucción/creación controlada de instancias Chart.js).

### Responsividad
- Diseño mobile-first con col-12, col-sm-*, col-lg-* para asegurar buena lectura en pantallas pequeñas y grandes.
- Iconografía con Bootstrap Icons y textos alternativos/labels en los formularios.
- Contraste verificado para ambos modos (con el objetivo de facilitar la lectura)

### Comportamiento del tema
- Si no existe una preferencia guardada, se usa el modo oscuro (nuestro default)
- Icono para cambiar de modo cambia de luna a sol y viceversa 

### Retos 
- Sincronizar colores de Chart.js con el tema: se resolvió leyendo variables CSS (--legend, --grid, --bar-1, --bar-2) y reconstruyendo las instancias al alternar.
- Coherencia visual entre pestañas: se normalizaron paddings, radios y bordes para que Filtros/Estadísticas/Calendario compartan la misma jerarquía visual.
- Legibilidad de tabla en oscuro: se ajustaron tokens de color de celdas/encabezados y se añadió una regla específica para el texto de clasificación.

## Proceso elaboración calendario

# Proceso de elaboración del funcionamiento (backend)
