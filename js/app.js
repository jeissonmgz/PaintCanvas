/**
 * Main Application Entry Point - Paint Canvas Retro
 * Initializes Canvas, Palette, Tools, and UI modules on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (window.Paint) {
        window.Paint.Canvas.init('paintCanvas');
        window.Paint.Palette.init();
        window.Paint.UI.init();
        console.log('🎨 Paint Canvas Retro initialized successfully!');
    } else {
        console.error('Failed to load Paint Canvas modules.');
    }
});
