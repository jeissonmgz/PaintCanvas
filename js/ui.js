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
        setupTitleInput();
        setupMenuDropdowns();
        setupToolButtons();
        setupToolOptions();
        setupColorSwatches();
        setupCanvasEvents();
        setupResizeHandles();
        setupCardinalExpansionButtons();
        setupWindowControls();
        setupExplorerModalEvents();
        setupKeyboardShortcuts();
        setupDragAndDrop();
        setupMultiTabSync();
        if (Canvas && Canvas.setOnCanvasChange) {
            Canvas.setOnCanvasChange(() => saveCurrentToStorage(false));
        }
        updateStatusBarDimensions();
    }

    function setupTitleInput() {
        const titleInput = document.getElementById('project-title-input');
        if (!titleInput) return;

        const getSuffix = () => (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t('app.title_suffix') : '- Paint Canvas Retro';

        const syncTitle = () => {
            let val = titleInput.value.trim();
            if (!val) val = 'Sin título.png';
            document.title = `${val} ${getSuffix()}`;
            
            const Storage = window.Paint.Storage;
            if (Storage && Canvas && Canvas.getCanvas()) {
                const activeId = Storage.getActiveProjectId();
                Storage.saveProject(Canvas.getCanvas(), val, activeId);
            }
        };

        titleInput.addEventListener('input', () => {
            const val = titleInput.value.trim() || 'Sin título.png';
            document.title = `${val} ${getSuffix()}`;
        });
        titleInput.addEventListener('change', syncTitle);
        titleInput.addEventListener('blur', syncTitle);
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

        // Helper for translation key lookup
        const t = key => (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t(key) : key;

        // Menu item actions
        const actions = {
            'action-new': () => createNewCanvas(),
            'action-open-explorer': () => openExplorerModal(),
            'action-save-storage': () => saveCurrentToStorage(true),
            'action-export': () => Canvas.exportImage(),
            'action-undo': () => Canvas.undo(),
            'action-redo': () => Canvas.redo(),
            'action-paste': async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.read) {
                        const items = await navigator.clipboard.read();
                        for (const item of items) {
                            const imgType = item.types.find(t => t.startsWith('image/'));
                            if (imgType) {
                                const blob = await item.getType(imgType);
                                const img = new Image();
                                img.onload = () => {
                                    Tools.pasteImageFromClipboard(Canvas, img);
                                    updateStatusText(t('status.pasted_img'));
                                };
                                img.src = URL.createObjectURL(blob);
                                return;
                            }
                        }
                    }
                    window.Paint.Modal.info(
                        t('modal.paste_help_msg'),
                        t('modal.paste_help_title')
                    );
                } catch (err) {
                    window.Paint.Modal.info(
                        t('modal.paste_help_msg'),
                        t('modal.paste_help_title')
                    );
                }
            },
            'action-clear': () => {
                Canvas.clearCanvas(true);
                Canvas.saveHistory();
                saveCurrentToStorage(false);
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
                    t('modal.about_msg'),
                    t('modal.about_title')
                );
            },
            'action-lang-es': () => {
                if (window.Paint && window.Paint.I18n) window.Paint.I18n.setLanguage('es');
            },
            'action-lang-en': () => {
                if (window.Paint && window.Paint.I18n) window.Paint.I18n.setLanguage('en');
            },
            'action-lang-de': () => {
                if (window.Paint && window.Paint.I18n) window.Paint.I18n.setLanguage('de');
            },
            'action-lang-fr': () => {
                if (window.Paint && window.Paint.I18n) window.Paint.I18n.setLanguage('fr');
            },
            'action-lang-it': () => {
                if (window.Paint && window.Paint.I18n) window.Paint.I18n.setLanguage('it');
            },
            'action-lang-pt': () => {
                if (window.Paint && window.Paint.I18n) window.Paint.I18n.setLanguage('pt');
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
        const textOpt = document.getElementById('opt-text-options');
        if (textOpt) {
            textOpt.style.display = (toolName === 'text') ? 'block' : 'none';
        }
    }

    function setupToolOptions() {
        // Line Width Presets & Custom Input
        const presetBtns = document.querySelectorAll('.width-preset-btn');
        const customContainer = document.getElementById('opt-custom-width');
        const widthInput = document.getElementById('line-width');

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (btn.id === 'btn-custom-width') {
                    if (customContainer) customContainer.style.display = 'flex';
                    if (widthInput) {
                        widthInput.focus();
                        widthInput.select();
                        Tools.setLineWidth(widthInput.value);
                    }
                } else {
                    if (customContainer) customContainer.style.display = 'none';
                    const val = btn.dataset.width;
                    if (val) {
                        Tools.setLineWidth(val);
                        if (widthInput) widthInput.value = val;
                    }
                }
            });
        });

        if (widthInput) {
            const handleCustomChange = (e) => Tools.setLineWidth(e.target.value);
            widthInput.addEventListener('input', handleCustomChange);
            widthInput.addEventListener('change', handleCustomChange);
        }

        // Line Cap Style Buttons
        const capBtns = document.querySelectorAll('.cap-preset-btn');
        capBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                capBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cap = btn.dataset.cap;
                if (cap) {
                    Tools.setLineCap(cap);
                }
            });
        });

        // Polygon sides
        const sidesInput = document.getElementById('polygon-sides');
        if (sidesInput) {
            sidesInput.addEventListener('change', (e) => Tools.setPolygonSides(e.target.value));
        }

        // Text Formatting Options
        const fontFamilySelect = document.getElementById('text-font-family');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => Tools.setFontFamily(e.target.value, Palette));
        }

        const fontSizeInput = document.getElementById('text-font-size');
        if (fontSizeInput) {
            const handleSizeChange = (e) => Tools.setFontSize(e.target.value, Palette);
            fontSizeInput.addEventListener('input', handleSizeChange);
            fontSizeInput.addEventListener('change', handleSizeChange);
        }

        const boldBtn = document.getElementById('text-bold');
        if (boldBtn) {
            boldBtn.addEventListener('click', () => {
                boldBtn.classList.toggle('active');
                Tools.setTextBold(boldBtn.classList.contains('active'), Palette);
            });
        }

        const italicBtn = document.getElementById('text-italic');
        if (italicBtn) {
            italicBtn.addEventListener('click', () => {
                italicBtn.classList.toggle('active');
                Tools.setTextItalic(italicBtn.classList.contains('active'), Palette);
            });
        }

        const strikeBtn = document.getElementById('text-strikethrough');
        if (strikeBtn) {
            strikeBtn.addEventListener('click', () => {
                strikeBtn.classList.toggle('active');
                Tools.setTextStrikethrough(strikeBtn.classList.contains('active'), Palette);
            });
        }

        const alignSelect = document.getElementById('text-align');
        if (alignSelect) {
            alignSelect.addEventListener('change', (e) => Tools.setTextAlign(e.target.value, Palette));
        }

        // Stroke & Fill toggles
        const strokeCheck = document.getElementById('enable-stroke');
        if (strokeCheck) {
            strokeCheck.addEventListener('change', (e) => {
                Tools.setStrokeEnabled(e.target.checked);
                Tools.updateTextOverlayStyles(Palette);
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
                Tools.updateTextOverlayStyles(Palette);
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
            swatch.title = `${hex} (Clic izq: Fila activa | Clic der: Color 2 Relleno)`;

            // Left click -> Update active row color (Color 1 or Color 2 depending on row active state)
            swatch.addEventListener('click', () => {
                Palette.setActiveColorHex(hex);
                if (Palette.getMode() === 'background') {
                    enableFillOption();
                }
                updateColorIndicators();
            });

            // Right click -> Set Color 2 (Relleno / Fondo)
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                Palette.setBackgroundColor(hex);
                Palette.setMode('background');
                enableFillOption();
                updateColorIndicators();
            });

            container.appendChild(swatch);
        });

        // Individual Color Pickers for Row 1 & Row 2
        const fgCustomColor = document.getElementById('fg-custom-color');
        if (fgCustomColor) {
            fgCustomColor.addEventListener('input', (e) => {
                Palette.setForegroundColor(e.target.value);
                Palette.setMode('foreground');
                updateColorIndicators();
            });
        }

        const bgCustomColor = document.getElementById('bg-custom-color');
        if (bgCustomColor) {
            bgCustomColor.addEventListener('input', (e) => {
                Palette.setBackgroundColor(e.target.value);
                Palette.setMode('background');
                enableFillOption();
                updateColorIndicators();
            });
        }

        // Clicking Row 1 / Row 2 toggles active editing mode
        const rowFg = document.getElementById('row-fg');
        const rowBg = document.getElementById('row-bg');

        if (rowFg) {
            rowFg.addEventListener('click', () => {
                Palette.setMode('foreground');
                updateColorIndicators();
            });
        }
        if (rowBg) {
            rowBg.addEventListener('click', () => {
                Palette.setMode('background');
                enableFillOption();
                updateColorIndicators();
            });
        }

        // Opacity Slider
        const opacityInput = document.getElementById('opacity-slider');
        const opacityVal = document.getElementById('opacity-value');
        if (opacityInput) {
            opacityInput.addEventListener('input', (e) => {
                Palette.setOpacity(e.target.value);
                if (opacityVal) opacityVal.textContent = `(${Math.round(e.target.value * 100)}%)`;
                if (Tools && Tools.updateTextOverlayStyles) Tools.updateTextOverlayStyles(Palette);
            });
        }

        updateColorIndicators();
    }

    function updateColorIndicators() {
        const fgBox = document.getElementById('fg-color-box');
        const bgBox = document.getElementById('bg-color-box');
        const fgCustomColor = document.getElementById('fg-custom-color');
        const bgCustomColor = document.getElementById('bg-custom-color');
        const rowFg = document.getElementById('row-fg');
        const rowBg = document.getElementById('row-bg');

        const isFg = Palette.getMode() === 'foreground';

        if (fgBox) fgBox.style.backgroundColor = Palette.getForegroundColor();
        if (bgBox) bgBox.style.backgroundColor = Palette.getBackgroundColor();
        if (fgCustomColor) fgCustomColor.value = Palette.getForegroundColor();
        if (bgCustomColor) bgCustomColor.value = Palette.getBackgroundColor();

        if (rowFg) rowFg.classList.toggle('active', isFg);
        if (rowBg) rowBg.classList.toggle('active', !isFg);

        if (Tools && Tools.updateTextOverlayStyles) {
            Tools.updateTextOverlayStyles(Palette);
        }
    }

    function setupCanvasEvents() {
        const canvas = Canvas.getCanvas();
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvas || !canvasContainer) return;

        // Auto-commit active text overlay when clicking outside canvas/wrapper and outside text options panel
        document.addEventListener('pointerdown', (e) => {
            const wrapper = document.getElementById('canvas-wrapper');
            const optBox = document.getElementById('opt-text-options');
            if (Tools.hasActiveTextOverlay && Tools.hasActiveTextOverlay()) {
                if (wrapper && !wrapper.contains(e.target) && optBox && !optBox.contains(e.target)) {
                    Tools.commitActiveTextOverlay(Canvas, Palette);
                }
            }
        });

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

        // Mobile Touch Gestures (1 finger on canvas = Draw, 1 finger on background = Pan, 2 fingers = Pinch Zoom & Pan)
        let touchStartDistance = 0;
        let touchStartZoom = 1.0;
        let touchStartScrollLeft = 0;
        let touchStartScrollTop = 0;
        let touchStartMidX = 0;
        let touchStartMidY = 0;
        let touchStartSingleX = 0;
        let touchStartSingleY = 0;
        let isTouchGesturing = false;
        let isSingleFingerPanning = false;
        let isSingleFingerDrawing = false;

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
            if (e.touches.length >= 2) {
                e.preventDefault();
                // If drawing with 1 finger, finish stroke cleanly before switching to 2-finger gesture
                if (isSingleFingerDrawing) {
                    const upEvent = createMouseEventFromTouch(e, 'mouseup');
                    Tools.onMouseUp(upEvent, Canvas, Palette);
                    isSingleFingerDrawing = false;
                }
                isSingleFingerPanning = false;
                isTouchGesturing = true;

                touchStartDistance = getTouchDistance(e.touches);
                touchStartZoom = Canvas.getZoom();
                const mid = getTouchMidpoint(e.touches);
                touchStartMidX = mid.x;
                touchStartMidY = mid.y;
                touchStartScrollLeft = canvasContainer.scrollLeft;
                touchStartScrollTop = canvasContainer.scrollTop;
            } else if (e.touches.length === 1 && !isTouchGesturing) {
                if (e.target === canvas) {
                    e.preventDefault();
                    isSingleFingerDrawing = true;
                    isSingleFingerPanning = false;
                    const fakeEvent = createMouseEventFromTouch(e, 'mousedown');
                    Tools.onMouseDown(fakeEvent, Canvas, Palette);
                } else if (!e.target.classList.contains('resize-handle') && !e.target.classList.contains('cardinal-expand-btn')) {
                    // 1 finger on viewport background = Pan Scroll
                    isSingleFingerPanning = true;
                    isSingleFingerDrawing = false;
                    touchStartSingleX = e.touches[0].clientX;
                    touchStartSingleY = e.touches[0].clientY;
                    touchStartScrollLeft = canvasContainer.scrollLeft;
                    touchStartScrollTop = canvasContainer.scrollTop;
                }
            }
        }, { passive: false });

        canvasContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length >= 2 && isTouchGesturing) {
                e.preventDefault();
                
                // 1. Pinch Zoom
                const currentDist = getTouchDistance(e.touches);
                if (touchStartDistance > 0 && currentDist > 0) {
                    const scaleFactor = currentDist / touchStartDistance;
                    const newZoom = touchStartZoom * scaleFactor;
                    Canvas.setZoom(newZoom);
                }

                // 2. 2-Finger Pan Scroll
                const currentMid = getTouchMidpoint(e.touches);
                const deltaX = currentMid.x - touchStartMidX;
                const deltaY = currentMid.y - touchStartMidY;
                canvasContainer.scrollLeft = touchStartScrollLeft - deltaX;
                canvasContainer.scrollTop = touchStartScrollTop - deltaY;
            } else if (e.touches.length === 1 && !isTouchGesturing) {
                if (isSingleFingerDrawing && e.target === canvas) {
                    e.preventDefault();
                    const fakeEvent = createMouseEventFromTouch(e, 'mousemove');
                    Tools.onMouseMove(fakeEvent, Canvas, Palette);
                    const coords = Canvas.getCoordinates(fakeEvent);
                    updateStatusCoordinates(coords.x, coords.y);
                } else if (isSingleFingerPanning) {
                    e.preventDefault();
                    const deltaX = e.touches[0].clientX - touchStartSingleX;
                    const deltaY = e.touches[0].clientY - touchStartSingleY;
                    canvasContainer.scrollLeft = touchStartScrollLeft - deltaX;
                    canvasContainer.scrollTop = touchStartScrollTop - deltaY;
                }
            }
        }, { passive: false });

        canvasContainer.addEventListener('touchend', (e) => {
            if (isTouchGesturing) {
                if (e.touches.length < 2) {
                    isTouchGesturing = false;
                }
            } else if (isSingleFingerDrawing) {
                isSingleFingerDrawing = false;
                const fakeEvent = createMouseEventFromTouch(e, 'mouseup');
                Tools.onMouseUp(fakeEvent, Canvas, Palette);
            } else if (isSingleFingerPanning) {
                isSingleFingerPanning = false;
            }
        });

        canvasContainer.addEventListener('touchcancel', () => {
            if (isSingleFingerDrawing) {
                isSingleFingerDrawing = false;
                Tools.onMouseLeave(Canvas, Palette);
            }
            isTouchGesturing = false;
            isSingleFingerPanning = false;
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

    function setupCardinalExpansionButtons() {
        const expandBtns = document.querySelectorAll('.cardinal-expand-btn');
        expandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dir = btn.dataset.expand;
                if (dir) {
                    Canvas.expandDirection(dir, 100);
                    updateStatusBarDimensions();
                }
            });
        });
    }

    function setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Ignore shortcuts if typing in text inputs or modals
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveCurrentToStorage(true);
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                openExplorerModal();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                createNewCanvas();
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

        // Global Paste Event (Ctrl+V / Cmd+V for Images/Bitmaps)
        document.addEventListener('paste', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (blob) {
                        const img = new Image();
                        img.onload = () => {
                            Tools.pasteImageFromClipboard(Canvas, img);
                            updateStatusText('Imagen pegada desde el portapapeles. Arrastre los tiradores para cambiar el tamaño.');
                        };
                        img.src = URL.createObjectURL(blob);
                    }
                    break;
                }
            }
        });
    }

    function setupDragAndDrop() {
        const dropZone = document.body;
        const canvasContainer = document.querySelector('.canvas-container');

        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                if (canvasContainer) canvasContainer.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                if (canvasContainer) canvasContainer.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (!dt) return;

            const files = Array.from(dt.files || []);
            const imageFile = files.find(f => f.type && f.type.startsWith('image/'));

            if (imageFile) {
                const img = new Image();
                img.onload = () => {
                    Tools.pasteImageFromClipboard(Canvas, img);
                    updateStatusText(`Imagen '${imageFile.name}' agregada. Arrastre los tiradores para cambiar el tamaño.`);
                };
                img.src = URL.createObjectURL(imageFile);
            } else if (files.length > 0) {
                window.Paint.Modal.warning(
                    'Por favor arrastre únicamente archivos de imagen (PNG, JPG, WEBP, GIF, BMP, SVG).',
                    'Archivo No Soportado'
                );
            }
        }, false);
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
        const btnClose = document.getElementById('win-btn-close') || document.querySelector('.title-bar-controls .close-btn');
        const btnMinimize = document.getElementById('win-btn-minimize');

        // Close (✕) or Minimize (_) button auto-saves canvas and opens Retro File Explorer modal
        if (btnClose) {
            btnClose.addEventListener('click', (e) => {
                e.stopPropagation();
                openExplorerModal();
            });
        }

        if (btnMinimize) {
            btnMinimize.addEventListener('click', (e) => {
                e.stopPropagation();
                openExplorerModal();
            });
        }

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
                    saveCurrentToStorage(false);
                } else {
                    const t = window.Paint.I18n ? window.Paint.I18n.t : (k => k);
                    window.Paint.Modal.warning(
                        t('modal.valid_dims_msg'),
                        t('modal.warning_title')
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

    // --------------------------------------------------------------------------
    // RETRO FILE EXPLORER & STORAGE HELPERS
    // --------------------------------------------------------------------------
    let selectedExplorerId = null;
    let currentTabProjectId = null;

    function saveCurrentToStorage(showNotification = true) {
        const Storage = window.Paint.Storage;
        const titleInput = document.getElementById('project-title-input');
        const title = titleInput ? titleInput.value : 'Sin título.png';
        const canvas = Canvas.getCanvas();
        const t = key => (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t(key) : key;

        if (Canvas && Canvas.isLoadingState && Canvas.isLoadingState()) {
            return null; // Block auto-saving while canvas is initializing or loading a project
        }

        if (Storage && canvas) {
            const activeId = currentTabProjectId || Storage.getActiveProjectId();
            const saved = Storage.saveProject(canvas, title, activeId);
            if (saved) {
                currentTabProjectId = saved.id;
            }
            if (saved && showNotification) {
                const msg = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t('status.project_saved', { title: saved.title }) : `Proyecto '${saved.title}' guardado correctamente en LocalStorage.`;
                updateStatusText(msg);
                setTimeout(() => {
                    updateStatusText(t('status.default'));
                }, 4000);
            }
            return saved;
        }
        return null;
    }

    async function loadActiveOrInit() {
        const Storage = window.Paint.Storage;
        if (!Storage) return;

        const activeId = Storage.getActiveProjectId();
        let loaded = false;
        const suffix = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t('app.title_suffix') : '- Paint Canvas Retro';

        if (activeId) {
            const proj = Storage.getProject(activeId);
            if (proj) {
                currentTabProjectId = proj.id;
                loaded = await Storage.loadProject(proj, Canvas);
                if (loaded) {
                    const titleInput = document.getElementById('project-title-input');
                    if (titleInput) titleInput.value = proj.title;
                    document.title = `${proj.title} ${suffix}`;
                    updateStatusBarDimensions();
                }
            }
        }

        if (!loaded) {
            if (Canvas && Canvas.setLoading) Canvas.setLoading(false);
            const titleInput = document.getElementById('project-title-input');
            const title = titleInput ? titleInput.value : 'Sin título.png';
            const saved = saveCurrentToStorage(false);
            if (saved) currentTabProjectId = saved.id;
        } else {
            if (Canvas && Canvas.setLoading) Canvas.setLoading(false);
        }
    }

    async function createNewCanvas() {
        const Storage = window.Paint.Storage;
        saveCurrentToStorage(false);

        const t = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t : (k => k);
        const suffix = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t('app.title_suffix') : '- Paint Canvas Retro';

        const newTitle = await window.Paint.Modal.prompt(
            t('modal.new_title_prompt'),
            t('modal.new_title_heading'),
            'DibujoNuevo.png'
        );

        if (newTitle !== null && newTitle !== undefined) {
            const cleanName = newTitle.trim() || 'DibujoNuevo.png';
            Canvas.clearCanvas(true);
            Canvas.saveHistory();

            const titleInput = document.getElementById('project-title-input');
            if (titleInput) titleInput.value = cleanName;
            document.title = `${cleanName} ${suffix}`;

            currentTabProjectId = null;
            if (Storage) {
                Storage.setActiveProjectId(null); // Force new project ID
                const saved = Storage.saveProject(Canvas.getCanvas(), cleanName, null);
                if (saved) currentTabProjectId = saved.id;
            }
            updateStatusBarDimensions();
            updateStatusText(t('status.project_new', { title: cleanName }));
        }
    }

    function openExplorerModal() {
        try {
            saveCurrentToStorage(false);
        } catch (err) {
            console.error('Error auto-saving before opening file explorer:', err);
        }

        const modal = document.getElementById('explorer-modal');
        if (modal) {
            modal.style.display = 'flex';
            const searchInput = document.getElementById('exp-search-input');
            if (searchInput) searchInput.value = '';
            selectedExplorerId = currentTabProjectId || (window.Paint && window.Paint.Storage ? window.Paint.Storage.getActiveProjectId() : null);
            renderExplorerFileList('');
        }
    }

    function closeExplorerModal() {
        const modal = document.getElementById('explorer-modal');
        if (modal) modal.style.display = 'none';
    }

    function setupExplorerModalEvents() {
        const closeBtns = document.querySelectorAll('.close-explorer-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', closeExplorerModal);
        });

        const btnNew = document.getElementById('exp-btn-new');
        const sideNew = document.getElementById('exp-side-new');
        const handleNew = () => {
            closeExplorerModal();
            createNewCanvas();
        };
        if (btnNew) btnNew.addEventListener('click', handleNew);
        if (sideNew) sideNew.addEventListener('click', handleNew);

        const btnSave = document.getElementById('exp-btn-save-current');
        const sideSave = document.getElementById('exp-side-save');
        const handleSave = () => {
            saveCurrentToStorage(true);
            renderExplorerFileList(document.getElementById('exp-search-input')?.value || '');
        };
        if (btnSave) btnSave.addEventListener('click', handleSave);
        if (sideSave) sideSave.addEventListener('click', handleSave);

        const btnOpen = document.getElementById('exp-btn-open');
        if (btnOpen) {
            btnOpen.addEventListener('click', async () => {
                if (!selectedExplorerId) return;
                const Storage = window.Paint.Storage;
                const proj = Storage.getProject(selectedExplorerId);
                if (proj) {
                    currentTabProjectId = proj.id;
                    Storage.setActiveProjectId(proj.id);
                    const titleInput = document.getElementById('project-title-input');
                    if (titleInput) titleInput.value = proj.title;
                    const suffix = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t('app.title_suffix') : '- Paint Canvas Retro';
                    document.title = `${proj.title} ${suffix}`;

                    await Storage.loadProject(proj, Canvas);
                    updateStatusBarDimensions();
                    closeExplorerModal();
                    const t = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t : (k => k);
                    updateStatusText(t('status.project_loaded', { title: proj.title }));
                }
            });
        }

        const btnDelete = document.getElementById('exp-btn-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', async () => {
                if (!selectedExplorerId) return;
                const Storage = window.Paint.Storage;
                const proj = Storage.getProject(selectedExplorerId);
                if (!proj) return;

                const t = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t : (k => k);
                const confirmed = await window.Paint.Modal.confirm(
                    t('modal.confirm_delete_msg', { title: proj.title }),
                    t('modal.delete_heading')
                );

                if (confirmed) {
                    Storage.deleteProject(selectedExplorerId);
                    if (selectedExplorerId === currentTabProjectId) {
                        currentTabProjectId = null;
                    }
                    selectedExplorerId = null;
                    renderExplorerFileList(document.getElementById('exp-search-input')?.value || '');
                }
            });
        }

        const searchInput = document.getElementById('exp-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderExplorerFileList(e.target.value);
            });
        }
    }

    function setupMultiTabSync() {
        window.addEventListener('storage', (e) => {
            const Storage = window.Paint.Storage;
            if (!Storage) return;

            // Files list or metadata updated in another tab
            if (e.key === 'paint_canvas_retro_files') {
                // If Explorer Modal is open, refresh file grid in real time
                const modal = document.getElementById('explorer-modal');
                if (modal && modal.style.display !== 'none') {
                    const searchInput = document.getElementById('exp-search-input');
                    renderExplorerFileList(searchInput ? searchInput.value : '');
                }

                // Sync title if current tab's active project was renamed in another tab
                if (currentTabProjectId) {
                    const updatedProj = Storage.getProject(currentTabProjectId);
                    if (updatedProj) {
                        const titleInput = document.getElementById('project-title-input');
                        if (titleInput && titleInput.value !== updatedProj.title) {
                            titleInput.value = updatedProj.title;
                            const suffix = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t('app.title_suffix') : '- Paint Canvas Retro';
                            document.title = `${updatedProj.title} ${suffix}`;
                        }
                    }
                }
            }
        });
    }

    function renderExplorerFileList(searchTerm = '') {
        const grid = document.getElementById('explorer-file-grid');
        const statusText = document.getElementById('exp-status-text');
        const detailsPane = document.getElementById('exp-details-content');
        const btnOpen = document.getElementById('exp-btn-open');
        const btnDelete = document.getElementById('exp-btn-delete');
        const t = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t : (k => k);
        const lang = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.getLanguage() : 'es';
        const langMap = { es: 'es-ES', en: 'en-US', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT' };
        const dateLocale = langMap[lang] || 'es-ES';

        if (!grid) return;

        const Storage = window.Paint.Storage;
        let projects = Storage ? Storage.listProjects() : [];
        const activeId = Storage ? Storage.getActiveProjectId() : null;

        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            projects = projects.filter(p => p.title.toLowerCase().includes(query));
        }

        grid.innerHTML = '';

        if (projects.length === 0) {
            grid.innerHTML = `<div class="explorer-empty-msg">${t('explorer.empty_msg')}</div>`;
            if (statusText) statusText.textContent = t('explorer.objects_count', { count: 0 });
            if (btnOpen) btnOpen.disabled = true;
            if (btnDelete) btnDelete.disabled = true;
            if (detailsPane) detailsPane.innerHTML = t('explorer.details_empty');
            return;
        }

        if (statusText) statusText.textContent = t('explorer.objects_count', { count: projects.length });

        if (!selectedExplorerId || !projects.some(p => p.id === selectedExplorerId)) {
            selectedExplorerId = activeId && projects.some(p => p.id === activeId) ? activeId : projects[0].id;
        }

        const badgeOpenText = t('explorer.badge_open');

        projects.forEach(p => {
            const isSelected = p.id === selectedExplorerId;
            const isActiveCanvas = p.id === activeId;

            const card = document.createElement('div');
            card.className = `file-card ${isSelected ? 'selected' : ''} ${isActiveCanvas ? 'active-canvas' : ''}`;
            card.dataset.id = p.id;

            const dateStr = p.updatedAt ? new Date(p.updatedAt).toLocaleString(dateLocale, {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : '';

            card.innerHTML = `
                <div class="file-thumb-box">
                    <img src="${p.dataUrl}" class="file-thumb" alt="${p.title}"/>
                    ${isActiveCanvas ? `<span class="active-badge" title="Canvas">${badgeOpenText}</span>` : ''}
                </div>
                <div class="file-card-title" title="${p.title}">${p.title}</div>
                <div class="file-card-sub">${p.width}x${p.height}px • ${dateStr}</div>
            `;

            card.addEventListener('click', () => {
                grid.querySelectorAll('.file-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedExplorerId = p.id;
                updateExplorerSelectionDetails(p);
            });

            card.addEventListener('dblclick', async () => {
                selectedExplorerId = p.id;
                if (btnOpen) btnOpen.click();
            });

            grid.appendChild(card);

            if (isSelected) {
                updateExplorerSelectionDetails(p);
            }
        });
    }

    function updateExplorerSelectionDetails(project) {
        const detailsPane = document.getElementById('exp-details-content');
        const btnOpen = document.getElementById('exp-btn-open');
        const btnDelete = document.getElementById('exp-btn-delete');
        const t = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t : (k => k);
        const lang = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.getLanguage() : 'es';
        const langMap = { es: 'es-ES', en: 'en-US', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT' };
        const dateLocale = langMap[lang] || 'es-ES';

        if (btnOpen) btnOpen.disabled = false;
        if (btnDelete) btnDelete.disabled = false;

        if (detailsPane && project) {
            const dateStr = project.updatedAt ? new Date(project.updatedAt).toLocaleString(dateLocale) : '-';
            detailsPane.innerHTML = `
                <div class="detail-row"><strong>${t('explorer.detail_name')}</strong> ${project.title}</div>
                <div class="detail-row"><strong>${t('explorer.detail_size')}</strong> ${project.width} x ${project.height} px</div>
                <div class="detail-row"><strong>${t('explorer.detail_modified')}</strong> ${dateStr}</div>
                <div class="detail-row"><strong>ID:</strong> ${project.id}</div>
            `;
        }
    }

    function onLanguageChanged(lang) {
        const titleInput = document.getElementById('project-title-input');
        const val = titleInput ? (titleInput.value.trim() || 'Sin título.png') : 'Sin título.png';
        const t = (window.Paint && window.Paint.I18n) ? window.Paint.I18n.t : null;
        if (t) {
            document.title = `${val} ${t('app.title_suffix')}`;
        }

        const expModal = document.getElementById('explorer-modal');
        if (expModal && expModal.style.display !== 'none') {
            const searchInput = document.getElementById('exp-search-input');
            renderExplorerFileList(searchInput ? searchInput.value : '');
        }

        const statusMsg = document.getElementById('status-msg');
        if (statusMsg && t) {
            statusMsg.textContent = t('status.default');
        }
    }

    return {
        init,
        loadActiveOrInit,
        openExplorerModal,
        saveCurrentToStorage,
        updateStatusBarDimensions,
        updateColorIndicators,
        onLanguageChanged
    };
})();
