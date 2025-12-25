/**
 * SOMOSPADEL - Advanced Front-end Protection Layer
 * Professional Security Hardening v5.2
 */
(function () {
    'use strict';

    // 0. Privileged Mode Detection (Bypass for Admin)
    function isAuthorized() {
        const urlParams = new URLSearchParams(window.location.search);
        const auth = sessionStorage.getItem('somospadel_admin_auth');
        return auth === 'JARABA' || auth === 'PADELCOSCO21' || urlParams.get('admin') === 'true';
    }

    // 1. Anti-Scraping Protection (Passive)
    /**
     * Note: We removed the active 'debugger' trap as it can cause 
     * performance issues for some users. 
     * We keep the event blockers for a professional hardened feel.
     */

    // 2. Global Event Blockers
    function setupEventBlockers() {
        // Block Right Click
        document.addEventListener('contextmenu', (e) => {
            if (isAuthorized()) return; // Bypass if admin
            e.preventDefault();
        }, false);

        // Block Key Combos
        document.addEventListener('keydown', (e) => {
            if (isAuthorized()) return; // Bypass if admin

            /* // F12
            if (e.keyCode === 123) {
                e.preventDefault();
                return false;
            }
            // Ctrl/Cmd + Shift + I/J/C
            if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
                e.preventDefault();
                return false;
            } */
            // Ctrl/Cmd + U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
                e.preventDefault();
                return false;
            }
            // Ctrl/Cmd + S (Save Page)
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
                e.preventDefault();
                return false;
            }
        }, false);

        // Block Drag & Drop
        document.addEventListener('dragstart', (e) => {
            if (isAuthorized()) return; // Bypass if admin
            e.preventDefault();
        }, false);
    }

    // 3. Application Lockdown
    function triggerSecurityBlock(reason) {
        console.warn('Security Alert:', reason);
        // Clear DOM for protection
        document.body.innerHTML = `
            <div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#000; color:white; font-family:sans-serif; text-align:center; padding:20px;">
                <div>
                    <h1 style="color:#ccff00; font-size:4rem;">⚠️</h1>
                    <h2>ACCESO BLOQUEADO</h2>
                    <p style="color:#888;">Se ha detectado una actividad no autorizada. Por seguridad, la aplicación e ha cerrado.</p>
                    <button onclick="location.reload()" style="background:#ccff00; border:none; padding:10px 20px; border-radius:5px; font-weight:bold; cursor:pointer; margin-top:20px;">REINTENTAR</button>
                </div>
            </div>
        `;
        throw new Error('Security Exception: Content protected');
    }

    // 4. Initialization
    function initSecurity() {
        setupEventBlockers();

        // Anti-Iframe protection
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }

        console.log("%c SOMOSPADEL SECURITY LOADED ", "background: #ccff00; color: #000; font-weight: bold; border-radius: 4px; padding: 2px 8px;");
    }

    // Execute
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }

})();
