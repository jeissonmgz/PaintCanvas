/**
 * Tools Module - Paint Canvas Retro
 * Implements drawing tool algorithms (line, rectangle, circle, ellipse, polygon, freehand, eraser, text, fill).
 */
window.Paint = window.Paint || {};

window.Paint.Tools = (function () {
    let currentTool = 'line'; // 'line', 'rect', 'circle', 'ellipse', 'polygon', 'pencil', 'eraser', 'text', 'fill'
    
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

    function setTool(toolName) {
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
        // Ensure at least stroke or fill is enabled
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

        if (fillEnabled) {
            ctx.fillRect(x, y, w, h);
        }
        if (strokeEnabled) {
            ctx.strokeRect(x, y, w, h);
        }
    }

    function drawCircle(ctx, x1, y1, x2, y2) {
        const r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.beginPath();
        ctx.arc(x1, y1, r, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (fillEnabled) {
            ctx.fill();
        }
        if (strokeEnabled) {
            ctx.stroke();
        }
    }

    function drawEllipse(ctx, x1, y1, x2, y2) {
        const rx = Math.abs(x2 - x1);
        const ry = Math.abs(y2 - y1);
        if (rx === 0 || ry === 0) return;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x1, y1, rx, ry, 0, 0, 2 * Math.PI);
        ctx.closePath();
        if (fillEnabled) {
            ctx.fill();
        }
        if (strokeEnabled) {
            ctx.stroke();
        }
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
        if (fillEnabled) {
            ctx.fill();
        }
        if (strokeEnabled) {
            ctx.stroke();
        }
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
        ctx.strokeStyle = fgColor;
        ctx.fillStyle = bgColor;
    }

    function onMouseDown(e, canvasManager, paletteManager) {
        const coords = canvasManager.getCoordinates(e);
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

        if (currentTool === 'text') {
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
        const coords = canvasManager.getCoordinates(e);
        const currentX = coords.x;
        const currentY = coords.y;
        lastX = currentX;
        lastY = currentY;

        if (!isDrawing) {
            canvasManager.restoreSnapshot();
            if (canvasManager.isGridVisible()) canvasManager.drawGrid();
            if (canvasManager.isGuidesVisible()) canvasManager.drawGuides(currentX, currentY);
            return;
        }

        const ctx = canvasManager.getContext();

        if (currentTool === 'pencil') {
            drawPencil(ctx, lastX, lastY, currentX, currentY);
        } else if (currentTool === 'eraser') {
            drawEraser(ctx, lastX, lastY, currentX, currentY);
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
        }
    }

    function onMouseUp(e, canvasManager, paletteManager) {
        if (!isDrawing) return;
        isDrawing = false;

        const coords = canvasManager.getCoordinates(e);
        const endX = coords.x;
        const endY = coords.y;
        const ctx = canvasManager.getContext();

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            // Freehand stroke complete
            canvasManager.takeSnapshot();
            canvasManager.saveHistory();
            if (canvasManager.isGuidesVisible()) {
                canvasManager.drawGuides(endX, endY);
            }
        } else if (currentTool !== 'text' && currentTool !== 'fill') {
            // Shape complete: Restore clean base snapshot and render final shape
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

            // Update snapshot with newly drawn shape
            canvasManager.takeSnapshot();
            canvasManager.saveHistory();

            if (canvasManager.isGuidesVisible()) {
                canvasManager.drawGuides(endX, endY);
            }
        }
    }

    function onMouseLeave(canvasManager, paletteManager) {
        if (isDrawing) {
            // Restore clean state to strip temporary guides before finishing shape
            canvasManager.restoreSnapshot();
            const ctx = canvasManager.getContext();

            if (currentTool !== 'pencil' && currentTool !== 'eraser' && currentTool !== 'text' && currentTool !== 'fill') {
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
            // Clean guide lines when mouse leaves canvas area
            canvasManager.restoreSnapshot();
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
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave
    };
})();
