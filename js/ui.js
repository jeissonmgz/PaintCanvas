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
        if (window.Paint && window.Paint.Modal) {
            window.Paint.Modal.overrideGlobals();
        }
        setupMenuDropdowns();
        setupToolButtons();
        setupToolOptions();
        setupColorSwatches();
        setupCanvasEvents();
        setupResizeHandles();
        setupWindowControls();
        setupKeyboardShortcuts();
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
            'action-new': async () => {
                const confirmed = await window.Paint.Modal.confirm(
                    '¿Desea crear un nuevo lienzo? Se perderán los cambios no guardados.',
                    'Nuevo Lienzo'
                );
                if (confirmed) {
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
            'action-zoom-in': () => Canvas.zoomIn(),
            'action-zoom-out': () => Canvas.zoomOut(),
            'action-zoom-reset': () => Canvas.resetZoom(),
            'action-grid': () => {
                const active = Canvas.toggleGrid();
                document.getElementById('action-grid').classList.toggle('checked', active);
            },
            'action-guides': () => {
                const active = Canvas.toggleGuides();
                document.getElementById('action-guides').classList.toggle('checked', active);
            },
            'action-resize': () => openResizeModal(),
            'action-about': () => {
                window.Paint.Modal.alert(
                    'Paint Canvas Retro (Vanilla JS)\nInspirado en el clásico Microsoft Paint (Windows XP/98).\n¡Disfruta creando tu arte!',
                    'Acerca de Paint Canvas'
                );
            }
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
                Tools.setTool(toolName, Canvas);
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
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvas || !canvasContainer) return;

        // Mouse drawing events
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) return; // Ignore middle-click for drawing
            Tools.onMouseDown(e, Canvas, Palette);
        });
        canvas.addEventListener('mousemove', (e) => {
            Tools.onMouseMove(e, Canvas, Palette);
            const coords = Canvas.getCoordinates(e);
            updateStatusCoordinates(coords.x, coords.y);
        });
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 1) return;
            Tools.onMouseUp(e, Canvas, Palette);
        });
        canvas.addEventListener('mouseleave', () => {
            Tools.onMouseLeave(Canvas, Palette);
            updateStatusCoordinates(null, null);
        });

        // Always-on Mouse Wheel Zoom on canvas viewport
        canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                Canvas.zoomIn();
            } else {
                Canvas.zoomOut();
            }
        }, { passive: false });

        // Middle-Click (Scroll Wheel Button Drag Panning)
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;
        let startScrollLeft = 0;
        let startScrollTop = 0;

        canvasContainer.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle click (scroll wheel)
                e.preventDefault();
                e.stopPropagation();
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                startScrollLeft = canvasContainer.scrollLeft;
                startScrollTop = canvasContainer.scrollTop;
                canvasContainer.style.cursor = 'grabbing';
            }
        });

        // Prevent middle-click autoscroll popup icon
        canvasContainer.addEventListener('auxclick', (e) => {
            if (e.button === 1) e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const deltaX = e.clientX - panStartX;
                const deltaY = e.clientY - panStartY;
                canvasContainer.scrollLeft = startScrollLeft - deltaX;
                canvasContainer.scrollTop = startScrollTop - deltaY;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (isPanning && e.button === 1) {
                isPanning = false;
                canvasContainer.style.cursor = '';
            }
        });

        // Mobile Touch Gestures (Single finger = Draw, 2 fingers = Pinch Zoom & Pan)
        let touchStartDistance = 0;
        let touchStartZoom = 1.0;
        let touchStartScrollLeft = 0;
        let touchStartScrollTop = 0;
        let touchStartMidX = 0;
        let touchStartMidY = 0;
        let isTouchGesturing = false;

        function getTouchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function getTouchMidpoint(touches) {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2
            };
        }

        function createMouseEventFromTouch(touchEvent, type) {
            const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
            return new MouseEvent(type, {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                buttons: 1,
                bubbles: true,
                cancelable: true
            });
        }

        canvasContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                isTouchGesturing = true;
                touchStartDistance = getTouchDistance(e.touches);
                touchStartZoom = Canvas.getZoom();
                const mid = getTouchMidpoint(e.touches);
                touchStartMidX = mid.x;
                touchStartMidY = mid.y;
                touchStartScrollLeft = canvasContainer.scrollLeft;
                touchStartScrollTop = canvasContainer.scrollTop;
            } else if (e.touches.length === 1 && !isTouchGesturing && e.target === canvas) {
                const fakeEvent = createMouseEventFromTouch(e, 'mousedown');
                Tools.onMouseDown(fakeEvent, Canvas, Palette);
            }
        }, { passive: false });

        canvasContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isTouchGesturing) {
                e.preventDefault();
                
                // Pinch Zoom
                const currentDist = getTouchDistance(e.touches);
                if (touchStartDistance > 0) {
                    const scaleFactor = currentDist / touchStartDistance;
                    Canvas.setZoom(touchStartZoom * scaleFactor);
                }

                // 2-Finger Pan Scroll
                const currentMid = getTouchMidpoint(e.touches);
                const deltaX = currentMid.x - touchStartMidX;
                const deltaY = currentMid.y - touchStartMidY;
                canvasContainer.scrollLeft = touchStartScrollLeft - deltaX;
                canvasContainer.scrollTop = touchStartScrollTop - deltaY;
            } else if (e.touches.length === 1 && !isTouchGesturing && e.target === canvas) {
                e.preventDefault();
                const fakeEvent = createMouseEventFromTouch(e, 'mousemove');
                Tools.onMouseMove(fakeEvent, Canvas, Palette);
                const coords = Canvas.getCoordinates(fakeEvent);
                updateStatusCoordinates(coords.x, coords.y);
            }
        }, { passive: false });

        canvasContainer.addEventListener('touchend', (e) => {
            if (isTouchGesturing) {
                if (e.touches.length < 2) {
                    isTouchGesturing = false;
                }
            } else if (e.target === canvas) {
                const fakeEvent = createMouseEventFromTouch(e, 'mouseup');
                Tools.onMouseUp(fakeEvent, Canvas, Palette);
            }
        });

        // Global mouseup event to clean drawing state if mouse released outside canvas
        window.addEventListener('mouseup', (e) => {
            if (e.target !== canvas && e.button !== 1) {
                Tools.onMouseLeave(Canvas, Palette);
            }
        });
    }

    function setupResizeHandles() {
        const handles = document.querySelectorAll('.resize-handle');
        const canvas = Canvas.getCanvas();
        if (!canvas || !handles.length) return;

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const handleType = handle.dataset.handle;
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = canvas.width;
                const startHeight = canvas.height;

                let targetWidth = startWidth;
                let targetHeight = startHeight;

                const onMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;

                    targetWidth = startWidth;
                    targetHeight = startHeight;

                    if (handleType.includes('e')) {
                        targetWidth = Math.max(50, startWidth + deltaX);
                    } else if (handleType.includes('w')) {
                        targetWidth = Math.max(50, startWidth - deltaX);
                    }

                    if (handleType.includes('s')) {
                        targetHeight = Math.max(50, startHeight + deltaY);
                    } else if (handleType.includes('n')) {
                        targetHeight = Math.max(50, startHeight - deltaY);
                    }

                    // Live update status bar dimensions text while dragging
                    const dimElem = document.getElementById('status-dimensions');
                    if (dimElem) {
                        dimElem.textContent = `${Math.round(targetWidth)} x ${Math.round(targetHeight)}px`;
                    }
                };

                const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);

                    if (targetWidth !== startWidth || targetHeight !== startHeight) {
                        Canvas.resize(Math.round(targetWidth), Math.round(targetHeight));
                        updateStatusBarDimensions();
                    }
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        });
    }

    function setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Ignore shortcuts if typing in text inputs or modals
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (Tools.hasSelection()) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    Tools.deleteActiveSelection(Canvas);
                } else if (e.key === 'Escape' || e.key === 'Enter') {
                    e.preventDefault();
                    Tools.commitActiveSelection(Canvas);
                }
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
        const dimElem = document.getElementById('status-dimensions');
        const zoomElem = document.getElementById('status-zoom');

        // Click on status bar dimensions opens retro resize modal
        if (dimElem) {
            dimElem.addEventListener('click', openResizeModal);
        }

        // Click on status bar zoom resets to 100%
        if (zoomElem) {
            zoomElem.addEventListener('click', () => Canvas.resetZoom());
        }

        if (canvasWidthInput && canvasHeightInput && applyResizeBtn) {
            const handleApply = () => {
                const w = parseInt(canvasWidthInput.value, 10);
                const h = parseInt(canvasHeightInput.value, 10);
                if (w > 0 && h > 0) {
                    Canvas.resize(w, h);
                    updateStatusBarDimensions();
                    closeResizeModal();
                } else {
                    window.Paint.Modal.warning(
                        'Por favor ingrese dimensiones válidas en píxeles.',
                        'Tamaño del Lienzo'
                    );
                }
            };

            applyResizeBtn.addEventListener('click', handleApply);

            // Allow pressing Enter key inside modal inputs to apply resize
            const handleKeyEnter = (e) => {
                if (e.key === 'Enter') {
                    handleApply();
                }
            };

            canvasWidthInput.addEventListener('keyup', handleKeyEnter);
            canvasHeightInput.addEventListener('keyup', handleKeyEnter);
        }

        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeResizeModal);
        });
    }

    function openResizeModal() {
        const modal = document.getElementById('resize-modal');
        const canvas = Canvas.getCanvas();
        const wInput = document.getElementById('canvas-w-input');
        const hInput = document.getElementById('canvas-h-input');

        if (modal && canvas && wInput && hInput) {
            wInput.value = canvas.width;
            hInput.value = canvas.height;
            modal.style.display = 'flex';
            setTimeout(() => {
                wInput.focus();
                wInput.select();
            }, 50);
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
