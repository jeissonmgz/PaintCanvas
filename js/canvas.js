/**
 * Canvas Manager - Paint Canvas Retro
 * Handles canvas state, rendering context, grid overlays, guides, history (undo/redo), zoom, and image export.
 */
window.Paint = window.Paint || {};

window.Paint.Canvas = (function () {
    let canvas = null;
    let ctx = null;
    let snapshot = null;
    let historyStack = [];
    let historyStep = -1;
    const MAX_HISTORY = 30;

    let showGrid = false;
    let showGuides = true;

    // Zoom state
    let zoomLevel = 1.0;
    const ZOOM_STEPS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0];

    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        
        // Initial setup
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffffff';

        // Clear canvas with white background initially
        clearCanvas(true);
        saveHistory();
        resetZoom();
    }

    function getCanvas() {
        return canvas;
    }

    function getContext() {
        return ctx;
    }

    function clearCanvas(fillWhite = true) {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (fillWhite) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
        takeSnapshot();
    }

    function takeSnapshot() {
        if (!ctx || !canvas) return;
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function restoreSnapshot() {
        if (!ctx || !snapshot) return;
        ctx.putImageData(snapshot, 0, 0);
    }

    function drawGrid() {
        if (!showGrid || !ctx || !canvas) return;
        ctx.save();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#0000ff33';
        
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawGuides(x, y) {
        if (!showGuides || !ctx || !canvas) return;
        ctx.save();
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#0066cc';
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        ctx.restore();
    }

    function setGridVisible(visible) {
        showGrid = visible;
        if (snapshot) {
            restoreSnapshot();
            if (showGrid) drawGrid();
        }
    }

    function toggleGrid() {
        showGrid = !showGrid;
        return showGrid;
    }

    function setGuidesVisible(visible) {
        showGuides = visible;
        if (!showGuides && snapshot) {
            restoreSnapshot();
        }
    }

    function toggleGuides() {
        showGuides = !showGuides;
        if (!showGuides && snapshot) {
            restoreSnapshot();
        }
        return showGuides;
    }

    // Zoom management
    function setZoom(level) {
        zoomLevel = Math.max(0.25, Math.min(8.0, parseFloat(level) || 1.0));
        applyZoom();
        updateZoomUI();
        return zoomLevel;
    }

    function zoomIn() {
        const nextStep = ZOOM_STEPS.find(s => s > zoomLevel + 0.01);
        if (nextStep) {
            setZoom(nextStep);
        } else {
            setZoom(zoomLevel * 1.5);
        }
        return zoomLevel;
    }

    function zoomOut() {
        const prevSteps = ZOOM_STEPS.filter(s => s < zoomLevel - 0.01);
        if (prevSteps.length > 0) {
            setZoom(prevSteps[prevSteps.length - 1]);
        } else {
            setZoom(zoomLevel / 1.5);
        }
        return zoomLevel;
    }

    function resetZoom() {
        setZoom(1.0);
    }

    function applyZoom() {
        const wrapper = document.getElementById('canvas-wrapper');
        if (wrapper) {
            wrapper.style.transform = `scale(${zoomLevel})`;
        }
    }

    function updateZoomUI() {
        const zoomElem = document.getElementById('status-zoom');
        if (zoomElem) {
            zoomElem.textContent = `${Math.round(zoomLevel * 100)}%`;
        }
    }

    function getZoom() {
        return zoomLevel;
    }

    function loadProjectImage(img, width, height) {
        if (!canvas || !ctx || !img) return;

        // Reset zoom level to 100%
        zoomLevel = 1.0;
        applyZoom();
        updateZoomUI();

        // Set canvas dimensions
        canvas.width = width || img.width;
        canvas.height = height || img.height;

        // Clear canvas with white background and draw loaded image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Reset history stack for the loaded project
        historyStack = [];
        historyStep = -1;
        takeSnapshot();
        saveHistory();
    }

    function resize(newWidth, newHeight) {
        if (!canvas || !ctx) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Fill background white for expanded area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);

        ctx.drawImage(tempCanvas, 0, 0);
        takeSnapshot();
        saveHistory();
    }

    function expandDirection(direction, amount = 100) {
        if (!canvas || !ctx) return;

        const currentW = canvas.width;
        const currentH = canvas.height;
        let newW = currentW;
        let newH = currentH;
        let offsetX = 0;
        let offsetY = 0;

        if (direction === 'n' || direction === 'top') {
            newH = currentH + amount;
            offsetY = amount;
        } else if (direction === 's' || direction === 'bottom') {
            newH = currentH + amount;
        } else if (direction === 'w' || direction === 'left') {
            newW = currentW + amount;
            offsetX = amount;
        } else if (direction === 'e' || direction === 'right') {
            newW = currentW + amount;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = currentW;
        tempCanvas.height = currentH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = newW;
        canvas.height = newH;

        // Fill background white for expanded area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newW, newH);

        // Draw previous canvas content shifted by offset
        ctx.drawImage(tempCanvas, offsetX, offsetY);

        takeSnapshot();
        saveHistory();
    }

    function saveHistory() {
        if (!ctx || !canvas) return;
        // Truncate history after current step
        historyStack = historyStack.slice(0, historyStep + 1);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyStack.push(data);
        if (historyStack.length > MAX_HISTORY) {
            historyStack.shift();
        } else {
            historyStep++;
        }
    }

    function undo() {
        if (historyStep > 0) {
            historyStep--;
            const data = historyStack[historyStep];
            ctx.putImageData(data, 0, 0);
            takeSnapshot();
            return true;
        }
        return false;
    }

    function redo() {
        if (historyStep < historyStack.length - 1) {
            historyStep++;
            const data = historyStack[historyStep];
            ctx.putImageData(data, 0, 0);
            takeSnapshot();
            return true;
        }
        return false;
    }

    function exportImage(filename = 'dibujo_paint.png') {
        if (!canvas) return;
        // Restore clean snapshot before exporting to remove temporary guide lines
        restoreSnapshot();
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function getCoordinates(e) {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: Math.round((e.clientX - rect.left) * scaleX),
            y: Math.round((e.clientY - rect.top) * scaleY)
        };
    }

    return {
        init,
        getCanvas,
        getContext,
        clearCanvas,
        takeSnapshot,
        restoreSnapshot,
        drawGrid,
        drawGuides,
        setGridVisible,
        toggleGrid,
        setGuidesVisible,
        toggleGuides,
        setZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        getZoom,
        loadProjectImage,
        resize,
        expandDirection,
        saveHistory,
        undo,
        redo,
        exportImage,
        getCoordinates,
        isGridVisible: () => showGrid,
        isGuidesVisible: () => showGuides
    };
})();
