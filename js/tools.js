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
    let fontFamily = 'Arial';

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    // Selection State
    let hasSelection = false;
    let isMovingSelection = false;
    let selectionX = 0;
    let selectionY = 0;
    let selectionWidth = 0;
    let selectionHeight = 0;
    let selectionCanvas = null; // Offscreen canvas for cut pixels
    let freePoints = [];
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function setTool(toolName, canvasManager) {
        if (hasSelection && toolName !== currentTool) {
            commitActiveSelection(canvasManager);
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

    // Selection helper methods
    function commitActiveSelection(canvasManager) {
        if (!hasSelection || !selectionCanvas || !canvasManager) return;
        const ctx = canvasManager.getContext();
        canvasManager.restoreSnapshot();
        ctx.drawImage(selectionCanvas, selectionX, selectionY);
        hasSelection = false;
        isMovingSelection = false;
        selectionCanvas = null;
        canvasManager.takeSnapshot();
        canvasManager.saveHistory();
    }

    function deleteActiveSelection(canvasManager) {
        if (!hasSelection || !canvasManager) return;
        hasSelection = false;
        isMovingSelection = false;
        selectionCanvas = null;
        const ctx = canvasManager.getContext();
        canvasManager.restoreSnapshot();
        canvasManager.takeSnapshot();
        canvasManager.saveHistory();
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

        // Draw cut pixels at current selection position
        ctx.drawImage(selectionCanvas, selectionX, selectionY);

        // Draw animated/dashed marquee box border
        ctx.save();
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(selectionX, selectionY, selectionWidth, selectionHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineDashOffset = 4;
        ctx.strokeRect(selectionX, selectionY, selectionWidth, selectionHeight);
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

        // Handle selection tool click
        if (currentTool === 'select-rect' || currentTool === 'select-free') {
            // Clicked inside active floating selection -> start dragging selection
            if (hasSelection &&
                coords.x >= selectionX && coords.x <= selectionX + selectionWidth &&
                coords.y >= selectionY && coords.y <= selectionY + selectionHeight) {
                isMovingSelection = true;
                dragOffsetX = coords.x - selectionX;
                dragOffsetY = coords.y - selectionY;
                return;
            }

            // Clicked outside active selection -> commit selection to canvas
            if (hasSelection) {
                commitActiveSelection(canvasManager);
            }

            startX = coords.x;
            startY = coords.y;
            lastX = coords.x;
            lastY = coords.y;
            freePoints = [{ x: coords.x, y: coords.y }];
            isDrawing = true;
            return;
        } else if (hasSelection) {
            commitActiveSelection(canvasManager);
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
            const input = prompt('Ingrese el texto a dibujar:', textContent);
            if (input !== null) {
                textContent = input;
                drawText(ctx, startX, startY, textContent);
                canvasManager.takeSnapshot();
                canvasManager.saveHistory();
            }
            isDrawing = false;
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

        // Dragging floating selection
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

        if (!isDrawing) {
            if (hasSelection) {
                drawFloatingSelection(canvasManager);
            } else {
                canvasManager.restoreSnapshot();
                if (canvasManager.isGridVisible()) canvasManager.drawGrid();
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
            if (canvasManager.isGridVisible()) canvasManager.drawGrid();

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

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            canvasManager.takeSnapshot();
            canvasManager.saveHistory();
            if (canvasManager.isGuidesVisible()) {
                canvasManager.drawGuides(endX, endY);
            }
        } else if (currentTool !== 'text' && currentTool !== 'fill') {
            canvasManager.restoreSnapshot();
            applyContextStyles(ctx, paletteManager);

            switch (currentTool) {
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
        commitActiveSelection,
        deleteActiveSelection,
        hasSelection: () => hasSelection,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave
    };
})();
