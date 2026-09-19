/** VS Code FX — Material Design Ripples. Safe to inject more than once. */
(() => {
    'use strict';
    const key = '__vscodeFXRipples';
    window[key]?.dispose();
    const controller = new AbortController();
    const layers = new Map();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColors = matchMedia('(forced-colors: active)');
    const controls = [
        '.part.editor .tabs-container .tab', '.monaco-button',
        '.action-item > .action-label', '.monaco-breadcrumb-item',
        '.statusbar-item-label', '.monaco-menu .action-item', '.pane-header',
        '.part.panel .terminal-tabs-entry',
        '.part.panel > .composite.title .action-item'
    ].join(',');
    function remove(layer) {
        clearTimeout(layers.get(layer));
        layers.delete(layer);
        layer.remove();
    }
    function clear() { for (const layer of layers.keys()) remove(layer); }

    document.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary || reducedMotion.matches ||
            forcedColors.matches || !(event.target instanceof Element)) return;
        if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
        const target = event.target.closest(controls);
        const workbench = target?.closest('.monaco-workbench');
        if (!workbench || workbench.matches('.hc-black, .hc-light') ||
            target.closest('.disabled, [disabled], [aria-disabled="true"]')) return;
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        if (layers.size >= 8) remove(layers.keys().next().value);
        const layer = document.createElement('div');
        layer.className = 'fx-ripple-layer';
        layer.setAttribute('aria-hidden', 'true');
        Object.assign(layer.style, {
            left: `${rect.left}px`, top: `${rect.top}px`,
            width: `${rect.width}px`, height: `${rect.height}px`,
            borderRadius: getComputedStyle(target).borderRadius
        });
        const accent = getComputedStyle(workbench).getPropertyValue('--fx-accent').trim()
            || getComputedStyle(workbench).getPropertyValue('--vscode-focusBorder').trim()
            || '#00bfff';
        layer.style.setProperty('--fx-ripple-color', accent);
        const ripple = document.createElement('span');
        ripple.className = 'fx-ripple';
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const size = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
        Object.assign(ripple.style, {
            width: `${size}px`, height: `${size}px`,
            left: `${x - size / 2}px`, top: `${y - size / 2}px`
        });
        layer.appendChild(ripple);
        document.body.appendChild(layer);
        layers.set(layer, setTimeout(() => remove(layer), 650));
        ripple.addEventListener('animationend', () => remove(layer), { once: true });
    }, { capture: true, passive: true, signal: controller.signal });

    for (const type of ['scroll', 'dragstart']) {
        document.addEventListener(type, clear, { capture: true, passive: true, signal: controller.signal });
    }
    for (const type of ['resize', 'blur']) {
        window.addEventListener(type, clear, { signal: controller.signal });
    }
    reducedMotion.addEventListener('change', clear, { signal: controller.signal });
    forcedColors.addEventListener('change', clear, { signal: controller.signal });
    window[key] = { dispose() { controller.abort(); clear(); delete window[key]; } };
})();
