// ⛔ CONFIGURACIÓN DE FIREBASE
// Pega aquí los datos que te dé el panel de Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyDYeT0NirzCvUZuypXWto8Dlwyy5gAsVQE",
    authDomain: "somospadelbarcelona-5def2.firebaseapp.com",
    databaseURL: "https://somospadelbarcelona-5def2-default-rtdb.firebaseio.com",
    projectId: "somospadelbarcelona-5def2",
    storageBucket: "somospadelbarcelona-5def2.firebasestorage.app",
    messagingSenderId: "486590022834",
    appId: "1:486590022834:web:069bc966e1e11c0edb75ab",
    measurementId: "G-21KF2Q5Z90"
};

// --- NO TOCAR A PARTIR DE AQUÍ (Salvo que seas experto) ---
window.db = null;
window.isFirebaseActive = false;

if (firebaseConfig.apiKey !== "TU_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        isFirebaseActive = true;
        console.log("🔥 Firebase Live Sync: ACTIVADO");
    } catch (err) {
        console.error("❌ Error inicializando Firebase:", err);
    }
} else {
    console.warn("⚠️ Firebase no configurado. El sistema usará almacenamiento local.");
}
