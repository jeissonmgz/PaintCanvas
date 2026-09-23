# Paint Canvas Retro

Paint Canvas Retro es una aplicación web de dibujo basada en HTML5 Canvas con una interfaz inspirada en los sistemas operativos clásicos Windows XP y Windows 98.

## Inspiración Retro

El diseño visual evoca la estética retro de Microsoft Paint de finales de los 90 y principios de los 2000, incluyendo:
- Ventana clásica con marco biselado, barra de título azul degradado y botones de control (`_`, `✕`).
- Barras de herramientas, selectores de grosor de línea y paleta de 28 colores característicos.
- Explorador de archivos interno al estilo del Explorador de Windows XP para gestionar proyectos guardados en `localStorage`.

## Estructura del Proyecto

El proyecto está desarrollado con JavaScript Vanilla (sin frameworks ni herramientas de compilación pesadas):

```
PaintCanvas/
├── index.html          # Estructura principal HTML de la aplicación
├── style.css           # Estilos CSS estilo Windows XP/98 y diseño responsive
├── LICENSE             # Licencia MIT
├── package.json        # Metadatos del proyecto
├── fig.png             # Icono / recursos gráficos
└── js/                 # Módulos JavaScript Vanilla
    ├── app.js          # Punto de entrada de la aplicación
    ├── canvas.js       # Gestión del lienzo y sistema de 3 capas
    ├── i18n.js         # Motor de internacionalización (6 idiomas)
    ├── modal.js        # Modales de diálogo y mensajes retro
    ├── palette.js      # Paleta de colores y opacidad
    ├── storage.js      # Persistencia en localStorage y sincronización
    ├── tools.js        # Herramientas de dibujo (Lápiz, Formas, Texto, Relleno)
    └── ui.js           # Controladores de la interfaz, eventos táctiles y menús
```

## Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).
