/**
 * SILICON VALLEY CYBER-SECURITY SHIELD V1.0
 * CODE NAME: OPERACIÓN CÓDIGO CIEGO
 * -----------------------------------------
 * Security Protocol for TORNEO SOMOSPADEL
 */

(function () {
    'use strict';

    // 1. TRAMPA DE DEPURACIÓN (Anti-DevTools)
    // Si alguien abre la consola, el navegador se pausará infinitamente.
    setInterval(() => {
        const startTime = performance.now();
        debugger;
        const endTime = performance.now();
        if (endTime - startTime > 100) {
            // Se detectó una pausa (DevTools abierto)
            console.warn("%c🤖 ALERTA DE SEGURIDAD SILICON VALLEY 🤖", "color: red; font-size: 20px; font-weight: bold;");
            console.log("%cSe ha detectado un intento de intrusión. Acceso denegado.", "color: orange;");
        }
    }, 1000);

    // 2. BLOQUEO DE PERÍMETRO (Eventos de Ratón y Teclado)
    document.addEventListener('contextmenu', e => e.preventDefault()); // Click derecho

    document.addEventListener('keydown', e => {
        // Bloquear F12
        if (e.key === 'F12') e.preventDefault();

        // Bloquear Ctrl+Shift+I (Inspeccionar)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault();

        // Bloquear Ctrl+Shift+J (Consola)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') e.preventDefault();

        // Bloquear Ctrl+U (Ver código fuente)
        if (e.ctrlKey && e.key === 'u') e.preventDefault();

        // Bloquear Ctrl+C (Copiar) si es necesario (Opcional, pero solicitado)
        if (e.ctrlKey && e.key === 'c' && window.getSelection().toString().length > 0) {
            e.preventDefault();
            console.log("Copiado desactivado por el Cyber-Shield.");
        }
    });

    // 3. BLOQUEO DE ARRASTRE (Anti-Save Images)
    document.addEventListener('dragstart', e => e.preventDefault());

    console.log("🛡️ Cyber-Security Shield: ACTIVADO");
})();
