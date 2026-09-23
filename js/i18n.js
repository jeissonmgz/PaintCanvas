/**
 * Internationalization (i18n) Module - Paint Canvas Retro
 * Handles translation dictionaries (ES, EN, DE, FR, IT, PT),
 * browser language auto-detection, localStorage persistence, and live DOM string updates.
 */
window.Paint = window.Paint || {};

window.Paint.I18n = (function () {
    const STORAGE_KEY = 'paint_canvas_retro_lang';
    const SUPPORTED_LANGS = ['es', 'en', 'de', 'fr', 'it', 'pt'];
    let currentLang = 'es';

    const translations = {
        es: {
            // App Title & Header
            'app.title_suffix': '- Paint Canvas Retro',
            'title.title_input': 'Haz clic para cambiar el nombre del lienzo',
            'title.minimize': 'Minimizar (Abrir Explorador de Archivos)',
            'title.maximize': 'Maximizar',
            'title.close': 'Cerrar (Abrir Explorador de Archivos)',

            // Top Menu Bar
            'menu.file': 'Archivo',
            'menu.file_new': 'Nuevo',
            'menu.file_open': 'Abrir Explorador...',
            'menu.file_save': 'Guardar Proyecto',
            'menu.file_export': 'Exportar Imagen (PNG)...',
            'menu.edit': 'Edición',
            'menu.edit_undo': 'Deshacer',
            'menu.edit_redo': 'Rehacer',
            'menu.edit_paste': 'Pegar Imagen',
            'menu.edit_clear': 'Borrar Lienzo',
            'menu.view': 'Ver',
            'menu.view_zoomin': 'Acercar (Zoom +)',
            'menu.view_zoomout': 'Alejar (Zoom -)',
            'menu.view_reset': 'Restablecer 100%',
            'menu.view_grid': 'Ver Cuadrícula',
            'menu.view_guides': 'Ver Guías',
            'menu.image': 'Imagen',
            'menu.image_resize': 'Tamaño del Lienzo...',
            'menu.help': 'Ayuda',
            'menu.help_about': 'Acerca de Paint Canvas',
            'menu.language': 'Idioma / Language',
            'menu.lang_es': 'Español (ES)',
            'menu.lang_en': 'English (EN)',
            'menu.lang_de': 'Deutsch (DE)',
            'menu.lang_fr': 'Français (FR)',
            'menu.lang_it': 'Italiano (IT)',
            'menu.lang_pt': 'Português (PT)',

            // Sidebar Boxes
            'panel.tools': 'HERRAMIENTAS',
            'panel.options': 'OPCIONES',

            // Tools Labels & Tooltips
            'tool.select_rect': 'Sel. Rect',
            'tool.select_rect_title': 'Selección Rectangular (Recortar y Mover)',
            'tool.select_free': 'Sel. Libre',
            'tool.select_free_title': 'Selección Libre / Lasso (Recortar y Mover)',
            'tool.line': 'Línea',
            'tool.line_title': 'Línea Recta',
            'tool.rect': 'Cuadro',
            'tool.rect_title': 'Rectángulo / Cuadrado',
            'tool.circle': 'Círculo',
            'tool.circle_title': 'Círculo',
            'tool.ellipse': 'Óvalo',
            'tool.ellipse_title': 'Óvalo / Elipse',
            'tool.polygon': 'Polígono',
            'tool.polygon_title': 'Polígono Regular',
            'tool.pencil': 'Lápiz',
            'tool.pencil_title': 'Lápiz / Mano alzada',
            'tool.eraser': 'Borrador',
            'tool.eraser_title': 'Borrador',
            'tool.text': 'Texto',
            'tool.text_title': 'Texto',
            'tool.fill': 'Relleno',
            'tool.fill_title': 'Relleno de color',

            // Tool Options
            'opt.thickness': 'Grosor:',
            'opt.exact_width': 'Grosor exacto (px):',
            'opt.line_caps': 'Puntas de línea:',
            'opt.cap_flat': 'Plano',
            'opt.cap_round': 'Redondo',
            'opt.cap_square': 'Cuadrado',
            'opt.polygon_sides': 'Lados del polígono:',
            'opt.text_font': 'Fuente:',
            'opt.text_size': 'Tamaño:',
            'opt.text_bold_title': 'Negrita (Bold)',
            'opt.text_italic_title': 'Cursiva (Italic)',
            'opt.text_strike_title': 'Tachado (Strikethrough)',
            'opt.text_align': 'Alinear:',
            'opt.align_left': 'Izquierda',
            'opt.align_center': 'Centro',
            'opt.align_right': 'Derecha',
            'opt.enable_stroke': 'Contorno',
            'opt.enable_stroke_title': 'Habilitar trazo / contorno',
            'opt.enable_fill': 'Relleno',
            'opt.enable_fill_title': 'Habilitar relleno de fondo / figura',

            // Color Swatches & Transparency
            'color.row_fg': 'Color 1: Contorno / Texto',
            'color.row_fg_title': 'Clic para seleccionar el color activo de Contorno / Texto',
            'color.row_bg': 'Color 2: Relleno / Fondo',
            'color.row_bg_title': 'Clic para seleccionar el color activo de Relleno / Fondo',
            'color.opacity_title': 'Nivel de transparencia del color (0% a 100%)',
            'color.opacity_label': 'Opacidad',

            // Cardinal Buttons
            'cardinal.n': '▲ +100px',
            'cardinal.n_title': 'Ampliar lienzo +100px hacia arriba',
            'cardinal.s': '▼ +100px',
            'cardinal.s_title': 'Ampliar lienzo +100px hacia abajo',
            'cardinal.e': '▶ +100px',
            'cardinal.e_title': 'Ampliar lienzo +100px hacia la derecha',
            'cardinal.w': '◀ +100px',
            'cardinal.w_title': 'Ampliar lienzo +100px hacia la izquierda',

            // Status Bar
            'status.default': 'Para dibujar, seleccione una herramienta y arrastre sobre el lienzo.',
            'status.dim_title': 'Haz clic para cambiar el tamaño del lienzo',
            'status.zoom_title': 'Haz clic para restablecer zoom a 100%',
            'status.pasted_img': 'Imagen pegada desde el portapapeles. Arrastre los tiradores para cambiar el tamaño.',
            'status.dropped_img': 'Imagen agregada. Arrastre los tiradores para cambiar el tamaño.',
            'status.project_saved': 'Proyecto \'{title}\' guardado correctamente en LocalStorage.',
            'status.project_loaded': 'Canvas \'{title}\' cargado.',
            'status.project_new': 'Nuevo canvas \'{title}\' creado.',

            // Retro Resize Modal
            'resize.modal_title': 'Tamaño del Lienzo',
            'resize.width': 'Ancho (px):',
            'resize.height': 'Alto (px):',
            'btn.ok': 'Aceptar',
            'btn.cancel': 'Cancelar',

            // Retro File Explorer Modal
            'explorer.title': 'Explorador de Archivos - Mis Diseños',
            'explorer.close_title': 'Cerrar Explorador',
            'explorer.btn_new': '📄 Nuevo Canvas',
            'explorer.btn_save': '💾 Guardar Actual',
            'explorer.btn_delete': '🗑️ Eliminar',
            'explorer.search_label': 'Buscar:',
            'explorer.search_placeholder': 'Filtrar por nombre...',
            'explorer.sidebar_tasks': 'TAREAS DE ARCHIVO',
            'explorer.side_new': '📄 Crear nuevo dibujo',
            'explorer.side_save': '💾 Guardar este proyecto',
            'explorer.sidebar_details': 'DETALLES DEL ARCHIVO',
            'explorer.details_empty': 'Seleccione un canvas para ver la información.',
            'explorer.empty_msg': 'No se encontraron archivos de canvas guardados.',
            'explorer.objects_count': '{count} objeto(s) en LocalStorage',
            'explorer.btn_open': 'Abrir Seleccionado',
            'explorer.badge_open': 'ABIERTO',
            'explorer.detail_name': 'Nombre:',
            'explorer.detail_size': 'Tamaño:',
            'explorer.detail_modified': 'Modificado:',

            // Dialog Modals (Alerts / Prompts)
            'modal.warning_title': 'Tamaño del Lienzo',
            'modal.valid_dims_msg': 'Por favor ingrese dimensiones válidas en píxeles.',
            'modal.new_title_prompt': 'Ingrese el nombre para el nuevo dibujo:',
            'modal.new_title_heading': 'Nuevo Canvas',
            'modal.confirm_delete_msg': '¿Está seguro de que desea eliminar el archivo "{title}"?',
            'modal.delete_heading': 'Eliminar Canvas',
            'modal.storage_full_msg': 'El almacenamiento de LocalStorage está lleno. Elimine algunos proyectos antiguos para guardar este dibujo.',
            'modal.storage_error_title': 'Error de Almacenamiento',
            'modal.paste_help_msg': 'Para pegar una imagen, use el atajo de teclado Ctrl+V (Cmd+V en Mac) cuando tenga una imagen en el portapapeles.',
            'modal.paste_help_title': 'Pegar Imagen',
            'modal.unsupported_file_msg': 'Por favor arrastre únicamente archivos de imagen (PNG, JPG, WEBP, GIF, BMP, SVG).',
            'modal.unsupported_file_title': 'Archivo No Soportado',
            'modal.about_msg': 'Paint Canvas Retro (Vanilla JS)\nInspirado en el clásico Microsoft Paint (Windows XP/98).\n¡Disfruta creando tu arte!',
            'modal.about_title': 'Acerca de Paint Canvas'
        },
        en: {
            // App Title & Header
            'app.title_suffix': '- Paint Canvas Retro',
            'title.title_input': 'Click to change canvas project name',
            'title.minimize': 'Minimize (Open File Explorer)',
            'title.maximize': 'Maximize',
            'title.close': 'Close (Open File Explorer)',

            // Top Menu Bar
            'menu.file': 'File',
            'menu.file_new': 'New',
            'menu.file_open': 'Open Explorer...',
            'menu.file_save': 'Save Project',
            'menu.file_export': 'Export Image (PNG)...',
            'menu.edit': 'Edit',
            'menu.edit_undo': 'Undo',
            'menu.edit_redo': 'Redo',
            'menu.edit_paste': 'Paste Image',
            'menu.edit_clear': 'Clear Canvas',
            'menu.view': 'View',
            'menu.view_zoomin': 'Zoom In (+)',
            'menu.view_zoomout': 'Zoom Out (-)',
            'menu.view_reset': 'Reset 100%',
            'menu.view_grid': 'View Grid',
            'menu.view_guides': 'View Guides',
            'menu.image': 'Image',
            'menu.image_resize': 'Canvas Size...',
            'menu.help': 'Help',
            'menu.help_about': 'About Paint Canvas',
            'menu.language': 'Language / Idioma',
            'menu.lang_es': 'Español (ES)',
            'menu.lang_en': 'English (EN)',
            'menu.lang_de': 'Deutsch (DE)',
            'menu.lang_fr': 'Français (FR)',
            'menu.lang_it': 'Italiano (IT)',
            'menu.lang_pt': 'Português (PT)',

            // Sidebar Boxes
            'panel.tools': 'TOOLS',
            'panel.options': 'OPTIONS',

            // Tools Labels & Tooltips
            'tool.select_rect': 'Rect Sel.',
            'tool.select_rect_title': 'Rectangular Selection (Crop and Move)',
            'tool.select_free': 'Free Sel.',
            'tool.select_free_title': 'Freeform Selection / Lasso (Crop and Move)',
            'tool.line': 'Line',
            'tool.line_title': 'Straight Line',
            'tool.rect': 'Rectangle',
            'tool.rect_title': 'Rectangle / Square',
            'tool.circle': 'Circle',
            'tool.circle_title': 'Circle',
            'tool.ellipse': 'Oval',
            'tool.ellipse_title': 'Oval / Ellipse',
            'tool.polygon': 'Polygon',
            'tool.polygon_title': 'Regular Polygon',
            'tool.pencil': 'Pencil',
            'tool.pencil_title': 'Pencil / Freehand',
            'tool.eraser': 'Eraser',
            'tool.eraser_title': 'Eraser',
            'tool.text': 'Text',
            'tool.text_title': 'Text Box',
            'tool.fill': 'Fill',
            'tool.fill_title': 'Color Fill (Bucket)',

            // Tool Options
            'opt.thickness': 'Width:',
            'opt.exact_width': 'Exact width (px):',
            'opt.line_caps': 'Line caps:',
            'opt.cap_flat': 'Flat',
            'opt.cap_round': 'Round',
            'opt.cap_square': 'Square',
            'opt.polygon_sides': 'Polygon sides:',
            'opt.text_font': 'Font:',
            'opt.text_size': 'Size:',
            'opt.text_bold_title': 'Bold',
            'opt.text_italic_title': 'Italic',
            'opt.text_strike_title': 'Strikethrough',
            'opt.text_align': 'Align:',
            'opt.align_left': 'Left',
            'opt.align_center': 'Center',
            'opt.align_right': 'Right',
            'opt.enable_stroke': 'Stroke',
            'opt.enable_stroke_title': 'Enable stroke / contour border',
            'opt.enable_fill': 'Fill',
            'opt.enable_fill_title': 'Enable background / shape fill',

            // Color Swatches & Transparency
            'color.row_fg': 'Color 1: Stroke / Text',
            'color.row_fg_title': 'Click to select active Stroke / Text color',
            'color.row_bg': 'Color 2: Fill / Background',
            'color.row_bg_title': 'Click to select active Fill / Background color',
            'color.opacity_title': 'Color transparency level (0% to 100%)',
            'color.opacity_label': 'Opacity',

            // Cardinal Buttons
            'cardinal.n': '▲ +100px',
            'cardinal.n_title': 'Expand canvas +100px upwards',
            'cardinal.s': '▼ +100px',
            'cardinal.s_title': 'Expand canvas +100px downwards',
            'cardinal.e': '▶ +100px',
            'cardinal.e_title': 'Expand canvas +100px to the right',
            'cardinal.w': '◀ +100px',
            'cardinal.w_title': 'Expand canvas +100px to the left',

            // Status Bar
            'status.default': 'To draw, select a tool and drag on the canvas.',
            'status.dim_title': 'Click to change canvas size',
            'status.zoom_title': 'Click to reset zoom to 100%',
            'status.pasted_img': 'Image pasted from clipboard. Drag handles to resize.',
            'status.dropped_img': 'Image added. Drag handles to resize.',
            'status.project_saved': 'Project \'{title}\' successfully saved to LocalStorage.',
            'status.project_loaded': 'Canvas \'{title}\' loaded.',
            'status.project_new': 'New canvas \'{title}\' created.',

            // Retro Resize Modal
            'resize.modal_title': 'Canvas Size',
            'resize.width': 'Width (px):',
            'resize.height': 'Height (px):',
            'btn.ok': 'OK',
            'btn.cancel': 'Cancel',

            // Retro File Explorer Modal
            'explorer.title': 'File Explorer - My Designs',
            'explorer.close_title': 'Close Explorer',
            'explorer.btn_new': '📄 New Canvas',
            'explorer.btn_save': '💾 Save Current',
            'explorer.btn_delete': '🗑️ Delete',
            'explorer.search_label': 'Search:',
            'explorer.search_placeholder': 'Filter by name...',
            'explorer.sidebar_tasks': 'FILE TASKS',
            'explorer.side_new': '📄 Create new drawing',
            'explorer.side_save': '💾 Save this project',
            'explorer.sidebar_details': 'FILE DETAILS',
            'explorer.details_empty': 'Select a canvas to view information.',
            'explorer.empty_msg': 'No saved canvas files found.',
            'explorer.objects_count': '{count} object(s) in LocalStorage',
            'explorer.btn_open': 'Open Selected',
            'explorer.badge_open': 'OPEN',
            'explorer.detail_name': 'Name:',
            'explorer.detail_size': 'Size:',
            'explorer.detail_modified': 'Modified:',

            // Dialog Modals (Alerts / Prompts)
            'modal.warning_title': 'Canvas Size',
            'modal.valid_dims_msg': 'Please enter valid dimensions in pixels.',
            'modal.new_title_prompt': 'Enter name for the new drawing:',
            'modal.new_title_heading': 'New Canvas',
            'modal.confirm_delete_msg': 'Are you sure you want to delete file "{title}"?',
            'modal.delete_heading': 'Delete Canvas',
            'modal.storage_full_msg': 'LocalStorage is full. Delete older projects to save this drawing.',
            'modal.storage_error_title': 'Storage Error',
            'modal.paste_help_msg': 'To paste an image, press Ctrl+V (Cmd+V on Mac) when you have an image in your clipboard.',
            'modal.paste_help_title': 'Paste Image',
            'modal.unsupported_file_msg': 'Please drag image files only (PNG, JPG, WEBP, GIF, BMP, SVG).',
            'modal.unsupported_file_title': 'Unsupported File',
            'modal.about_msg': 'Paint Canvas Retro (Vanilla JS)\nInspired by classic Microsoft Paint (Windows XP/98).\nEnjoy creating your art!',
            'modal.about_title': 'About Paint Canvas'
        },
        de: {
            // App Title & Header
            'app.title_suffix': '- Paint Canvas Retro',
            'title.title_input': 'Klicken, um den Leinwandnamen zu ändern',
            'title.minimize': 'Minimieren (Datei-Explorer öffnen)',
            'title.maximize': 'Maximieren',
            'title.close': 'Schließen (Datei-Explorer öffnen)',

            // Top Menu Bar
            'menu.file': 'Datei',
            'menu.file_new': 'Neu',
            'menu.file_open': 'Explorer öffnen...',
            'menu.file_save': 'Projekt speichern',
            'menu.file_export': 'Bild exportieren (PNG)...',
            'menu.edit': 'Bearbeiten',
            'menu.edit_undo': 'Rückgängig',
            'menu.edit_redo': 'Wiederholen',
            'menu.edit_paste': 'Bild einfügen',
            'menu.edit_clear': 'Leinwand löschen',
            'menu.view': 'Ansicht',
            'menu.view_zoomin': 'Vergrößern (+)',
            'menu.view_zoomout': 'Verkleinern (-)',
            'menu.view_reset': '100% zurücksetzen',
            'menu.view_grid': 'Raster anzeigen',
            'menu.view_guides': 'Hilfslinien anzeigen',
            'menu.image': 'Bild',
            'menu.image_resize': 'Leinwandgröße...',
            'menu.help': 'Hilfe',
            'menu.help_about': 'Über Paint Canvas',
            'menu.language': 'Sprache / Language',
            'menu.lang_es': 'Español (ES)',
            'menu.lang_en': 'English (EN)',
            'menu.lang_de': 'Deutsch (DE)',
            'menu.lang_fr': 'Français (FR)',
            'menu.lang_it': 'Italiano (IT)',
            'menu.lang_pt': 'Português (PT)',

            // Sidebar Boxes
            'panel.tools': 'WERKZEUGE',
            'panel.options': 'OPTIONEN',

            // Tools Labels & Tooltips
            'tool.select_rect': 'Rechteck-Ausw.',
            'tool.select_rect_title': 'Rechteckige Auswahl (Zuschneiden & Bewegen)',
            'tool.select_free': 'Freie Ausw.',
            'tool.select_free_title': 'Freie Auswahl / Lasso (Zuschneiden & Bewegen)',
            'tool.line': 'Linie',
            'tool.line_title': 'Gerade Linie',
            'tool.rect': 'Rechteck',
            'tool.rect_title': 'Rechteck / Quadrat',
            'tool.circle': 'Kreis',
            'tool.circle_title': 'Kreis',
            'tool.ellipse': 'Oval',
            'tool.ellipse_title': 'Oval / Ellipse',
            'tool.polygon': 'Polygon',
            'tool.polygon_title': 'Regelmäßiges Polygon',
            'tool.pencil': 'Stift',
            'tool.pencil_title': 'Bleistift / Freihand',
            'tool.eraser': 'Radierer',
            'tool.eraser_title': 'Radiergummi',
            'tool.text': 'Text',
            'tool.text_title': 'Textfeld',
            'tool.fill': 'Füllen',
            'tool.fill_title': 'Farbfüllung (Eimer)',

            // Tool Options
            'opt.thickness': 'Dicke:',
            'opt.exact_width': 'Genaue Dicke (px):',
            'opt.line_caps': 'Linienenden:',
            'opt.cap_flat': 'Flach',
            'opt.cap_round': 'Rund',
            'opt.cap_square': 'Quadratisch',
            'opt.polygon_sides': 'Polygonecken:',
            'opt.text_font': 'Schriftart:',
            'opt.text_size': 'Größe:',
            'opt.text_bold_title': 'Fett',
            'opt.text_italic_title': 'Kursiv',
            'opt.text_strike_title': 'Durchgestrichen',
            'opt.text_align': 'Ausrichten:',
            'opt.align_left': 'Links',
            'opt.align_center': 'Zentriert',
            'opt.align_right': 'Rechts',
            'opt.enable_stroke': 'Kontur',
            'opt.enable_stroke_title': 'Kontur aktivieren',
            'opt.enable_fill': 'Füllung',
            'opt.enable_fill_title': 'Füllung aktivieren',

            // Color Swatches & Transparency
            'color.row_fg': 'Farbe 1: Kontur / Text',
            'color.row_fg_title': 'Klicken, um Farbe 1 auszuwählen',
            'color.row_bg': 'Farbe 2: Füllung / Hintergrund',
            'color.row_bg_title': 'Klicken, um Farbe 2 auszuwählen',
            'color.opacity_title': 'Farbtransparenz (0% bis 100%)',
            'color.opacity_label': 'Deckkraft',

            // Cardinal Buttons
            'cardinal.n': '▲ +100px',
            'cardinal.n_title': 'Leinwand um +100px nach oben erweitern',
            'cardinal.s': '▼ +100px',
            'cardinal.s_title': 'Leinwand um +100px nach unten erweitern',
            'cardinal.e': '▶ +100px',
            'cardinal.e_title': 'Leinwand um +100px nach rechts erweitern',
            'cardinal.w': '◀ +100px',
            'cardinal.w_title': 'Leinwand um +100px nach links erweitern',

            // Status Bar
            'status.default': 'Wählen Sie ein Werkzeug und ziehen Sie auf der Leinwand.',
            'status.dim_title': 'Klicken, um Leinwandgröße zu ändern',
            'status.zoom_title': 'Klicken, um Zoom auf 100% zurückzusetzen',
            'status.pasted_img': 'Bild aus Zwischenablage eingefügt. Ziehen Sie an den Griffen zum Skalieren.',
            'status.dropped_img': 'Bild hinzugefügt. Ziehen Sie an den Griffen zum Skalieren.',
            'status.project_saved': 'Projekt \'{title}\' erfolgreich in LocalStorage gespeichert.',
            'status.project_loaded': 'Leinwand \'{title}\' geladen.',
            'status.project_new': 'Neue Leinwand \'{title}\' erstellt.',

            // Retro Resize Modal
            'resize.modal_title': 'Leinwandgröße',
            'resize.width': 'Breite (px):',
            'resize.height': 'Höhe (px):',
            'btn.ok': 'OK',
            'btn.cancel': 'Abbrechen',

            // Retro File Explorer Modal
            'explorer.title': 'Datei-Explorer - Meine Entwürfe',
            'explorer.close_title': 'Explorer schließen',
            'explorer.btn_new': '📄 Neue Leinwand',
            'explorer.btn_save': '💾 Aktuelles speichern',
            'explorer.btn_delete': '🗑️ Löschen',
            'explorer.search_label': 'Suchen:',
            'explorer.search_placeholder': 'Nach Name filtern...',
            'explorer.sidebar_tasks': 'DATEIAUFGABEN',
            'explorer.side_new': '📄 Neue Zeichnung erstellen',
            'explorer.side_save': '💾 Dieses Projekt speichern',
            'explorer.sidebar_details': 'DATEIDETAILS',
            'explorer.details_empty': 'Wählen Sie eine Leinwand, um Details anzuzeigen.',
            'explorer.empty_msg': 'Keine gespeicherten Leinwanddateien gefunden.',
            'explorer.objects_count': '{count} Objekt(e) in LocalStorage',
            'explorer.btn_open': 'Ausgewähltes öffnen',
            'explorer.badge_open': 'OFFEN',
            'explorer.detail_name': 'Name:',
            'explorer.detail_size': 'Größe:',
            'explorer.detail_modified': 'Geändert:',

            // Dialog Modals (Alerts / Prompts)
            'modal.warning_title': 'Leinwandgröße',
            'modal.valid_dims_msg': 'Bitte geben Sie gültige Abmessungen in Pixeln ein.',
            'modal.new_title_prompt': 'Geben Sie einen Namen für die neue Zeichnung ein:',
            'modal.new_title_heading': 'Neue Leinwand',
            'modal.confirm_delete_msg': 'Möchten Sie die Datei "{title}" wirklich löschen?',
            'modal.delete_heading': 'Leinwand löschen',
            'modal.storage_full_msg': 'LocalStorage ist voll. Löschen Sie ältere Projekte.',
            'modal.storage_error_title': 'Speicherfehler',
            'modal.paste_help_msg': 'Verwenden Sie Strg+V (Cmd+V auf Mac), um ein Bild einzufügen.',
            'modal.paste_help_title': 'Bild einfügen',
            'modal.unsupported_file_msg': 'Bitte ziehen Sie nur Bilddateien (PNG, JPG, WEBP, GIF, BMP, SVG).',
            'modal.unsupported_file_title': 'Nicht unterstützte Datei',
            'modal.about_msg': 'Paint Canvas Retro (Vanilla JS)\nInspiriert vom klassischen Microsoft Paint (Windows XP/98).\nViel Spaß beim Gestalten!',
            'modal.about_title': 'Über Paint Canvas'
        },
        fr: {
            // App Title & Header
            'app.title_suffix': '- Paint Canvas Retro',
            'title.title_input': 'Cliquer pour changer le nom de la toile',
            'title.minimize': 'Réduire (Ouvrir l\'explorateur de fichiers)',
            'title.maximize': 'Agrandir',
            'title.close': 'Fermer (Ouvrir l\'explorateur de fichiers)',

            // Top Menu Bar
            'menu.file': 'Fichier',
            'menu.file_new': 'Nouveau',
            'menu.file_open': 'Ouvrir l\'explorateur...',
            'menu.file_save': 'Enregistrer le projet',
            'menu.file_export': 'Exporter l\'image (PNG)...',
            'menu.edit': 'Édition',
            'menu.edit_undo': 'Annuler',
            'menu.edit_redo': 'Rétablir',
            'menu.edit_paste': 'Coller une image',
            'menu.edit_clear': 'Effacer la toile',
            'menu.view': 'Affichage',
            'menu.view_zoomin': 'Zoom avant (+)',
            'menu.view_zoomout': 'Zoom arrière (-)',
            'menu.view_reset': 'Réinitialiser à 100%',
            'menu.view_grid': 'Afficher la grille',
            'menu.view_guides': 'Afficher les repères',
            'menu.image': 'Image',
            'menu.image_resize': 'Taille de la toile...',
            'menu.help': 'Aide',
            'menu.help_about': 'À propos de Paint Canvas',
            'menu.language': 'Langue / Language',
            'menu.lang_es': 'Español (ES)',
            'menu.lang_en': 'English (EN)',
            'menu.lang_de': 'Deutsch (DE)',
            'menu.lang_fr': 'Français (FR)',
            'menu.lang_it': 'Italiano (IT)',
            'menu.lang_pt': 'Português (PT)',

            // Sidebar Boxes
            'panel.tools': 'OUTILS',
            'panel.options': 'OPTIONS',

            // Tools Labels & Tooltips
            'tool.select_rect': 'Sél. Rect',
            'tool.select_rect_title': 'Sélection rectangulaire (Régler & Déplacer)',
            'tool.select_free': 'Sél. Libre',
            'tool.select_free_title': 'Sélection libre / Lasso (Régler & Déplacer)',
            'tool.line': 'Ligne',
            'tool.line_title': 'Ligne droite',
            'tool.rect': 'Rectangle',
            'tool.rect_title': 'Rectangle / Carré',
            'tool.circle': 'Cercle',
            'tool.circle_title': 'Cercle',
            'tool.ellipse': 'Oval',
            'tool.ellipse_title': 'Ovale / Ellipse',
            'tool.polygon': 'Polygone',
            'tool.polygon_title': 'Polygone régulier',
            'tool.pencil': 'Crayon',
            'tool.pencil_title': 'Crayon / Dessin libre',
            'tool.eraser': 'Gomme',
            'tool.eraser_title': 'Gomme',
            'tool.text': 'Texte',
            'tool.text_title': 'Zone de texte',
            'tool.fill': 'Remplissage',
            'tool.fill_title': 'Remplissage de couleur (Sceau)',

            // Tool Options
            'opt.thickness': 'Épaisseur :',
            'opt.exact_width': 'Épaisseur exacte (px) :',
            'opt.line_caps': 'Embouts de ligne :',
            'opt.cap_flat': 'Plat',
            'opt.cap_round': 'Rond',
            'opt.cap_square': 'Carré',
            'opt.polygon_sides': 'Côtés du polygone :',
            'opt.text_font': 'Police :',
            'opt.text_size': 'Taille :',
            'opt.text_bold_title': 'Gras',
            'opt.text_italic_title': 'Italique',
            'opt.text_strike_title': 'Barré',
            'opt.text_align': 'Aligner :',
            'opt.align_left': 'Gauche',
            'opt.align_center': 'Centre',
            'opt.align_right': 'Droite',
            'opt.enable_stroke': 'Contour',
            'opt.enable_stroke_title': 'Activer le contour',
            'opt.enable_fill': 'Remplissage',
            'opt.enable_fill_title': 'Activer le remplissage',

            // Color Swatches & Transparency
            'color.row_fg': 'Couleur 1 : Contour / Texte',
            'color.row_fg_title': 'Cliquer pour choisir la couleur 1',
            'color.row_bg': 'Couleur 2 : Remplissage / Fond',
            'color.row_bg_title': 'Cliquer pour choisir la couleur 2',
            'color.opacity_title': 'Transparence de la couleur (0% à 100%)',
            'color.opacity_label': 'Opacité',

            // Cardinal Buttons
            'cardinal.n': '▲ +100px',
            'cardinal.n_title': 'Agrandir la toile de +100px vers le haut',
            'cardinal.s': '▼ +100px',
            'cardinal.s_title': 'Agrandir la toile de +100px vers le bas',
            'cardinal.e': '▶ +100px',
            'cardinal.e_title': 'Agrandir la toile de +100px vers la droite',
            'cardinal.w': '◀ +100px',
            'cardinal.w_title': 'Agrandir la toile de +100px vers la gauche',

            // Status Bar
            'status.default': 'Pour dessiner, sélectionnez un outil et faites glisser sur la toile.',
            'status.dim_title': 'Cliquer pour modifier la taille de la toile',
            'status.zoom_title': 'Cliquer pour réinitialiser le zoom à 100%',
            'status.pasted_img': 'Image collée depuis le presse-papiers. Redimensionnez avec les poignées.',
            'status.dropped_img': 'Image ajoutée. Redimensionnez avec les poignées.',
            'status.project_saved': 'Projet \'{title}\' enregistré dans le LocalStorage.',
            'status.project_loaded': 'Toile \'{title}\' chargée.',
            'status.project_new': 'Nouvelle toile \'{title}\' créée.',

            // Retro Resize Modal
            'resize.modal_title': 'Taille de la toile',
            'resize.width': 'Largeur (px) :',
            'resize.height': 'Hauteur (px) :',
            'btn.ok': 'Accepter',
            'btn.cancel': 'Annuler',

            // Retro File Explorer Modal
            'explorer.title': 'Explorateur de fichiers - Mes Créations',
            'explorer.close_title': 'Fermer l\'explorateur',
            'explorer.btn_new': '📄 Nouvelle toile',
            'explorer.btn_save': '💾 Enregistrer actuel',
            'explorer.btn_delete': '🗑️ Supprimer',
            'explorer.search_label': 'Rechercher :',
            'explorer.search_placeholder': 'Filtrar par nom...',
            'explorer.sidebar_tasks': 'TÂCHES DE FICHIER',
            'explorer.side_new': '📄 Créer un nouveau dessin',
            'explorer.side_save': '💾 Enregistrer ce projet',
            'explorer.sidebar_details': 'DÉTAILS DU FICHIER',
            'explorer.details_empty': 'Sélectionnez une toile pour afficher les informations.',
            'explorer.empty_msg': 'Aucun fichier de toile enregistré.',
            'explorer.objects_count': '{count} objet(s) dans le LocalStorage',
            'explorer.btn_open': 'Ouvrir la sélection',
            'explorer.badge_open': 'OUVERT',
            'explorer.detail_name': 'Nom :',
            'explorer.detail_size': 'Taille :',
            'explorer.detail_modified': 'Modifié :',

            // Dialog Modals (Alerts / Prompts)
            'modal.warning_title': 'Taille de la toile',
            'modal.valid_dims_msg': 'Veuillez entrer des dimensions valides en pixels.',
            'modal.new_title_prompt': 'Saisissez le nom du nouveau dessin :',
            'modal.new_title_heading': 'Nouvelle toile',
            'modal.confirm_delete_msg': 'Voulez-vous vraiment supprimer le fichier "{title}" ?',
            'modal.delete_heading': 'Supprimer la toile',
            'modal.storage_full_msg': 'Le stockage LocalStorage est plein. Supprimez de anciens projets.',
            'modal.storage_error_title': 'Erreur de stockage',
            'modal.paste_help_msg': 'Utilisez Ctrl+V (Cmd+V sur Mac) pour coller une image du presse-papiers.',
            'modal.paste_help_title': 'Coller une image',
            'modal.unsupported_file_msg': 'Veuillez déposer uniquement des fichiers image (PNG, JPG, WEBP, GIF, BMP, SVG).',
            'modal.unsupported_file_title': 'Fichier non pris en charge',
            'modal.about_msg': 'Paint Canvas Retro (Vanilla JS)\nInspiré du célèbre Microsoft Paint (Windows XP/98).\nBonne création !',
            'modal.about_title': 'À propos de Paint Canvas'
        },
        it: {
            // App Title & Header
            'app.title_suffix': '- Paint Canvas Retro',
            'title.title_input': 'Fai clic per modificare il nome della tela',
            'title.minimize': 'Riduci a icona (Apri Esplora file)',
            'title.maximize': 'Ingrandisci',
            'title.close': 'Chiudi (Apri Esplora file)',

            // Top Menu Bar
            'menu.file': 'File',
            'menu.file_new': 'Nuovo',
            'menu.file_open': 'Apri Esplora file...',
            'menu.file_save': 'Salva progetto',
            'menu.file_export': 'Esporta immagine (PNG)...',
            'menu.edit': 'Modifica',
            'menu.edit_undo': 'Annulla',
            'menu.edit_redo': 'Ripristina',
            'menu.edit_paste': 'Incolla immagine',
            'menu.edit_clear': 'Cancella tela',
            'menu.view': 'Visualizza',
            'menu.view_zoomin': 'Zoom avanti (+)',
            'menu.view_zoomout': 'Zoom indietro (-)',
            'menu.view_reset': 'Ripristina 100%',
            'menu.view_grid': 'Mostra griglia',
            'menu.view_guides': 'Mostra guide',
            'menu.image': 'Immagine',
            'menu.image_resize': 'Dimensioni tela...',
            'menu.help': 'Guida',
            'menu.help_about': 'Informazioni su Paint Canvas',
            'menu.language': 'Lingua / Language',
            'menu.lang_es': 'Español (ES)',
            'menu.lang_en': 'English (EN)',
            'menu.lang_de': 'Deutsch (DE)',
            'menu.lang_fr': 'Français (FR)',
            'menu.lang_it': 'Italiano (IT)',
            'menu.lang_pt': 'Português (PT)',

            // Sidebar Boxes
            'panel.tools': 'STRUMENTI',
            'panel.options': 'OPZIONI',

            // Tools Labels & Tooltips
            'tool.select_rect': 'Selez. Rett.',
            'tool.select_rect_title': 'Selezione rettangolare (Ritaglio e Spostamento)',
            'tool.select_free': 'Selez. Libera',
            'tool.select_free_title': 'Selezione libera / Lasso (Ritaglio e Spostamento)',
            'tool.line': 'Linea',
            'tool.line_title': 'Linea retta',
            'tool.rect': 'Rettangolo',
            'tool.rect_title': 'Rettangolo / Quadrato',
            'tool.circle': 'Cerchio',
            'tool.circle_title': 'Cerchio',
            'tool.ellipse': 'Ovale',
            'tool.ellipse_title': 'Ovale / Ellisse',
            'tool.polygon': 'Poligono',
            'tool.polygon_title': 'Poligono regolare',
            'tool.pencil': 'Matita',
            'tool.pencil_title': 'Matita / Disegno libero',
            'tool.eraser': 'Gomma',
            'tool.eraser_title': 'Gomma da cancellare',
            'tool.text': 'Testo',
            'tool.text_title': 'Casella di testo',
            'tool.fill': 'Riempimento',
            'tool.fill_title': 'Riempimento colore (Secchiello)',

            // Tool Options
            'opt.thickness': 'Spessore:',
            'opt.exact_width': 'Spessore esatto (px):',
            'opt.line_caps': 'Estremità linea:',
            'opt.cap_flat': 'Piatta',
            'opt.cap_round': 'Arrotondata',
            'opt.cap_square': 'Quadrata',
            'opt.polygon_sides': 'Lati del poligono:',
            'opt.text_font': 'Carattere:',
            'opt.text_size': 'Dimensione:',
            'opt.text_bold_title': 'Grassetto',
            'opt.text_italic_title': 'Corsivo',
            'opt.text_strike_title': 'Barrato',
            'opt.text_align': 'Allinea:',
            'opt.align_left': 'Sinistra',
            'opt.align_center': 'Centro',
            'opt.align_right': 'Destra',
            'opt.enable_stroke': 'Contorno',
            'opt.enable_stroke_title': 'Abilita contorno',
            'opt.enable_fill': 'Riempimento',
            'opt.enable_fill_title': 'Abilita riempimento',

            // Color Swatches & Transparency
            'color.row_fg': 'Colore 1: Contorno / Testo',
            'color.row_fg_title': 'Fai clic per selezionare il Colore 1',
            'color.row_bg': 'Colore 2: Riempimento / Sfondo',
            'color.row_bg_title': 'Fai clic per selezionare il Colore 2',
            'color.opacity_title': 'Trasparenza del colore (da 0% a 100%)',
            'color.opacity_label': 'Opacità',

            // Cardinal Buttons
            'cardinal.n': '▲ +100px',
            'cardinal.n_title': 'Espandi la tela di +100px verso l\'alto',
            'cardinal.s': '▼ +100px',
            'cardinal.s_title': 'Espandi la tela di +100px verso il basso',
            'cardinal.e': '▶ +100px',
            'cardinal.e_title': 'Espandi la tela di +100px verso destra',
            'cardinal.w': '◀ +100px',
            'cardinal.w_title': 'Espandi la tela di +100px verso sinistra',

            // Status Bar
            'status.default': 'Per disegnare, seleziona uno strumento e trascina sulla tela.',
            'status.dim_title': 'Fai clic per modificare le dimensioni della tela',
            'status.zoom_title': 'Fai clic per ripristinare lo zoom al 100%',
            'status.pasted_img': 'Immagine incollata negli appunti. Trascina le maniglie per ridimensionare.',
            'status.dropped_img': 'Immagine aggiunta. Trascina le maniglie per ridimensionare.',
            'status.project_saved': 'Progetto \'{title}\' salvato correttamente in LocalStorage.',
            'status.project_loaded': 'Tela \'{title}\' caricata.',
            'status.project_new': 'Nuova tela \'{title}\' creata.',

            // Retro Resize Modal
            'resize.modal_title': 'Dimensioni tela',
            'resize.width': 'Larghezza (px):',
            'resize.height': 'Altezza (px):',
            'btn.ok': 'OK',
            'btn.cancel': 'Annulla',

            // Retro File Explorer Modal
            'explorer.title': 'Esplora file - I miei disegni',
            'explorer.close_title': 'Chiudi Esplora file',
            'explorer.btn_new': '📄 Nuova tela',
            'explorer.btn_save': '💾 Salva attuale',
            'explorer.btn_delete': '🗑️ Elimina',
            'explorer.search_label': 'Cerca:',
            'explorer.search_placeholder': 'Filtra per nome...',
            'explorer.sidebar_tasks': 'ATTIVITÀ FILE',
            'explorer.side_new': '📄 Crea nuovo disegno',
            'explorer.side_save': '💾 Salva questo progetto',
            'explorer.sidebar_details': 'DETTAGLI FILE',
            'explorer.details_empty': 'Seleziona una tela per visualizzare le informazioni.',
            'explorer.empty_msg': 'Nessun file di tela salvato trovato.',
            'explorer.objects_count': '{count} oggetto/i in LocalStorage',
            'explorer.btn_open': 'Apri selezionato',
            'explorer.badge_open': 'APERTO',
            'explorer.detail_name': 'Nome:',
            'explorer.detail_size': 'Dimensioni:',
            'explorer.detail_modified': 'Modificato:',

            // Dialog Modals (Alerts / Prompts)
            'modal.warning_title': 'Dimensioni tela',
            'modal.valid_dims_msg': 'Inserisci dimensioni valide in pixel.',
            'modal.new_title_prompt': 'Inserisci il nome per il nuovo disegno:',
            'modal.new_title_heading': 'Nuova tela',
            'modal.confirm_delete_msg': 'Sei sicuro di voler eliminare il file "{title}"?',
            'modal.delete_heading': 'Elimina tela',
            'modal.storage_full_msg': 'Lo spazio in LocalStorage è esaurito. Elimina i vecchi progetti.',
            'modal.storage_error_title': 'Errore di archiviazione',
            'modal.paste_help_msg': 'Usa Ctrl+V (Cmd+V su Mac) per incollare un\'immagine dagli appunti.',
            'modal.paste_help_title': 'Incolla immagine',
            'modal.unsupported_file_msg': 'Trascina solo file immagine (PNG, JPG, WEBP, GIF, BMP, SVG).',
            'modal.unsupported_file_title': 'File non supportato',
            'modal.about_msg': 'Paint Canvas Retro (Vanilla JS)\nIspirato al classico Microsoft Paint (Windows XP/98).\nBuon divertimento!',
            'modal.about_title': 'Informazioni su Paint Canvas'
        },
        pt: {
            // App Title & Header
            'app.title_suffix': '- Paint Canvas Retro',
            'title.title_input': 'Clique para alterar o nome da tela',
            'title.minimize': 'Minimizar (Abrir Explorador de Arquivos)',
            'title.maximize': 'Maximizar',
            'title.close': 'Fechar (Abrir Explorador de Arquivos)',

            // Top Menu Bar
            'menu.file': 'Arquivo',
            'menu.file_new': 'Novo',
            'menu.file_open': 'Abrir Explorador...',
            'menu.file_save': 'Salvar Projeto',
            'menu.file_export': 'Exportar Imagem (PNG)...',
            'menu.edit': 'Editar',
            'menu.edit_undo': 'Desfazer',
            'menu.edit_redo': 'Refazer',
            'menu.edit_paste': 'Colar Imagem',
            'menu.edit_clear': 'Limpar Tela',
            'menu.view': 'Exibir',
            'menu.view_zoomin': 'Aumentar Zoom (+)',
            'menu.view_zoomout': 'Diminuir Zoom (-)',
            'menu.view_reset': 'Redefinir 100%',
            'menu.view_grid': 'Exibir Grade',
            'menu.view_guides': 'Exibir Guias',
            'menu.image': 'Imagem',
            'menu.image_resize': 'Tamanho da Tela...',
            'menu.help': 'Ajuda',
            'menu.help_about': 'Sobre o Paint Canvas',
            'menu.language': 'Idioma / Language',
            'menu.lang_es': 'Español (ES)',
            'menu.lang_en': 'English (EN)',
            'menu.lang_de': 'Deutsch (DE)',
            'menu.lang_fr': 'Français (FR)',
            'menu.lang_it': 'Italiano (IT)',
            'menu.lang_pt': 'Português (PT)',

            // Sidebar Boxes
            'panel.tools': 'FERRAMENTAS',
            'panel.options': 'OPÇÕES',

            // Tools Labels & Tooltips
            'tool.select_rect': 'Sel. Ret.',
            'tool.select_rect_title': 'Seleção Retangular (Recortar e Mover)',
            'tool.select_free': 'Sel. Livre',
            'tool.select_free_title': 'Seleção Livre / Lasso (Recortar e Mover)',
            'tool.line': 'Linha',
            'tool.line_title': 'Linha Reta',
            'tool.rect': 'Retângulo',
            'tool.rect_title': 'Retângulo / Quadrado',
            'tool.circle': 'Círculo',
            'tool.circle_title': 'Círculo',
            'tool.ellipse': 'Óvalo',
            'tool.ellipse_title': 'Óvalo / Elipse',
            'tool.polygon': 'Polígono',
            'tool.polygon_title': 'Polígono Regular',
            'tool.pencil': 'Lápis',
            'tool.pencil_title': 'Lápis / Desenho Livre',
            'tool.eraser': 'Borracha',
            'tool.eraser_title': 'Borracha',
            'tool.text': 'Texto',
            'tool.text_title': 'Caixa de Texto',
            'tool.fill': 'Preencher',
            'tool.fill_title': 'Preenchimento de Cor (Balde)',

            // Tool Options
            'opt.thickness': 'Espessura:',
            'opt.exact_width': 'Espessura exata (px):',
            'opt.line_caps': 'Pontas da linha:',
            'opt.cap_flat': 'Plana',
            'opt.cap_round': 'Redonda',
            'opt.cap_square': 'Quadrada',
            'opt.polygon_sides': 'Lados do polígono:',
            'opt.text_font': 'Fonte:',
            'opt.text_size': 'Tamanho:',
            'opt.text_bold_title': 'Negrito',
            'opt.text_italic_title': 'Itálico',
            'opt.text_strike_title': 'Tachado',
            'opt.text_align': 'Alinhar:',
            'opt.align_left': 'Esquerda',
            'opt.align_center': 'Centro',
            'opt.align_right': 'Direita',
            'opt.enable_stroke': 'Contorno',
            'opt.enable_stroke_title': 'Habilitar contorno',
            'opt.enable_fill': 'Preenchimento',
            'opt.enable_fill_title': 'Habilitar preenchimento',

            // Color Swatches & Transparency
            'color.row_fg': 'Cor 1: Contorno / Texto',
            'color.row_fg_title': 'Clique para selecionar a Cor 1',
            'color.row_bg': 'Cor 2: Preenchimento / Fundo',
            'color.row_bg_title': 'Clique para selecionar a Cor 2',
            'color.opacity_title': 'Transparência da cor (0% a 100%)',
            'color.opacity_label': 'Opacidade',

            // Cardinal Buttons
            'cardinal.n': '▲ +100px',
            'cardinal.n_title': 'Expandir tela +100px para cima',
            'cardinal.s': '▼ +100px',
            'cardinal.s_title': 'Expandir tela +100px para baixo',
            'cardinal.e': '▶ +100px',
            'cardinal.e_title': 'Expandir tela +100px para a direita',
            'cardinal.w': '◀ +100px',
            'cardinal.w_title': 'Expandir tela +100px para a esquerda',

            // Status Bar
            'status.default': 'Para desenhar, selecione uma ferramenta e arraste na tela.',
            'status.dim_title': 'Clique para alterar o tamanho da tela',
            'status.zoom_title': 'Clique para redefinir o zoom para 100%',
            'status.pasted_img': 'Imagem colada da área de transferência. Arraste as alças para redimensionar.',
            'status.dropped_img': 'Imagem adicionada. Arraste as alças para redimensionar.',
            'status.project_saved': 'Projeto \'{title}\' salvo com sucesso no LocalStorage.',
            'status.project_loaded': 'Tela \'{title}\' carregada.',
            'status.project_new': 'Nova tela \'{title}\' criada.',

            // Retro Resize Modal
            'resize.modal_title': 'Tamanho da Tela',
            'resize.width': 'Largura (px):',
            'resize.height': 'Altura (px):',
            'btn.ok': 'OK',
            'btn.cancel': 'Cancelar',

            // Retro File Explorer Modal
            'explorer.title': 'Explorador de Arquivos - Meus Desenhos',
            'explorer.close_title': 'Fechar Explorador',
            'explorer.btn_new': '📄 Nova Tela',
            'explorer.btn_save': '💾 Salvar Atual',
            'explorer.btn_delete': '🗑️ Excluir',
            'explorer.search_label': 'Buscar:',
            'explorer.search_placeholder': 'Filtrar por nome...',
            'explorer.sidebar_tasks': 'TAREFAS DE ARQUIVO',
            'explorer.side_new': '📄 Criar novo desenho',
            'explorer.side_save': '💾 Salvar este projeto',
            'explorer.sidebar_details': 'DETALHES DO ARQUIVO',
            'explorer.details_empty': 'Selecione uma tela para ver as informações.',
            'explorer.empty_msg': 'Nenhum arquivo de tela salvo encontrado.',
            'explorer.objects_count': '{count} objeto(s) no LocalStorage',
            'explorer.btn_open': 'Abrir Selecionado',
            'explorer.badge_open': 'ABERTO',
            'explorer.detail_name': 'Nome:',
            'explorer.detail_size': 'Tamanho:',
            'explorer.detail_modified': 'Modificado:',

            // Dialog Modals (Alerts / Prompts)
            'modal.warning_title': 'Tamanho da Tela',
            'modal.valid_dims_msg': 'Por favor insira dimensões válidas em pixels.',
            'modal.new_title_prompt': 'Digite o nome para o novo desenho:',
            'modal.new_title_heading': 'Nova Tela',
            'modal.confirm_delete_msg': 'Tem certeza que deseja excluir o arquivo "{title}"?',
            'modal.delete_heading': 'Excluir Tela',
            'modal.storage_full_msg': 'O armazenamento LocalStorage está cheio. Exclua projetos antigos.',
            'modal.storage_error_title': 'Erro de Armazenamento',
            'modal.paste_help_msg': 'Use o atalho Ctrl+V (Cmd+V no Mac) para colar uma imagem da área de transferência.',
            'modal.paste_help_title': 'Colar Imagem',
            'modal.unsupported_file_msg': 'Por favor arraste apenas arquivos de imagem (PNG, JPG, WEBP, GIF, BMP, SVG).',
            'modal.unsupported_file_title': 'Arquivo Não Suportado',
            'modal.about_msg': 'Paint Canvas Retro (Vanilla JS)\nInspirado no clássico Microsoft Paint (Windows XP/98).\nDivirta-se criando!',
            'modal.about_title': 'Sobre o Paint Canvas'
        }
    };

    /**
     * Auto-detects default language from browser API navigator.language
     * @returns {string} 'es', 'en', 'de', 'fr', 'it', or 'pt'
     */
    function detectBrowserLanguage() {
        const navLang = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
        if (navLang.startsWith('es')) return 'es';
        if (navLang.startsWith('de')) return 'de';
        if (navLang.startsWith('fr')) return 'fr';
        if (navLang.startsWith('it')) return 'it';
        if (navLang.startsWith('pt')) return 'pt';
        if (navLang.startsWith('en')) return 'en';
        return 'en';
    }

    /**
     * Gets current active language (stored preference or browser default)
     */
    function getLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && SUPPORTED_LANGS.includes(saved)) {
                return saved;
            }
        } catch (e) {
            console.error('Error reading language from localStorage:', e);
        }
        return detectBrowserLanguage();
    }

    /**
     * Sets current language, persists choice, and updates DOM elements.
     * @param {string} lang 
     */
    function setLanguage(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) lang = 'es';
        currentLang = lang;

        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.error('Error saving language preference:', e);
        }

        updateDOMTranslations();

        // Update active document title suffix
        const titleInput = document.getElementById('project-title-input');
        const val = titleInput ? titleInput.value.trim() : 'Sin título.png';
        document.title = `${val || 'Sin título.png'} ${t('app.title_suffix')}`;

        if (window.Paint && window.Paint.UI && window.Paint.UI.onLanguageChanged) {
            window.Paint.UI.onLanguageChanged(currentLang);
        }
    }

    /**
     * Translates a key for current language with optional string interpolations.
     * @param {string} key 
     * @param {Object} params 
     * @returns {string}
     */
    function t(key, params = {}) {
        const langDict = translations[currentLang] || translations['es'];
        let text = langDict[key] || translations['es'][key] || key;

        if (params && typeof params === 'object') {
            Object.keys(params).forEach(pKey => {
                text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
            });
        }
        return text;
    }

    /**
     * Scans DOM for data-i18n attributes and updates text, title, and placeholders.
     */
    function updateDOMTranslations() {
        const textNodes = document.querySelectorAll('[data-i18n]');
        textNodes.forEach(node => {
            const key = node.dataset.i18n;
            if (key) {
                node.textContent = t(key);
            }
        });

        const titleNodes = document.querySelectorAll('[data-i18n-title]');
        titleNodes.forEach(node => {
            const key = node.dataset.i18nTitle;
            if (key) {
                node.setAttribute('title', t(key));
            }
        });

        const placeholderNodes = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderNodes.forEach(node => {
            const key = node.dataset.i18nPlaceholder;
            if (key) {
                node.setAttribute('placeholder', t(key));
            }
        });
    }

    function init() {
        currentLang = getLanguage();
        updateDOMTranslations();
    }

    return {
        init,
        getLanguage,
        setLanguage,
        detectBrowserLanguage,
        t,
        updateDOMTranslations,
        SUPPORTED_LANGS
    };
})();
