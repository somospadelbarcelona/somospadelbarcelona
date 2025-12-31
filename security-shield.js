/**
 * SILICON VALLEY CYBER-SECURITY SHIELD V2.0
 * CODE NAME: OPERACIÓN CÓDIGO CIEGO - ULTRA HARDENED
 * -----------------------------------------
 */

(function () {
    'use strict';

    // 1. TRAMPA DE DEPURACIÓN AGRESIVA (Anti-DevTools)
    const heavyShield = function () {
        const startTime = performance.now();
        debugger;
        const endTime = performance.now();
        if (endTime - startTime > 50) {
            document.body.innerHTML = '<div style="background:#000;color:#ccff00;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:20px;"><div><h1>⚠️ SHIELD BREACH DETECTED</h1><p>Protocolo de seguridad activado. Acceso denegado.</p><button onclick="location.reload()" style="background:#ccff00;border:none;padding:10px 20px;margin-top:20px;cursor:pointer;font-weight:bold;">RECONECTAR</button></div></div>';
            throw new Error("Security Violation");
        }
    };
    setInterval(heavyShield, 500);

    // 2. BLOQUEO DE PERÍMETRO TOTAL
    document.addEventListener('contextmenu', e => e.preventDefault(), false);

    document.addEventListener('keydown', e => {
        // Bloquear F12 (keyCode 123)
        if (e.keyCode === 123 || e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Combinaciones Ctrl+Shift+I/J/C
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            return false;
        }

        // Bloquear Ctrl+U (Código Fuente) - Case Insensitive
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }

        // Bloquear Ctrl+S (Guardar)
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            return false;
        }

        // Bloquear Ctrl+P (Imprimir)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            return false;
        }
    }, false);

    // 3. PROTECCIÓN DE CONTENIDO
    document.addEventListener('dragstart', e => e.preventDefault(), false);

    console.log("%c🛡️ CYBER-SHIELD ULTRA: ONLINE", "background: #000; color: #ccff00; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
})();
