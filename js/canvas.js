/**
 * Canvas Manager - Paint Canvas Retro
 * Implements a 3-Layer Architecture:
 * - Bottom Layer (gridCanvas, z-index 1): Renders canvas white background and grid overlay.
 * - Middle Layer (paintCanvas, z-index 2): User's primary artwork canvas (history, localStorage, export).
 * - Top Layer (guidesCanvas, z-index 3): Alignment guides and crosshairs overlay.
 */
window.Paint = window.Paint || {};

window.Paint.Canvas = (function () {
    let canvas = null;       // Middle layer: user paint canvas
    let ctx = null;
    let gridCanvas = null;   // Bottom layer: background & grid
    let gridCtx = null;
    let guidesCanvas = null; // Top layer: crosshair guides
    let guidesCtx = null;

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

        gridCanvas = document.getElementById('gridCanvas');
        if (gridCanvas) gridCtx = gridCanvas.getContext('2d');

        guidesCanvas = document.getElementById('guidesCanvas');
        if (guidesCanvas) guidesCtx = guidesCanvas.getContext('2d');

        // Initial setup for paint canvas context
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffffff';

        syncLayerDimensions();
        drawGrid();
        clearCanvas(true);
        saveHistory();
        resetZoom();
    }

    function syncLayerDimensions() {
        if (!canvas) return;
        if (gridCanvas) {
            gridCanvas.width = canvas.width;
            gridCanvas.height = canvas.height;
        }
        if (guidesCanvas) {
            guidesCanvas.width = canvas.width;
            guidesCanvas.height = canvas.height;
        }
        applyZoom();
    }

    function getCanvas() {
        return canvas;
    }

    function getContext() {
        return ctx;
    }

    function getGridCanvas() {
        return gridCanvas;
    }

    function getGuidesCanvas() {
        return guidesCanvas;
    }

    /**
     * Clears user drawing layer (middle canvas) and top guides layer.
     */
    function clearCanvas(fillWhite = true) {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (fillWhite) {
            // Fill background white on paint layer to maintain opaque artwork baseline
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
        clearGuides();
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

    /**
     * Renders background color and grid lines ONCE on bottom layer (gridCanvas).
     */
    function drawGrid() {
        if (!gridCtx || !gridCanvas) return;
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        gridCtx.save();
        gridCtx.fillStyle = '#ffffff';
        gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

        if (showGrid) {
            gridCtx.lineWidth = 0.5;
            gridCtx.strokeStyle = '#0000ff33';
            
            for (let x = 0; x < gridCanvas.width; x += 20) {
                gridCtx.beginPath();
                gridCtx.moveTo(x, 0);
                gridCtx.lineTo(x, gridCanvas.height);
                gridCtx.stroke();
            }
            for (let y = 0; y < gridCanvas.height; y += 20) {
                gridCtx.beginPath();
                gridCtx.moveTo(0, y);
                gridCtx.lineTo(gridCanvas.width, y);
                gridCtx.stroke();
            }
        }
        gridCtx.restore();
    }

    /**
     * Renders alignment crosshair guides on top layer (guidesCanvas).
     */
    function drawGuides(x, y) {
        if (!guidesCtx || !guidesCanvas) return;
        guidesCtx.clearRect(0, 0, guidesCanvas.width, guidesCanvas.height);

        if (!showGuides || x === null || y === null || x === undefined || y === undefined) {
            return;
        }

        guidesCtx.save();
        guidesCtx.lineWidth = 0.5;
        guidesCtx.setLineDash([4, 4]);
        guidesCtx.strokeStyle = '#0066cc';

        guidesCtx.beginPath();
        guidesCtx.moveTo(x, 0);
        guidesCtx.lineTo(x, guidesCanvas.height);
        guidesCtx.stroke();

        guidesCtx.beginPath();
        guidesCtx.moveTo(0, y);
        guidesCtx.lineTo(guidesCanvas.width, y);
        guidesCtx.stroke();

        guidesCtx.restore();
    }

    function clearGuides() {
        if (!guidesCtx || !guidesCanvas) return;
        guidesCtx.clearRect(0, 0, guidesCanvas.width, guidesCanvas.height);
    }

    function setGridVisible(visible) {
        showGrid = !!visible;
        drawGrid();
    }

    function toggleGrid() {
        showGrid = !showGrid;
        drawGrid();
        return showGrid;
    }

    function setGuidesVisible(visible) {
        showGuides = !!visible;
        if (!showGuides) {
            clearGuides();
        }
    }

    function toggleGuides() {
        showGuides = !showGuides;
        if (!showGuides) {
            clearGuides();
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
        if (wrapper && canvas) {
            wrapper.style.transform = `scale(${zoomLevel})`;
            const scaledWidth = canvas.width * zoomLevel;
            const scaledHeight = canvas.height * zoomLevel;
            wrapper.style.marginRight = `${Math.max(0, scaledWidth - canvas.width)}px`;
            wrapper.style.marginBottom = `${Math.max(0, scaledHeight - canvas.height)}px`;
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

        isLoading = true;

        // Reset zoom level to 100%
        zoomLevel = 1.0;
        applyZoom();
        updateZoomUI();

        // Set canvas dimensions
        canvas.width = width || img.width;
        canvas.height = height || img.height;
        syncLayerDimensions();

        // Clear canvas with white background and draw loaded image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Update bottom and top layers
        drawGrid();
        clearGuides();

        // Reset history stack for the loaded project baseline
        historyStack = [];
        historyStep = -1;
        takeSnapshot();

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyStack.push(data);
        historyStep = 0;

        isLoading = false;
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
        syncLayerDimensions();

        // Fill background white for expanded area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);

        ctx.drawImage(tempCanvas, 0, 0);

        drawGrid();
        clearGuides();
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
        syncLayerDimensions();

        // Fill background white for expanded area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newW, newH);

        // Draw previous canvas content shifted by offset
        ctx.drawImage(tempCanvas, offsetX, offsetY);

        drawGrid();
        clearGuides();
        takeSnapshot();
        saveHistory();
    }

    let onCanvasChangeCallback = null;
    let changeDebounceTimer = null;
    let isLoading = true;

    function setOnCanvasChange(cb) {
        onCanvasChangeCallback = cb;
    }

    function setLoading(loadingState) {
        isLoading = !!loadingState;
    }

    function isLoadingState() {
        return isLoading;
    }

    function notifyCanvasChanged() {
        if (isLoading) return;

        if (changeDebounceTimer) clearTimeout(changeDebounceTimer);
        changeDebounceTimer = setTimeout(() => {
            if (typeof onCanvasChangeCallback === 'function') {
                onCanvasChangeCallback();
            } else if (window.Paint && window.Paint.UI && window.Paint.UI.saveCurrentToStorage) {
                window.Paint.UI.saveCurrentToStorage(false);
            }
        }, 100);
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
        notifyCanvasChanged();
    }

    function undo() {
        if (historyStep > 0) {
            historyStep--;
            const data = historyStack[historyStep];
            ctx.putImageData(data, 0, 0);
            takeSnapshot();
            notifyCanvasChanged();
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
            notifyCanvasChanged();
            return true;
        }
        return false;
    }

    /**
     * Generates a clean PNG Data URL containing only user artwork on white background.
     * Guaranteed 100% free of grid lines or guide lines.
     */
    function getCleanDataUrl() {
        if (!canvas) return '';
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Solid white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw middle layer artwork
        tempCtx.drawImage(canvas, 0, 0);

        return tempCanvas.toDataURL('image/png');
    }

    function exportImage(filename = 'dibujo_paint.png') {
        if (!canvas) return;
        clearGuides();
        const link = document.createElement('a');
        link.download = filename;
        link.href = getCleanDataUrl();
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
        getGridCanvas,
        getGuidesCanvas,
        syncLayerDimensions,
        clearCanvas,
        takeSnapshot,
        restoreSnapshot,
        drawGrid,
        drawGuides,
        clearGuides,
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
        setLoading,
        isLoadingState,
        resize,
        expandDirection,
        saveHistory,
        setOnCanvasChange,
        undo,
        redo,
        getCleanDataUrl,
        exportImage,
        getCoordinates,
        isGridVisible: () => showGrid,
        isGuidesVisible: () => showGuides
    };
})();
