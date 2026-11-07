# White Door — Music Studio Tycoon

Juego tycoon en estilo 8-bit sobre un estudio de música. Empiezas en tu cuarto con una laptop vieja y una **puerta blanca**, y tu meta es convertir **White Door** en el sello discográfico más famoso del mundo.

Desarrollado por **Julian Camilo Forero Daza**.

## Cómo jugar

### Producir
- **Nueva canción:** ponle nombre y elige género, tema y formato (Sencillo, EP o Álbum). Después repartes tu enfoque entre las 9 áreas de las 3 fases (Composición, Grabación y Producción). Solo avanza mientras estás en el estudio.
- **Reseñas:** cuatro críticos califican cada lanzamiento. Con cada canción descubres qué áreas pesan más en cada género y qué combinaciones de género y tema funcionan.
- **Bandeja:** con más prestigio te escriben artistas cada vez más famosos (Desconocido → Emergente → Local → Nacional → Estrella → Leyenda) para que les produzcas.

### Mundo abierto
- **Ciudad:** sal del estudio y camina con flechas/WASD o haciendo clic. Entra a los edificios con `E` o con un clic:
  - Tienda de música · Academia · Café La Corchea · Club Neón 8 · Radio FM Pixel · Parque · Bienes Raíces · Agencia de Talentos · Centro Comercial.
- Con bicicleta o auto te mueves más rápido.

### Vida (estilo Sims)
- **Necesidades:** energía, hambre, ánimo y salud. Si las descuidas rindes menos, te desmayas o terminas en el hospital.
- **Decisiones de vida:** fiestas, familia, pareja (salir, formalizar, vivir juntos, casarse), concursos, préstamos, impuestos, bloqueos creativos, premios anuales y más.
- **Averías:** el computador, el micrófono, los monitores, la luz, el techo o el aire acondicionado se pueden dañar. Puedes repararlos tú (habilidad Manitas) o llamar a un técnico.
- **Aspiraciones:** metas de vida y de carrera con recompensas.

### Objetivos y trabajos
- **Objetivos:** 28 metas en 4 capítulos (Primeros pasos → Estrella), cada una con su recompensa en dinero, XP, prestigio o fans. Se reclaman con el botón Objetivos.
- **Trabajos:** vender beats, dar clases online, mezclar para clientes, crear sample packs (ingreso pasivo), pinchar de DJ en el Club Neón y componer jingles en la Radio.
- **Ingresos pasivos:** merch que se vende según tus fans y alquiler de tu cabina de grabación.
- **Rutina automática** (panel Vida): comes, duermes y descansas solo cuando una barra está muy baja.

### Empresa
- **Módulos:** cada propiedad tiene espacio para cuartos extra: Oficina, Cabina de grabación, Sala de ensayo, Lounge y Dormitorio. Recórrelos con ◀ ▶.
- **Personal:** asistentes, ingenieros de sonido, productores, mánagers y community managers. Trabajan en segundo plano y los ves en sus escritorios.
- **White Door Records:** funda tu sello, firma artistas y ponlos a entrenar, grabar con tus productores, salir de gira o co-producir contigo (más puntos y menos ruido; el artista de la canción siempre ayuda).

Atajos de teclado: `Espacio` pausa · `1` `2` `3` cambian la velocidad · `Esc` cierra ventanas · `◀ ▶` cambian de cuarto · `E` entra a un edificio.

La partida se guarda sola en el navegador (localStorage). Las partidas de la versión 1 se convierten automáticamente.

## Ejecutar

Es HTML, CSS y JavaScript puro, sin dependencias ni compilación:

```bash
python serve.py
```

y abre http://localhost:5173.

## Jugar en el celular

- **En línea:** https://juliandev1704.github.io/WhiteDoor-The-Game/
- **Instalar como app:** abre el enlace en Chrome (Android) → menú ⋮ → *Agregar a la pantalla principal* / *Instalar app*. En iPhone: Safari → Compartir → *Agregar a inicio*. Se abre en pantalla completa y funciona sin internet.
- **APK:** genera el paquete Android desde https://www.pwabuilder.com con la URL del juego.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Interfaz principal |
| `css/style.css` | Estilos 8-bit |
| `js/data.js`, `js/data2.js` | Contenido: géneros, tienda, cursos, propiedades, módulos, personal, aspiraciones, averías |
| `js/render.js` | Motor de pixel art (escena 320×180, sala de control, sprites e íconos) |
| `js/modules.js` | Dibujo de módulos, personal trabajando y efectos de averías |
| `js/world.js` | La ciudad: mapa, caminar, peatones, autos y edificios |
| `js/audio.js` | Efectos y música chiptune con WebAudio |
| `js/game.js` | Núcleo: tiempo, producción, puntajes, economía, guardado |
| `js/life.js` | Necesidades, eventos de vida, averías y premios |
| `js/label.js` | Sello discográfico, artistas firmados y personal |
| `js/extras.js` | Objetivos con recompensas, trabajos e ingresos pasivos |
| `js/ui.js`, `js/ui2.js` | Menús, paneles y ventanas |
| `js/main.js` | Arranque y bucle principal |
| `serve.py` | Servidor local sin caché |
| `manifest.webmanifest`, `sw.js`, `icons/` | App instalable (PWA) y modo sin internet |
