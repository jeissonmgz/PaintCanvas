/**
 * Palette Module - Paint Canvas Retro
 * Manages foreground/background colors, color swatches, opacity, and color conversions.
 */
window.Paint = window.Paint || {};

window.Paint.Palette = (function () {
    let foregroundColor = '#000000';
    let backgroundColor = '#ffffff'; // Default white background color
    let activeMode = 'foreground'; // 'foreground' or 'background'
    let opacity = 1.0;

    // Classic Windows 95 / XP retro color swatches (28 colors)
    const presetSwatches = [
        '#000000', '#787878', '#790000', '#7b7d00', '#007b00', '#007d7b', '#000279', '#7b007d', '#7b7d38', '#003638', '#087dff', '#00367b', '#3800ff', '#7b3600',
        '#ffffff', '#bbbbbb', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff7b', '#00ff7b', '#7bffff', '#7b7dff', '#ff007b', '#ff7d38'
    ];

    function init() {
        // Default values initialized
    }

    function setForegroundColor(hex) {
        foregroundColor = hex;
    }

    function setBackgroundColor(hex) {
        backgroundColor = hex;
    }

    function getForegroundColor() {
        return foregroundColor;
    }

    function getBackgroundColor() {
        return backgroundColor;
    }

    function setMode(mode) {
        activeMode = mode === 'background' ? 'background' : 'foreground';
    }

    function getMode() {
        return activeMode;
    }

    function setOpacity(val) {
        opacity = Math.max(0, Math.min(1, parseFloat(val) || 1.0));
    }

    function getOpacity() {
        return opacity;
    }

    function getActiveColorHex() {
        return activeMode === 'background' ? backgroundColor : foregroundColor;
    }

    function setActiveColorHex(hex) {
        if (activeMode === 'background') {
            backgroundColor = hex;
        } else {
            foregroundColor = hex;
        }
    }

    function hexToRgb(hex) {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        const num = parseInt(cleanHex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    function hexToRgbaStr(hex, alpha = opacity) {
        const { r, g, b } = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function getForegroundRgba() {
        return hexToRgbaStr(foregroundColor, opacity);
    }

    function getBackgroundRgba() {
        return hexToRgbaStr(backgroundColor, opacity);
    }

    function getForegroundArray() {
        const { r, g, b } = hexToRgb(foregroundColor);
        return [r, g, b, Math.round(opacity * 255)];
    }

    function getActiveRgbaArray() {
        const hex = getActiveColorHex();
        const { r, g, b } = hexToRgb(hex);
        return [r, g, b, Math.round(opacity * 255)];
    }

    return {
        init,
        presetSwatches,
        setForegroundColor,
        setBackgroundColor,
        getForegroundColor,
        getBackgroundColor,
        setMode,
        getMode,
        setOpacity,
        getOpacity,
        getActiveColorHex,
        setActiveColorHex,
        getForegroundRgba,
        getBackgroundRgba,
        getForegroundArray,
        getActiveRgbaArray,
        hexToRgb,
        hexToRgbaStr
    };
})();
