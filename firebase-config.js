// ⛔ CONFIGURACIÓN DE FIREBASE
// Pega aquí los datos que te dé el panel de Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyDYeT0NirzCvUZuypXWto8Dlwyy5gAsVQE",
    authDomain: "somospadelbarcelona-5def2.firebaseapp.com",
    databaseURL: "https://somospadelbarcelona-5def2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "somospadelbarcelona-5def2",
    storageBucket: "somospadelbarcelona-5def2.firebasestorage.app",
    messagingSenderId: "486590022834",
    appId: "1:486590022834:web:069bc966e1e11c0edb75ab",
    measurementId: "G-21KF2Q5Z90"
};

// --- NO TOCAR A PARTIR DE AQUÍ (Salvo que seas experto) ---
window.db = null;
window.isFirebaseActive = false;

console.log("🔍 Iniciando configuración de Firebase...");
console.log("📋 Config recibida:", {
    apiKey: firebaseConfig.apiKey ? "✓ Presente" : "✗ Falta",
    databaseURL: firebaseConfig.databaseURL ? "✓ " + firebaseConfig.databaseURL : "✗ Falta",
    projectId: firebaseConfig.projectId
});

if (firebaseConfig.apiKey !== "TU_API_KEY") {
    try {
        // Verificar que firebase esté disponible
        if (typeof firebase === 'undefined') {
            throw new Error("Firebase SDK no está cargado. Verifica que los scripts estén en el HTML.");
        }

        console.log("🔧 Inicializando Firebase App...");
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase App inicializado correctamente");

        // Verificar que databaseURL esté presente
        if (!firebaseConfig.databaseURL) {
            throw new Error("❌ FALTA databaseURL en la configuración. Esto es OBLIGATORIO para Realtime Database.");
        }

        console.log("🔧 Inicializando Firebase Database...");
        window.db = firebase.database();

        // Verificar que db se haya creado correctamente
        if (!window.db) {
            throw new Error("firebase.database() retornó null o undefined");
        }

        window.isFirebaseActive = true;
        console.log("✅ Firebase Database inicializado correctamente");
        console.log("🔥 Firebase Live Sync: ACTIVADO");
        console.log("📡 Database URL:", firebaseConfig.databaseURL);

        // Test de conectividad
        window.db.ref('.info/connected').on('value', (snap) => {
            if (snap.val() === true) {
                console.log("🟢 Conexión con Firebase establecida");
            } else {
                console.log("🔴 Desconectado de Firebase");
            }
        });

    } catch (err) {
        console.error("❌ ERROR CRÍTICO inicializando Firebase:", err);
        console.error("📝 Detalles del error:", err.message);
        console.error("🔍 Stack:", err.stack);

        // Mostrar alerta visual al usuario
        setTimeout(() => {
            alert(`❌ ERROR DE FIREBASE:\n\n${err.message}\n\nRevisa la consola del navegador (F12) para más detalles.`);
        }, 1000);

        window.isFirebaseActive = false;
        window.db = null;
    }
} else {
    console.warn("⚠️ Firebase no configurado. El sistema usará almacenamiento local.");
}
