# White Door — Music Studio Tycoon

Juego tycoon en estilo 8-bit sobre un estudio de música. Empiezas en tu cuarto con una laptop vieja y una **puerta blanca**, y tu meta es convertir **White Door** en el sello discográfico más famoso del mundo.

Desarrollado por **Julian Camilo Forero Daza**.

## Cómo jugar

- **Nueva canción:** ponle nombre y elige género, tema y formato (Sencillo, EP o Álbum). Después repartes tu enfoque entre las 9 áreas de las 3 fases (Composición, Grabación y Producción).
- **Reseñas:** cuatro críticos califican cada lanzamiento. Con cada canción descubres qué áreas pesan más en cada género y qué combinaciones de género y tema funcionan.
- **Bandeja:** con más prestigio te escriben artistas cada vez más famosos (Desconocido → Emergente → Local → Nacional → Estrella → Leyenda) para que les produzcas.
- **Tienda:** micrófonos, computadores, monitores, instrumentos y software.
- **Estudio:** múdate de tu cuarto a un garaje, un local, un estudio profesional y, al final, a White Door Records HQ. Además puedes decorarlo (neón, gato, sofá, arcade, discos de oro…).
- **Academia:** cursos para aprender géneros nuevos, subir tus habilidades y desbloquear EPs, álbumes, marketing y más.

Atajos de teclado: `Espacio` pausa · `1` `2` `3` cambian la velocidad · `Esc` cierra ventanas.

La partida se guarda sola en el navegador (localStorage).

## Ejecutar

Es HTML, CSS y JavaScript puro, sin dependencias ni compilación. Sirve la carpeta con cualquier servidor estático:

```bash
python -m http.server 5173
```

y abre http://localhost:5173.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Interfaz principal |
| `css/style.css` | Estilos 8-bit |
| `js/data.js` | Contenido del juego: géneros, tienda, cursos, habitaciones, artistas |
| `js/render.js` | Motor de pixel art (escena 320×180, sprites e íconos) |
| `js/audio.js` | Efectos y música chiptune con WebAudio |
| `js/game.js` | Lógica del tycoon: producción, puntajes, economía, guardado |
| `js/ui.js` | Menús y ventanas |
| `js/main.js` | Arranque y bucle principal |
