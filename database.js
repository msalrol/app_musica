import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Primero configura e inicializa Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXhE0i-Ikw9EYA9RL5cqsq24Kr7iAlV-4",
  authDomain: "appmusica-5b706.firebaseapp.com",
  databaseURL: "https://appmusica-5b706-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "appmusica-5b706",
  storageBucket: "appmusica-5b706.firebasestorage.app",
  messagingSenderId: "834029015585",
  appId: "1:834029015585:web:4c05809037c874c4a90960",
  measurementId: "G-BJX2B2JYXW"
};

const app = initializeApp(firebaseConfig); // ✅ Esto va antes
const db = getDatabase(app);
const auth = getAuth(app); // ✅ Ahora sí podemos obtener auth

// Opcional: prueba simple
// import { ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
// set(ref(db, 'prueba/mensaje'), '¡Funciona Firebase!');

export { db, auth };
