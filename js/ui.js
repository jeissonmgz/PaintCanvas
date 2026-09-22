/**
 * UI Module - Paint Canvas Retro
 * Connects user interface components, toolbar, menus, color swatches, status bar, and dialogs.
 */
window.Paint = window.Paint || {};

window.Paint.UI = (function () {
    const Canvas = window.Paint.Canvas;
    const Tools = window.Paint.Tools;
    const Palette = window.Paint.Palette;

    function init() {
        setupMenuDropdowns();
        setupToolButtons();
        setupToolOptions();
        setupColorSwatches();
        setupCanvasEvents();
        setupWindowControls();
        updateStatusBarDimensions();
    }

    function setupMenuDropdowns() {
        // Toggle dropdown menus on click
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const btn = item.querySelector('.menu-btn');
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other open menus
                menuItems.forEach(other => {
                    if (other !== item) other.classList.remove('open');
                });
                item.classList.toggle('open');
            });
        });

        // Close dropdowns when clicking anywhere outside
        document.addEventListener('click', () => {
            menuItems.forEach(item => item.classList.remove('open'));
        });

        // Menu item actions
        const actions = {
            'action-new': () => {
                if (confirm('¿Desea crear un nuevo lienzo? Se perderán los cambios no guardados.')) {
                    Canvas.clearCanvas(true);
                    Canvas.saveHistory();
                }
            },
            'action-export': () => Canvas.exportImage(),
            'action-undo': () => Canvas.undo(),
            'action-redo': () => Canvas.redo(),
            'action-clear': () => {
                Canvas.clearCanvas(true);
                Canvas.saveHistory();
            },
            'action-grid': () => {
                const active = Canvas.toggleGrid();
                document.getElementById('action-grid').classList.toggle('checked', active);
            },
            'action-guides': () => {
                const active = Canvas.toggleGuides();
                document.getElementById('action-guides').classList.toggle('checked', active);
            },
            'action-resize': () => openResizeModal(),
            'action-about': () => alert('Paint Canvas Retro (Vanilla JS)\nInspirado en el clásico Microsoft Paint (Windows XP/98).\n¡Disfruta creando tu arte!')
        };

        Object.keys(actions).forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.addEventListener('click', (e) => {
                    e.preventDefault();
                    actions[id]();
                });
            }
        });
    }

    function setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                toolButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const toolName = btn.dataset.tool;
                Tools.setTool(toolName);
                updateToolOptionsVisibility(toolName);
                updateStatusText(`Herramienta activa: ${toolName.toUpperCase()}`);
            });
        });
    }

    function updateToolOptionsVisibility(toolName) {
        const polygonOpt = document.getElementById('opt-polygon-sides');
        if (polygonOpt) {
            polygonOpt.style.display = (toolName === 'polygon') ? 'inline-flex' : 'none';
        }
    }

    function setupToolOptions() {
        // Line Width
        const widthInput = document.getElementById('line-width');
        if (widthInput) {
            widthInput.addEventListener('change', (e) => Tools.setLineWidth(e.target.value));
        }

        // Line Cap Style
        const capSelect = document.getElementById('line-cap');
        if (capSelect) {
            capSelect.addEventListener('change', (e) => Tools.setLineCap(e.target.value));
        }

        // Polygon sides
        const sidesInput = document.getElementById('polygon-sides');
        if (sidesInput) {
            sidesInput.addEventListener('change', (e) => Tools.setPolygonSides(e.target.value));
        }

        // Stroke & Fill toggles
        const strokeCheck = document.getElementById('enable-stroke');
        if (strokeCheck) {
            strokeCheck.addEventListener('change', (e) => {
                Tools.setStrokeEnabled(e.target.checked);
                syncCheckboxStates();
            });
        }

        const fillCheck = document.getElementById('enable-fill');
        if (fillCheck) {
            fillCheck.addEventListener('change', (e) => {
                Tools.setFillEnabled(e.target.checked);
                if (e.target.checked) {
                    // Auto-sync fill color if background color is unassigned white/lightgray
                    if (Palette.getBackgroundColor() === '#ffffff' || Palette.getBackgroundColor() === '#c0c0c0') {
                        Palette.setBackgroundColor(Palette.getForegroundColor());
                        updateColorIndicators();
                    }
                }
                syncCheckboxStates();
            });
        }
    }

    function syncCheckboxStates() {
        const strokeCheck = document.getElementById('enable-stroke');
        const fillCheck = document.getElementById('enable-fill');
        if (strokeCheck) strokeCheck.checked = Tools.isStrokeEnabled();
        if (fillCheck) fillCheck.checked = Tools.isFillEnabled();
    }

    function enableFillOption() {
        Tools.setFillEnabled(true);
        syncCheckboxStates();
    }

    function setupColorSwatches() {
        const container = document.getElementById('swatch-grid');
        if (!container) return;

        container.innerHTML = '';
        Palette.presetSwatches.forEach(hex => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = hex;
            swatch.title = `${hex} (Clic izq: Color activo | Clic der: Color de relleno)`;

            // Left click -> Update color for currently active target mode (Contorno vs Relleno)
            swatch.addEventListener('click', () => {
                Palette.setActiveColorHex(hex);
                if (Palette.getMode() === 'background') {
                    enableFillOption();
                }
                updateColorIndicators();
            });

            // Right click -> Background/Fill color
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                Palette.setBackgroundColor(hex);
                Palette.setMode('background');
                const modeBg = document.getElementById('mode-bg');
                if (modeBg) modeBg.checked = true;
                enableFillOption();
                updateColorIndicators();
            });

            container.appendChild(swatch);
        });

        // Custom Color Picker input
        const customColorInput = document.getElementById('custom-color-input');
        if (customColorInput) {
            customColorInput.addEventListener('input', (e) => {
                Palette.setActiveColorHex(e.target.value);
                if (Palette.getMode() === 'background') {
                    enableFillOption();
                }
                updateColorIndicators();
            });
        }

        // Mode Radio buttons
        const modeFg = document.getElementById('mode-fg');
        const modeBg = document.getElementById('mode-bg');

        if (modeFg && modeBg) {
            modeFg.addEventListener('change', () => {
                if (modeFg.checked) Palette.setMode('foreground');
                if (customColorInput) customColorInput.value = Palette.getForegroundColor();
            });
            modeBg.addEventListener('change', () => {
                if (modeBg.checked) {
                    Palette.setMode('background');
                    enableFillOption();
                }
                if (customColorInput) customColorInput.value = Palette.getBackgroundColor();
            });
        }

        // Clicking dual color boxes directly changes active target mode
        const fgBox = document.getElementById('fg-color-box');
        const bgBox = document.getElementById('bg-color-box');

        if (fgBox) {
            fgBox.addEventListener('click', () => {
                Palette.setMode('foreground');
                if (modeFg) modeFg.checked = true;
                if (customColorInput) customColorInput.value = Palette.getForegroundColor();
            });
        }
        if (bgBox) {
            bgBox.addEventListener('click', () => {
                Palette.setMode('background');
                if (modeBg) modeBg.checked = true;
                enableFillOption();
                if (customColorInput) customColorInput.value = Palette.getBackgroundColor();
            });
        }

        // Opacity Slider
        const opacityInput = document.getElementById('opacity-slider');
        const opacityVal = document.getElementById('opacity-value');
        if (opacityInput) {
            opacityInput.addEventListener('input', (e) => {
                Palette.setOpacity(e.target.value);
                if (opacityVal) opacityVal.textContent = `${Math.round(e.target.value * 100)}%`;
            });
        }

        updateColorIndicators();
    }

    function updateColorIndicators() {
        const fgBox = document.getElementById('fg-color-box');
        const bgBox = document.getElementById('bg-color-box');
        const customColorInput = document.getElementById('custom-color-input');

        if (fgBox) fgBox.style.backgroundColor = Palette.getForegroundColor();
        if (bgBox) bgBox.style.backgroundColor = Palette.getBackgroundColor();
        if (customColorInput) customColorInput.value = Palette.getActiveColorHex();
    }

    function setupCanvasEvents() {
        const canvas = Canvas.getCanvas();
        if (!canvas) return;

        canvas.addEventListener('mousedown', (e) => Tools.onMouseDown(e, Canvas, Palette));
        canvas.addEventListener('mousemove', (e) => {
            Tools.onMouseMove(e, Canvas, Palette);
            const coords = Canvas.getCoordinates(e);
            updateStatusCoordinates(coords.x, coords.y);
        });
        canvas.addEventListener('mouseup', (e) => Tools.onMouseUp(e, Canvas, Palette));
        canvas.addEventListener('mouseleave', () => {
            Tools.onMouseLeave(Canvas, Palette);
            updateStatusCoordinates(null, null);
        });

        // Global mouseup event to clean drawing state if mouse released outside canvas
        window.addEventListener('mouseup', (e) => {
            if (e.target !== canvas) {
                Tools.onMouseLeave(Canvas, Palette);
            }
        });
    }

    function updateStatusCoordinates(x, y) {
        const coordsElem = document.getElementById('status-coords');
        if (!coordsElem) return;
        if (x === null || y === null) {
            coordsElem.textContent = '';
        } else {
            coordsElem.textContent = `X: ${x}px, Y: ${y}px`;
        }
    }

    function updateStatusBarDimensions() {
        const dimElem = document.getElementById('status-dimensions');
        const canvas = Canvas.getCanvas();
        if (dimElem && canvas) {
            dimElem.textContent = `${canvas.width} x ${canvas.height}px`;
        }
    }

    function updateStatusText(msg) {
        const msgElem = document.getElementById('status-msg');
        if (msgElem) msgElem.textContent = msg;
    }

    function setupWindowControls() {
        const canvasWidthInput = document.getElementById('canvas-w-input');
        const canvasHeightInput = document.getElementById('canvas-h-input');
        const applyResizeBtn = document.getElementById('apply-resize-btn');

        if (canvasWidthInput && canvasHeightInput && applyResizeBtn) {
            applyResizeBtn.addEventListener('click', () => {
                const w = parseInt(canvasWidthInput.value, 10);
                const h = parseInt(canvasHeightInput.value, 10);
                if (w > 0 && h > 0) {
                    Canvas.resize(w, h);
                    updateStatusBarDimensions();
                    closeResizeModal();
                } else {
                    alert('Por favor ingrese dimensiones válidas.');
                }
            });
        }

        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeResizeModal);
        });
    }

    function openResizeModal() {
        const modal = document.getElementById('resize-modal');
        const canvas = Canvas.getCanvas();
        if (modal && canvas) {
            document.getElementById('canvas-w-input').value = canvas.width;
            document.getElementById('canvas-h-input').value = canvas.height;
            modal.style.display = 'flex';
        }
    }

    function closeResizeModal() {
        const modal = document.getElementById('resize-modal');
        if (modal) modal.style.display = 'none';
    }

    return {
        init,
        updateStatusBarDimensions,
        updateColorIndicators
    };
})();
