# Paz_Portafolio_fisica
Portafolio de evidencias de **Física I (FUN-18)** · Universidad CENFOTEC · 2026-C3.
Recopila aplicaciones concretas de la física mecánica al desarrollo de software.

- **Sitio publicado:** https://marypaznaranjo.github.io/Paz_Portafolio_fisica/
- **Estudiante:** Paz Naranjo Bonilla · **Docente:** Andrés Castro Núñez
## Avance 1 · Cinemática y Dinámica
| Tema | Recurso |
|---|---|
| 1. Rastreo y navegación de un dron de reparto | Visualización de datos |
| 2. El salto del personaje: cómo los motores de juego falsean la gravedad | Simulación interactiva |
| 3. Gravedad artificial por rotación en hábitats espaciales | Diagrama |
| 4. Llantas de Fórmula 1: la ventana de temperatura y el agarre | Visualización de datos |
| 5. El resorte virtual detrás de un control háptico | Multimedia con análisis |

## Avance 2 · Energía y momento lineal
| Tema | Recurso |
|---|---|
| 6. Frenado regenerativo en un vehículo eléctrico | Visualización de datos (ciclos UDDS y HWFET de la EPA) |
| 7. El coeficiente de restitución en un motor de videojuego: por qué la pelota rebota mal | Simulación interactiva |
| 8. Ruedas de reacción: cómo un satélite se gira sin empujarse contra nada | Diagrama (SVG propio) + calculadora |
| 9. Asistencia gravitatoria: cómo la Voyager ganó velocidad sin gastar combustible | Visualización de datos (NASA/JPL Horizons) |

## Estructura
```
index.html        Página única con los 13 temas (9 desarrollados)
css/              Estilos (Montserrat + paleta navy/rosa)
js/               Lógica de cada recurso (tema1.js … tema9.js)
data/             Ciclos de manejo de la EPA (Tema 6) y trayectoria de la Voyager 2 de JPL Horizons (Tema 9), en CSV
media/            Video del Tema 5
lib/              KaTeX 0.16.9 y Chart.js 4.4.1 (incluidos localmente)
fonts/            Montserrat (SIL Open Font License)
```

## Uso de inteligencia artificial
Para la creación de las imágenes y figuras se utilizó Claude, versión Opus 5.5 (Anthropic, 2026). El detalle está en la sección "Uso de inteligencia artificial" del sitio.
