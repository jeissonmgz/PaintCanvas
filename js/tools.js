/**
 * Tools Module - Paint Canvas Retro
 * Implements drawing tool algorithms (line, rectangle, circle, ellipse, polygon, pencil, eraser, text, fill, zoom, rectangular selection, freeform selection).
 */
window.Paint = window.Paint || {};

window.Paint.Tools = (function () {
    let currentTool = 'line'; // 'line', 'rect', 'circle', 'ellipse', 'polygon', 'pencil', 'eraser', 'text', 'fill', 'zoom', 'select-rect', 'select-free'
    
    let lineWidth = 1;
    let lineCap = 'butt';
    let strokeEnabled = true;
    let fillEnabled = false;
    let polygonSides = 3;
    let textContent = 'Texto';
    let fontSize = 20;
    let fontFamily = 'Tahoma';
    let isBold = false;
    let isItalic = false;
    let isStrikethrough = false;
    let textAlign = 'left';
    let activeTextOverlay = null;
    let textOverlayCoords = { x: 0, y: 0 };

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    // Selection State
    let hasSelection = false;
    let isMovingSelection = false;
    let activeResizeHandle = null; // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
    let resizeStartX = 0;
    let resizeStartY = 0;
    let origSelX = 0;
    let origSelY = 0;
    let origSelW = 0;
    let origSelH = 0;
    let selectionX = 0;
    let selectionY = 0;
    let selectionWidth = 0;
    let selectionHeight = 0;
    let selectionCanvas = null; // Offscreen canvas for cut or pasted pixels
    let freePoints = [];
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function getSelectionHandles() {
        if (!hasSelection) return {};
        const hSize = 8;
        const half = hSize / 2;
        const x = selectionX;
        const y = selectionY;
        const w = selectionWidth;
        const h = selectionHeight;

        return {
            nw: { x: x - half, y: y - half, w: hSize, h: hSize, cursor: 'nwse-resize' },
            n:  { x: x + w / 2 - half, y: y - half, w: hSize, h: hSize, cursor: 'ns-resize' },
            ne: { x: x + w - half, y: y - half, w: hSize, h: hSize, cursor: 'nesw-resize' },
            e:  { x: x + w - half, y: y + h / 2 - half, w: hSize, h: hSize, cursor: 'ew-resize' },
            se: { x: x + w - half, y: y + h - half, w: hSize, h: hSize, cursor: 'nwse-resize' },
            s:  { x: x + w / 2 - half, y: y + h - half, w: hSize, h: hSize, cursor: 'ns-resize' },
            sw: { x: x - half, y: y + h - half, w: hSize, h: hSize, cursor: 'nesw-resize' },
            w:  { x: x - half, y: y + h / 2 - half, w: hSize, h: hSize, cursor: 'ew-resize' }
        };
    }

    function getHandleAtCoords(cx, cy) {
        const handles = getSelectionHandles();
        for (const [name, rect] of Object.entries(handles)) {
            if (cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h) {
                return name;
            }
        }
        return null;
    }

    function setTool(toolName, canvasManager, paletteManager) {
        if (hasSelection && toolName !== currentTool) {
            commitActiveSelection(canvasManager);
        }
        if (activeTextOverlay && toolName !== 'text') {
            commitActiveTextOverlay(canvasManager, paletteManager);
        }
        currentTool = toolName;
    }

    function getTool() {
        return currentTool;
    }

    function setLineWidth(w) {
        lineWidth = Math.max(0.1, parseFloat(w) || 1);
    }

    function setLineCap(cap) {
        lineCap = cap;
    }

    function setStrokeEnabled(enabled) {
        strokeEnabled = enabled;
        if (!strokeEnabled && !fillEnabled) {
            fillEnabled = true;
        }
    }

    function setFillEnabled(enabled) {
        fillEnabled = enabled;
        if (!strokeEnabled && !fillEnabled) {
            strokeEnabled = true;
        }
    }

    function setPolygonSides(sides) {
        polygonSides = Math.max(3, parseInt(sides) || 3);
    }

    function setTextOptions(text, size, family) {
        if (text !== undefined) textContent = text;
        if (size !== undefined) fontSize = parseInt(size) || 20;
        if (family !== undefined) fontFamily = family;
    }

    function setFontFamily(family, paletteManager) {
        fontFamily = family || 'Tahoma';
        updateTextOverlayStyles(paletteManager);
    }

    function setFontSize(size, paletteManager) {
        fontSize = Math.max(8, parseInt(size, 10) || 20);
        updateTextOverlayStyles(paletteManager);
    }

    function setTextBold(bold, paletteManager) {
        isBold = !!bold;
        updateTextOverlayStyles(paletteManager);
    }

    function setTextItalic(italic, paletteManager) {
        isItalic = !!italic;
        updateTextOverlayStyles(paletteManager);
    }

    function setTextStrikethrough(strikethrough, paletteManager) {
        isStrikethrough = !!strikethrough;
        updateTextOverlayStyles(paletteManager);
    }

    function setTextAlign(align, paletteManager) {
        textAlign = align || 'left';
        updateTextOverlayStyles(paletteManager);
    }

    function autoFitTextarea(textarea) {
        if (!textarea) return;

        // Auto height adjustment based on line breaks and scrollHeight
        textarea.style.height = 'auto';
        const calcH = Math.max(fontSize * 1.5, textarea.scrollHeight + 6);
        textarea.style.height = `${calcH}px`;

        // Auto width adjustment based on canvas font measurement of the longest line
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        let fontStr = '';
        if (isItalic) fontStr += 'italic ';
        if (isBold) fontStr += 'bold ';
        fontStr += `${fontSize}px "${fontFamily}", Tahoma, sans-serif`;
        tempCtx.font = fontStr;

        const lines = textarea.value.split('\n');
        let maxLineWidth = 0;
        lines.forEach(line => {
            const w = tempCtx.measureText(line || '').width;
            if (w > maxLineWidth) maxLineWidth = w;
        });

        const minWidth = 120;
        const paddingRight = Math.max(30, fontSize * 1.5);
        const calcW = Math.ceil(maxLineWidth + paddingRight);
        textarea.style.width = `${Math.max(minWidth, calcW)}px`;
    }

    function updateTextOverlayStyles(paletteManager) {
        if (!activeTextOverlay) return;
        const fgColor = paletteManager ? paletteManager.getForegroundColor() : '#000000';
        const bgColor = paletteManager ? paletteManager.getBackgroundColor() : '#ffffff';

        activeTextOverlay.style.fontFamily = `"${fontFamily}", Tahoma, sans-serif`;
        activeTextOverlay.style.fontSize = `${fontSize}px`;
        activeTextOverlay.style.fontWeight = isBold ? 'bold' : 'normal';
        activeTextOverlay.style.fontStyle = isItalic ? 'italic' : 'normal';
        activeTextOverlay.style.textDecoration = isStrikethrough ? 'line-through' : 'none';
        activeTextOverlay.style.textAlign = textAlign;
        activeTextOverlay.style.color = fgColor;
        activeTextOverlay.style.backgroundColor = fillEnabled ? bgColor : 'transparent';
        activeTextOverlay.style.textShadow = strokeEnabled ? `-1px -1px 0 ${bgColor}, 1px -1px 0 ${bgColor}, -1px 1px 0 ${bgColor}, 1px 1px 0 ${bgColor}` : 'none';

        autoFitTextarea(activeTextOverlay);
    }

    function commitActiveTextOverlay(canvasManager, paletteManager) {
        if (!activeTextOverlay) return;

        const text = activeTextOverlay.value;
        const boxWidth = activeTextOverlay.clientWidth || 180;

        if (text && text.trim().length > 0) {
            const ctx = canvasManager.getContext();
            ctx.save();

            let fontStr = '';
            if (isItalic) fontStr += 'italic ';
            if (isBold) fontStr += 'bold ';
            fontStr += `${fontSize}px "${fontFamily}", Tahoma, sans-serif`;

            ctx.font = fontStr;
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'top';

            const lines = text.split('\n');
            const lineHeight = fontSize * 1.2;
            const fgColor = paletteManager ? paletteManager.getForegroundColor() : '#000000';
            const bgColor = paletteManager ? paletteManager.getBackgroundColor() : '#ffffff';

            const padLeft = 4;
            const padTop = 4;

            lines.forEach((line, idx) => {
                const lineY = textOverlayCoords.y + padTop + (idx * lineHeight);
                let lineX = textOverlayCoords.x + padLeft;

                if (textAlign === 'center') {
                    lineX = textOverlayCoords.x + (boxWidth / 2);
                } else if (textAlign === 'right') {
                    lineX = textOverlayCoords.x + boxWidth - padLeft;
                }

                // 1. Background Fill (Relleno de Fondo en Color 2)
                if (fillEnabled) {
                    ctx.fillStyle = bgColor;
                    const metrics = ctx.measureText(line);
                    let bgX = lineX;
                    if (textAlign === 'center') bgX = lineX - (metrics.width / 2);
                    else if (textAlign === 'right') bgX = lineX - metrics.width;
                    ctx.fillRect(bgX, lineY, metrics.width || 10, lineHeight);
                }

                // 2. Letter Contour / Outline (Contorno de letras en Color 2)
                if (strokeEnabled && lineWidth > 0) {
                    ctx.strokeStyle = bgColor;
                    ctx.lineWidth = Math.max(1, Math.min(4, lineWidth * 2));
                    ctx.strokeText(line, lineX, lineY);
                }

                // 3. Main Text Letters (Color 1)
                ctx.fillStyle = fgColor;
                ctx.fillText(line, lineX, lineY);

                // 4. Strikethrough / Subrayado (Linea en Color 1)
                if (isStrikethrough && line.length > 0) {
                    const metrics = ctx.measureText(line);
                    const textWidth = metrics.width;
                    let startXLine = lineX;
                    if (textAlign === 'center') startXLine = lineX - textWidth / 2;
                    else if (textAlign === 'right') startXLine = lineX - textWidth;

                    const strikeY = lineY + (fontSize * 0.55);
                    ctx.beginPath();
                    ctx.moveTo(startXLine, strikeY);
                    ctx.lineTo(startXLine + textWidth, strikeY);
                    ctx.strokeStyle = fgColor;
                    ctx.lineWidth = Math.max(1, fontSize / 14);
                    ctx.stroke();
                }
            });

            ctx.restore();
            canvasManager.takeSnapshot();
            canvasManager.saveHistory();
        }

        if (activeTextOverlay.parentNode) {
            activeTextOverlay.parentNode.removeChild(activeTextOverlay);
        }
        activeTextOverlay = null;
    }

    // Selection helper methods
    function commitActiveSelection(canvasManager) {
        if (!hasSelection || !selectionCanvas || !canvasManager) return;
        const ctx = canvasManager.getContext();
        canvasManager.restoreSnapshot();

        // Draw scaled selection canvas onto base canvas
        ctx.drawImage(
            selectionCanvas,
            0, 0, selectionCanvas.width, selectionCanvas.height,
            selectionX, selectionY, selectionWidth, selectionHeight
        );

        hasSelection = false;
        isMovingSelection = false;
        activeResizeHandle = null;
        selectionCanvas = null;

        canvasManager.takeSnapshot();
        canvasManager.saveHistory();

        if (window.Paint && window.Paint.UI && window.Paint.UI.saveCurrentToStorage) {
            window.Paint.UI.saveCurrentToStorage(false);
        }
    }

    function deleteActiveSelection(canvasManager) {
        if (!hasSelection || !canvasManager) return;
        hasSelection = false;
        isMovingSelection = false;
        activeResizeHandle = null;
        selectionCanvas = null;

        const ctx = canvasManager.getContext();
        canvasManager.restoreSnapshot();
        canvasManager.takeSnapshot();
        canvasManager.saveHistory();
    }

    function pasteImageFromClipboard(canvasManager, img) {
        if (!canvasManager || !img) return;

        if (hasSelection) {
            commitActiveSelection(canvasManager);
        }

        const canvas = canvasManager.getCanvas();
        if (!canvas) return;

        // Auto switch to selection tool
        currentTool = 'select-rect';
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(b => b.classList.toggle('active', b.dataset.tool === 'select-rect'));

        let w = img.width || 200;
        let h = img.height || 200;
        const maxW = canvas.width * 0.85;
        const maxH = canvas.height * 0.85;

        if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        selectionX = Math.round((canvas.width - w) / 2);
        selectionY = Math.round((canvas.height - h) / 2);
        selectionWidth = w;
        selectionHeight = h;

        selectionCanvas = document.createElement('canvas');
        selectionCanvas.width = img.width || w;
        selectionCanvas.height = img.height || h;
        const sCtx = selectionCanvas.getContext('2d');
        sCtx.drawImage(img, 0, 0);

        hasSelection = true;
        isMovingSelection = false;
        activeResizeHandle = null;

        canvasManager.takeSnapshot();
        drawFloatingSelection(canvasManager);
    }

    function cutSelection(canvasManager, type, x1, y1, x2, y2, points, paletteManager) {
        const canvas = canvasManager.getCanvas();
        const ctx = canvasManager.getContext();

        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);

        if (w < 3 || h < 3) {
            hasSelection = false;
            return;
        }

        selectionX = x;
        selectionY = y;
        selectionWidth = w;
        selectionHeight = h;

        selectionCanvas = document.createElement('canvas');
        selectionCanvas.width = w;
        selectionCanvas.height = h;
        const sCtx = selectionCanvas.getContext('2d');

        // Always fill cut hole with pure white (#ffffff)
        const cutFillColor = '#ffffff';

        if (type === 'select-rect') {
            // Copy pixels to offscreen canvas
            sCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

            // Fill cut hole in base canvas with pure white
            ctx.save();
            ctx.fillStyle = cutFillColor;
            ctx.fillRect(x, y, w, h);
            ctx.restore();
        } else if (type === 'select-free') {
            if (!points || points.length < 3) {
                hasSelection = false;
                return;
            }

            sCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

            // Apply polygon mask on offscreen canvas
            sCtx.globalCompositeOperation = 'destination-in';
            sCtx.beginPath();
            points.forEach((pt, i) => {
                const px = pt.x - x;
                const py = pt.y - y;
                if (i === 0) sCtx.moveTo(px, py);
                else sCtx.lineTo(px, py);
            });
            sCtx.closePath();
            sCtx.fill();

            // Fill cut hole in base canvas with pure white using path mask
            ctx.save();
            ctx.fillStyle = cutFillColor;
            ctx.beginPath();
            points.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        hasSelection = true;
        canvasManager.takeSnapshot();
        drawFloatingSelection(canvasManager);
    }

    function drawFloatingSelection(canvasManager) {
        if (!hasSelection || !selectionCanvas || !canvasManager) return;
        canvasManager.restoreSnapshot();
        const ctx = canvasManager.getContext();

        // Draw scaled selection canvas
        ctx.drawImage(
            selectionCanvas,
            0, 0, selectionCanvas.width, selectionCanvas.height,
            selectionX, selectionY, selectionWidth, selectionHeight
        );

        // Draw animated/dashed marquee box border
        ctx.save();
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(selectionX, selectionY, selectionWidth, selectionHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineDashOffset = 4;
        ctx.strokeRect(selectionX, selectionY, selectionWidth, selectionHeight);

        // Draw 8 retro control handle boxes (white square with 1px black outline)
        const handles = getSelectionHandles();
        Object.values(handles).forEach(h => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.setLineDash([]);
            ctx.fillRect(h.x, h.y, h.w, h.h);
            ctx.strokeRect(h.x, h.y, h.w, h.h);
        });

        ctx.restore();
    }

    // Tool Drawing Implementations
    function drawLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        if (strokeEnabled) ctx.stroke();
    }

    function drawRect(ctx, x1, y1, x2, y2) {
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);

        if (fillEnabled) ctx.fillRect(x, y, w, h);
        if (strokeEnabled) ctx.strokeRect(x, y, w, h);
    }

    function drawCircle(ctx, x1, y1, x2, y2) {
        const r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.beginPath();
        ctx.arc(x1, y1, r, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (fillEnabled) ctx.fill();
        if (strokeEnabled) ctx.stroke();
    }

    function drawEllipse(ctx, x1, y1, x2, y2) {
        const rx = Math.abs(x2 - x1);
        const ry = Math.abs(y2 - y1);
        if (rx === 0 || ry === 0) return;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x1, y1, rx, ry, 0, 0, 2 * Math.PI);
        ctx.closePath();
        if (fillEnabled) ctx.fill();
        if (strokeEnabled) ctx.stroke();
        ctx.restore();
    }

    function drawPolygon(ctx, x1, y1, x2, y2) {
        const r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        if (r === 0) return;

        let startAngle = ((x2 - x1) >= 0) ? Math.asin((y2 - y1) / r) : Math.acos((x2 - x1) / r);
        if ((x2 - x1) < 0 && (y2 - y1) < 0) {
            startAngle = Math.atan((y2 - y1) / (x2 - x1)) + Math.PI;
        }

        ctx.beginPath();
        for (let i = 0; i <= polygonSides; i++) {
            const angle = startAngle + (i * 2 * Math.PI / polygonSides);
            const px = x1 + r * Math.cos(angle);
            const py = y1 + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (fillEnabled) ctx.fill();
        if (strokeEnabled) ctx.stroke();
    }

    function drawPencil(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function drawEraser(ctx, x1, y1, x2, y2) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function drawText(ctx, x, y, text) {
        const str = text || textContent || 'Texto';
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        if (fillEnabled) ctx.fillText(str, x, y);
        if (strokeEnabled) ctx.strokeText(str, x, y);
        ctx.restore();
    }

    /**
     * Fast Linear Flood Fill Algorithm (BFS with immediate pixel mutation)
     */
    function floodFill(canvas, ctx, startX, startY, fillColorRgba) {
        const width = canvas.width;
        const height = canvas.height;
        if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const targetPos = (startY * width + startX) * 4;
        const targetR = data[targetPos];
        const targetG = data[targetPos + 1];
        const targetB = data[targetPos + 2];
        const targetA = data[targetPos + 3];

        const [fillR, fillG, fillB, fillA] = fillColorRgba;

        if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) {
            return;
        }

        function matchTarget(pos) {
            return data[pos] === targetR &&
                   data[pos + 1] === targetG &&
                   data[pos + 2] === targetB &&
                   data[pos + 3] === targetA;
        }

        function setPixel(pos) {
            data[pos] = fillR;
            data[pos + 1] = fillG;
            data[pos + 2] = fillB;
            data[pos + 3] = fillA;
        }

        const pixelStack = [[startX, startY]];
        setPixel(targetPos);

        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop();

            const neighbors = [
                [x + 1, y],
                [x - 1, y],
                [x, y + 1],
                [x, y - 1]
            ];

            for (let i = 0; i < neighbors.length; i++) {
                const [nx, ny] = neighbors[i];
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nPos = (ny * width + nx) * 4;
                    if (matchTarget(nPos)) {
                        setPixel(nPos);
                        pixelStack.push([nx, ny]);
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    function applyContextStyles(ctx, palette) {
        const fgColor = palette ? palette.getForegroundRgba() : 'rgba(0,0,0,1)';
        const bgColor = palette ? palette.getBackgroundRgba() : 'rgba(192,192,192,1)';

        ctx.lineWidth = currentTool === 'eraser' ? lineWidth * 4 : lineWidth;
        ctx.lineCap = lineCap;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = fgColor;
        ctx.fillStyle = bgColor;
    }

    function onMouseDown(e, canvasManager, paletteManager) {
        if (currentTool === 'zoom') {
            if (e.button === 2) canvasManager.zoomOut();
            else canvasManager.zoomIn();
            isDrawing = false;
            return;
        }

        const coords = canvasManager.getCoordinates(e);

        if (hasSelection) {
            // Click on one of 8 resize handles -> start resizing selection
            const handle = getHandleAtCoords(coords.x, coords.y);
            if (handle) {
                activeResizeHandle = handle;
                resizeStartX = coords.x;
                resizeStartY = coords.y;
                origSelX = selectionX;
                origSelY = selectionY;
                origSelW = selectionWidth;
                origSelH = selectionHeight;
                return;
            }

            // Click inside active floating selection -> start moving selection
            if (coords.x >= selectionX && coords.x <= selectionX + selectionWidth &&
                coords.y >= selectionY && coords.y <= selectionY + selectionHeight) {
                isMovingSelection = true;
                dragOffsetX = coords.x - selectionX;
                dragOffsetY = coords.y - selectionY;
                return;
            }

            // Click outside active selection -> commit selection to base canvas
            commitActiveSelection(canvasManager);
        }

        if (currentTool === 'select-rect' || currentTool === 'select-free') {
            startX = coords.x;
            startY = coords.y;
            lastX = coords.x;
            lastY = coords.y;
            freePoints = [{ x: coords.x, y: coords.y }];
            isDrawing = true;
            return;
        }

        startX = coords.x;
        startY = coords.y;
        lastX = coords.x;
        lastY = coords.y;
        isDrawing = true;

        // Restore clean canvas to remove hover guides before capturing baseline snapshot
        canvasManager.restoreSnapshot();
        canvasManager.takeSnapshot();

        const ctx = canvasManager.getContext();
        applyContextStyles(ctx, paletteManager);

        if (currentTool === 'pencil') {
            // Draw initial dot on mousedown for single click
            ctx.beginPath();
            ctx.arc(startX, startY, Math.max(0.5, ctx.lineWidth / 2), 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        } else if (currentTool === 'text') {
            isDrawing = false;
            const wrapper = document.getElementById('canvas-wrapper');
            if (!wrapper) return;

            if (activeTextOverlay && e.target === activeTextOverlay) {
                return;
            }

            if (activeTextOverlay) {
                commitActiveTextOverlay(canvasManager, paletteManager);
            }

            const textarea = document.createElement('textarea');
            textarea.className = 'canvas-text-input';
            textarea.style.left = `${startX}px`;
            textarea.style.top = `${startY}px`;
            textarea.style.width = '180px';
            textarea.style.height = `${Math.max(50, fontSize * 2.5)}px`;
            textarea.placeholder = 'Escriba aquí...';

            activeTextOverlay = textarea;
            textOverlayCoords = { x: startX, y: startY };

            updateTextOverlayStyles(paletteManager);

            wrapper.appendChild(textarea);
            autoFitTextarea(textarea);

            textarea.addEventListener('input', () => {
                autoFitTextarea(textarea);
            });

            setTimeout(() => {
                textarea.focus();
            }, 50);

            textarea.addEventListener('keydown', (evt) => {
                if (evt.key === 'Escape') {
                    commitActiveTextOverlay(canvasManager, paletteManager);
                }
            });
        } else if (currentTool === 'fill') {
            const rgba = paletteManager ? paletteManager.getActiveRgbaArray() : [0, 0, 0, 255];
            floodFill(canvasManager.getCanvas(), ctx, startX, startY, rgba);
            canvasManager.takeSnapshot();
            canvasManager.saveHistory();
            isDrawing = false;
        }
    }

    function onMouseMove(e, canvasManager, paletteManager) {
        if (currentTool === 'zoom') return;

        const coords = canvasManager.getCoordinates(e);
        const currentX = coords.x;
        const currentY = coords.y;
        const canvasElement = canvasManager.getCanvas();

        // 1. Dragging a resize handle
        if (hasSelection && activeResizeHandle) {
            const dx = currentX - resizeStartX;
            const dy = currentY - resizeStartY;
            const minSize = 10;

            let newX = origSelX;
            let newY = origSelY;
            let newW = origSelW;
            let newH = origSelH;

            if (activeResizeHandle.includes('e')) {
                newW = Math.max(minSize, origSelW + dx);
            }
            if (activeResizeHandle.includes('s')) {
                newH = Math.max(minSize, origSelH + dy);
            }
            if (activeResizeHandle.includes('w')) {
                const possibleW = origSelW - dx;
                if (possibleW >= minSize) {
                    newW = possibleW;
                    newX = origSelX + dx;
                }
            }
            if (activeResizeHandle.includes('n')) {
                const possibleH = origSelH - dy;
                if (possibleH >= minSize) {
                    newH = possibleH;
                    newY = origSelY + dy;
                }
            }

            selectionX = newX;
            selectionY = newY;
            selectionWidth = newW;
            selectionHeight = newH;
            drawFloatingSelection(canvasManager);
            return;
        }

        // 2. Dragging floating selection position
        if (hasSelection && isMovingSelection) {
            selectionX = currentX - dragOffsetX;
            selectionY = currentY - dragOffsetY;
            drawFloatingSelection(canvasManager);
            return;
        }

        // Dragging marquee selection boundary
        if (isDrawing && (currentTool === 'select-rect' || currentTool === 'select-free')) {
            canvasManager.restoreSnapshot();
            const ctx = canvasManager.getContext();
            ctx.save();
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#000000';

            if (currentTool === 'select-rect') {
                const x = Math.min(startX, currentX);
                const y = Math.min(startY, currentY);
                const w = Math.abs(currentX - startX);
                const h = Math.abs(currentY - startY);
                ctx.strokeRect(x, y, w, h);
            } else if (currentTool === 'select-free') {
                freePoints.push({ x: currentX, y: currentY });
                ctx.beginPath();
                freePoints.forEach((pt, i) => {
                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                });
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // Update cursor dynamically when hovering over selection box or handles
        if (hasSelection && canvasElement && !isDrawing) {
            const handle = getHandleAtCoords(currentX, currentY);
            if (handle) {
                const handles = getSelectionHandles();
                canvasElement.style.cursor = handles[handle].cursor;
            } else if (currentX >= selectionX && currentX <= selectionX + selectionWidth &&
                       currentY >= selectionY && currentY <= selectionY + selectionHeight) {
                canvasElement.style.cursor = 'move';
            } else {
                canvasElement.style.cursor = '';
            }
        } else if (canvasElement && !isDrawing && !hasSelection) {
            canvasElement.style.cursor = '';
        }

        if (!isDrawing) {
            if (hasSelection) {
                drawFloatingSelection(canvasManager);
            } else {
                canvasManager.restoreSnapshot();
                if (canvasManager.isGuidesVisible()) canvasManager.drawGuides(currentX, currentY);
            }
            lastX = currentX;
            lastY = currentY;
            return;
        }

        const ctx = canvasManager.getContext();

        if (currentTool === 'pencil') {
            applyContextStyles(ctx, paletteManager);
            drawPencil(ctx, lastX, lastY, currentX, currentY);
            lastX = currentX;
            lastY = currentY;
        } else if (currentTool === 'eraser') {
            drawEraser(ctx, lastX, lastY, currentX, currentY);
            lastX = currentX;
            lastY = currentY;
        } else {
            // Live Preview shape
            canvasManager.restoreSnapshot();
            applyContextStyles(ctx, paletteManager);

            switch (currentTool) {
                case 'line':
                    drawLine(ctx, startX, startY, currentX, currentY);
                    break;
                case 'rect':
                    drawRect(ctx, startX, startY, currentX, currentY);
                    break;
                case 'circle':
                    drawCircle(ctx, startX, startY, currentX, currentY);
                    break;
                case 'ellipse':
                    drawEllipse(ctx, startX, startY, currentX, currentY);
                    break;
                case 'polygon':
                    drawPolygon(ctx, startX, startY, currentX, currentY);
                    break;
            }

            if (canvasManager.isGuidesVisible()) {
                canvasManager.drawGuides(currentX, currentY);
            }
            lastX = currentX;
            lastY = currentY;
        }
    }

    function onMouseUp(e, canvasManager, paletteManager) {
        if (currentTool === 'zoom') return;

        if (activeResizeHandle) {
            activeResizeHandle = null;
            drawFloatingSelection(canvasManager);
            return;
        }

        if (isMovingSelection) {
            isMovingSelection = false;
            drawFloatingSelection(canvasManager);
            return;
        }

        if (isDrawing && (currentTool === 'select-rect' || currentTool === 'select-free')) {
            isDrawing = false;
            canvasManager.restoreSnapshot();
            const coords = canvasManager.getCoordinates(e);

            if (currentTool === 'select-rect') {
                cutSelection(canvasManager, 'select-rect', startX, startY, coords.x, coords.y, null, paletteManager);
            } else if (currentTool === 'select-free') {
                freePoints.push({ x: coords.x, y: coords.y });
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                freePoints.forEach(pt => {
                    minX = Math.min(minX, pt.x);
                    minY = Math.min(minY, pt.y);
                    maxX = Math.max(maxX, pt.x);
                    maxY = Math.max(maxY, pt.y);
                });
                cutSelection(canvasManager, 'select-free', minX, minY, maxX, maxY, freePoints, paletteManager);
            }
            return;
        }

        if (!isDrawing) return;
        isDrawing = false;

        const coords = canvasManager.getCoordinates(e);
        const endX = coords.x;
        const endY = coords.y;
        const ctx = canvasManager.getContext();

        canvasManager.restoreSnapshot();
        applyContextStyles(ctx, paletteManager);

        switch (currentTool) {
            case 'pencil':
                drawPencil(ctx, lastX, lastY, endX, endY);
                break;
            case 'eraser':
                drawEraser(ctx, lastX, lastY, endX, endY);
                break;
            case 'line':
                drawLine(ctx, startX, startY, endX, endY);
                break;
            case 'rect':
                drawRect(ctx, startX, startY, endX, endY);
                break;
            case 'circle':
                drawCircle(ctx, startX, startY, endX, endY);
                break;
            case 'ellipse':
                drawEllipse(ctx, startX, startY, endX, endY);
                break;
            case 'polygon':
                drawPolygon(ctx, startX, startY, endX, endY);
                break;
        }

        canvasManager.takeSnapshot();
        canvasManager.saveHistory();

        if (canvasManager.isGuidesVisible()) {
            canvasManager.drawGuides(endX, endY);
        }
    }

    function onMouseLeave(canvasManager, paletteManager) {
        if (currentTool === 'zoom') return;
        if (hasSelection && isMovingSelection) {
            isMovingSelection = false;
            drawFloatingSelection(canvasManager);
            return;
        }

        if (isDrawing) {
            canvasManager.restoreSnapshot();
            const ctx = canvasManager.getContext();

            if (currentTool !== 'pencil' && currentTool !== 'eraser' && currentTool !== 'text' && currentTool !== 'fill' && currentTool !== 'select-rect' && currentTool !== 'select-free') {
                applyContextStyles(ctx, paletteManager);
                switch (currentTool) {
                    case 'line': drawLine(ctx, startX, startY, lastX, lastY); break;
                    case 'rect': drawRect(ctx, startX, startY, lastX, lastY); break;
                    case 'circle': drawCircle(ctx, startX, startY, lastX, lastY); break;
                    case 'ellipse': drawEllipse(ctx, startX, startY, lastX, lastY); break;
                    case 'polygon': drawPolygon(ctx, startX, startY, lastX, lastY); break;
                }
            }

            isDrawing = false;
            canvasManager.takeSnapshot();
            canvasManager.saveHistory();
        } else {
            if (hasSelection) {
                drawFloatingSelection(canvasManager);
            } else {
                canvasManager.restoreSnapshot();
            }
        }
    }

    return {
        setTool,
        getTool,
        setLineWidth,
        setLineCap,
        setStrokeEnabled,
        isStrokeEnabled: () => strokeEnabled,
        setFillEnabled,
        isFillEnabled: () => fillEnabled,
        setPolygonSides,
        setTextOptions,
        setFontFamily,
        setFontSize,
        setTextBold,
        setTextItalic,
        setTextStrikethrough,
        setTextAlign,
        updateTextOverlayStyles,
        commitActiveTextOverlay,
        hasActiveTextOverlay: () => !!activeTextOverlay,
        commitActiveSelection,
        deleteActiveSelection,
        pasteImageFromClipboard,
        hasSelection: () => hasSelection,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave
    };
})();
