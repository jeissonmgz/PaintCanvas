/**
 * Modal Module - Paint Canvas Retro
 * Provides custom Windows XP/98 style retro modal dialogs for alerts, warnings, confirmations, and prompts.
 */
window.Paint = window.Paint || {};

window.Paint.Modal = (function () {
    let overlayElem = null;

    function createModalContainer() {
        if (overlayElem) return;

        overlayElem = document.createElement('div');
        overlayElem.className = 'modal-overlay';
        overlayElem.id = 'retro-dialog-modal';
        overlayElem.style.zIndex = '2000';

        overlayElem.innerHTML = `
            <div class="modal-win retro-dialog-win">
                <div class="title-bar">
                    <div class="title-bar-text">
                        <svg class="title-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        <span id="retro-modal-title">Paint</span>
                    </div>
                    <div class="title-bar-controls">
                        <button class="win-btn close-btn" id="retro-modal-x" title="Cerrar">✕</button>
                    </div>
                </div>
                <div class="modal-body retro-dialog-body">
                    <div class="retro-dialog-content">
                        <div class="retro-dialog-icon" id="retro-modal-icon"></div>
                        <div class="retro-dialog-text" id="retro-modal-message"></div>
                    </div>
                    <div class="retro-dialog-input-container" id="retro-modal-input-wrap" style="display: none;">
                        <input type="text" id="retro-modal-input" class="retro-input" style="width: 100%; box-sizing: border-box;"/>
                    </div>
                    <div class="modal-footer retro-dialog-footer">
                        <button class="btn-retro" id="retro-modal-btn-ok">Aceptar</button>
                        <button class="btn-retro" id="retro-modal-btn-cancel" style="display: none;">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlayElem);
    }

    function show(options) {
        const {
            title = 'Paint Canvas',
            message = '',
            type = 'info', // 'info', 'warning', 'question', 'error'
            showInput = false,
            defaultValue = '',
            showCancel = false
        } = options;

        return new Promise((resolve) => {
            createModalContainer();

            const titleElem = document.getElementById('retro-modal-title');
            const msgElem = document.getElementById('retro-modal-message');
            const iconElem = document.getElementById('retro-modal-icon');
            const inputWrap = document.getElementById('retro-modal-input-wrap');
            const inputElem = document.getElementById('retro-modal-input');
            const btnOk = document.getElementById('retro-modal-btn-ok');
            const btnCancel = document.getElementById('retro-modal-btn-cancel');
            const btnX = document.getElementById('retro-modal-x');

            titleElem.textContent = title;

            // Render message text with preserved line breaks
            msgElem.innerHTML = '';
            const lines = String(message).split('\n');
            lines.forEach((line, idx) => {
                if (idx > 0) msgElem.appendChild(document.createElement('br'));
                msgElem.appendChild(document.createTextNode(line));
            });

            // Windows XP style dialog icons
            if (type === 'warning' || type === 'error') {
                iconElem.innerHTML = `
                    <svg viewBox="0 0 32 32" width="32" height="32">
                        <polygon points="16,2 31,29 1,29" fill="#FCE100" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
                        <rect x="14.5" y="10" width="3" height="11" fill="#000" rx="1"/>
                        <circle cx="16" cy="24.5" r="1.8" fill="#000"/>
                    </svg>
                `;
            } else if (type === 'question') {
                iconElem.innerHTML = `
                    <svg viewBox="0 0 32 32" width="32" height="32">
                        <circle cx="16" cy="16" r="14" fill="#0A5BC4" stroke="#000" stroke-width="1"/>
                        <text x="16" y="23" font-family="Tahoma, Arial, sans-serif" font-weight="bold" font-size="20" fill="#FFFFFF" text-anchor="middle">?</text>
                    </svg>
                `;
            } else { // info
                iconElem.innerHTML = `
                    <svg viewBox="0 0 32 32" width="32" height="32">
                        <circle cx="16" cy="16" r="14" fill="#0A5BC4" stroke="#000" stroke-width="1"/>
                        <text x="16" y="23" font-family="Tahoma, Arial, sans-serif" font-weight="bold" font-size="20" fill="#FFFFFF" text-anchor="middle">i</text>
                    </svg>
                `;
            }

            if (showInput) {
                inputWrap.style.display = 'block';
                inputElem.value = defaultValue;
            } else {
                inputWrap.style.display = 'none';
            }

            if (showCancel) {
                btnCancel.style.display = 'inline-block';
            } else {
                btnCancel.style.display = 'none';
            }

            overlayElem.style.display = 'flex';

            if (showInput) {
                setTimeout(() => {
                    inputElem.focus();
                    inputElem.select();
                }, 50);
            } else {
                setTimeout(() => btnOk.focus(), 50);
            }

            function cleanup() {
                overlayElem.style.display = 'none';
                btnOk.removeEventListener('click', onOk);
                btnCancel.removeEventListener('click', onCancel);
                btnX.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKeyDown);
            }

            function onOk() {
                cleanup();
                if (showInput) {
                    resolve(inputElem.value);
                } else if (showCancel) {
                    resolve(true);
                } else {
                    resolve(true);
                }
            }

            function onCancel() {
                cleanup();
                if (showInput) {
                    resolve(null);
                } else if (showCancel) {
                    resolve(false);
                } else {
                    resolve(false);
                }
            }

            function onKeyDown(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onOk();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            }

            btnOk.addEventListener('click', onOk);
            btnCancel.addEventListener('click', onCancel);
            btnX.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKeyDown);
        });
    }

    function alert(message, title = 'Paint Canvas') {
        let msg = message;
        let t = title;
        if (typeof message === 'object' && message !== null) {
            msg = message.message || '';
            t = message.title || title;
        }
        return show({ title: t, message: msg, type: 'info', showCancel: false });
    }

    function warning(message, title = 'Paint Canvas') {
        let msg = message;
        let t = title;
        if (typeof message === 'object' && message !== null) {
            msg = message.message || '';
            t = message.title || title;
        }
        return show({ title: t, message: msg, type: 'warning', showCancel: false });
    }

    function confirm(message, title = 'Paint Canvas') {
        let msg = message;
        let t = title;
        if (typeof message === 'object' && message !== null) {
            msg = message.message || '';
            t = message.title || title;
        }
        return show({ title: t, message: msg, type: 'question', showCancel: true });
    }

    function prompt(message, defaultValue = '', title = 'Paint Canvas') {
        let msg = message;
        let def = defaultValue;
        let t = title;
        if (typeof message === 'object' && message !== null) {
            msg = message.message || '';
            def = message.defaultValue || defaultValue;
            t = message.title || title;
        }
        return show({
            title: t,
            message: msg,
            type: 'question',
            showInput: true,
            defaultValue: def,
            showCancel: true
        });
    }

    function overrideGlobals() {
        window.alert = (msg) => {
            alert(msg, 'Paint Canvas');
        };
        window.confirm = (msg) => {
            return confirm(msg, 'Paint Canvas');
        };
        window.prompt = (msg, def) => {
            return prompt(msg, def, 'Paint Canvas');
        };
    }

    return {
        show,
        alert,
        warning,
        confirm,
        prompt,
        overrideGlobals
    };
})();
