/**
 * Main Application Entry Point - Paint Canvas Retro
 * Initializes Canvas, Palette, Tools, and UI modules on DOM load.
 */
document.addEventListener('DOMContentLoaded', async () => {
    if (window.Paint) {
        if (window.Paint.I18n) {
            window.Paint.I18n.init();
        }
        window.Paint.Canvas.init('paintCanvas');
        window.Paint.Palette.init();
        window.Paint.UI.init();

        // Restore active project or initialize default
        if (window.Paint.Storage && window.Paint.UI.loadActiveOrInit) {
            await window.Paint.UI.loadActiveOrInit();
        }

        console.log('🎨 Paint Canvas Retro initialized successfully!');
    } else {
        console.error('Failed to load Paint Canvas modules.');
    }
});
